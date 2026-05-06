from io import BytesIO
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
import uvicorn


APP_TITLE = "Hair Loss AI Server"
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "bestmodel",
    "best_model.pth",
)


def create_model(num_classes: int = 3) -> nn.Module:
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


def get_transform() -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def load_inference_bundle():
    model_path = os.getenv("AI_MODEL_PATH", DEFAULT_MODEL_PATH)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = create_model(num_classes=3)
    state = torch.load(model_path, map_location=device)
    model.load_state_dict(state)
    model.to(device)
    model.eval()

    return {
        "device": device,
        "model": model,
        "transform": get_transform(),
        "model_path": model_path,
    }


app = FastAPI(title=APP_TITLE)
bundle = load_inference_bundle()


def apply_user_perception_correction(predicted_class: int, class1: float, class2: float, class3: float):
    corrected = False
    correction_reason = None
    final_class = predicted_class

    # Streamlit 데모(service.py)와 동일한 경계 보정 규칙
    if predicted_class == 2 and 0.50 <= class2 <= 0.60 and class3 < 0.10 and class1 >= 0.30:
        final_class = 1
        corrected = True
        correction_reason = (
            "경계 구간 보정 적용: class2가 50~60%, class3가 10% 미만, class1이 30% 이상으로 "
            "판단되어 최종 클래스를 class1으로 보정했습니다."
        )

    return final_class, corrected, correction_reason


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "real-ai-server",
        "modelPath": bundle["model_path"],
        "device": str(bundle["device"]),
    }


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Image file is empty.")

    try:
        pil_image = Image.open(BytesIO(raw)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Invalid image format.") from exc

    transform = bundle["transform"]
    model = bundle["model"]
    device = bundle["device"]

    input_tensor = transform(pil_image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs, dim=1)[0]

    class1 = float(probabilities[0].item())
    class2 = float(probabilities[1].item())
    class3 = float(probabilities[2].item())
    probs = [class1, class2, class3]
    raw_predicted_class = int(torch.argmax(probabilities).item()) + 1
    predicted_class, corrected, correction_reason = apply_user_perception_correction(
        raw_predicted_class, class1, class2, class3
    )

    return {
        "rawPredictedClass": raw_predicted_class,
        "predictedClass": predicted_class,
        "probabilities": {
            "class1": round(class1, 4),
            "class2": round(class2, 4),
            "class3": round(class3, 4),
        },
        "confidence": round(max(probs), 4),
        "corrected": corrected,
        "correctionReason": correction_reason,
    }


if __name__ == "__main__":
    host = os.getenv("AI_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVER_PORT", "8000"))
    uvicorn.run("api_server:app", host=host, port=port, reload=False)
