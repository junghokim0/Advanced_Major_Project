from io import BytesIO
import os
import random
import time

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from PIL import Image, UnidentifiedImageError
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
import uvicorn


APP_TITLE = "Hair Loss AI Server"
PATTERN_CROWN = "crown"
PATTERN_M_LINE = "m_line"
VALID_PATTERN_TYPES = {PATTERN_CROWN, PATTERN_M_LINE}

DEFAULT_CROWN_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "bestmodel",
    "best_model.pth",
)
DEFAULT_MLINE_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "bestmodel",
    "best_model_mline.pth",
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


def load_model_bundle(model_path: str):
    if not os.path.exists(model_path):
        return None

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


def normalize_pattern_type(pattern_type: str) -> str:
    normalized = (pattern_type or PATTERN_CROWN).strip().lower()
    if normalized not in VALID_PATTERN_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid patternType. Use one of: {', '.join(sorted(VALID_PATTERN_TYPES))}",
        )
    return normalized


def apply_user_perception_correction(predicted_class: int, class1: float, class2: float, class3: float):
    corrected = False
    correction_reason = None
    final_class = predicted_class

    if predicted_class == 2 and 0.50 <= class2 <= 0.60 and class3 < 0.10 and class1 >= 0.30:
        final_class = 1
        corrected = True
        correction_reason = (
            "경계 구간 보정 적용: class2가 50~60%, class3가 10% 미만, class1이 30% 이상으로 "
            "판단되어 최종 클래스를 class1으로 보정했습니다."
        )

    return final_class, corrected, correction_reason


def build_analysis_response(
    *,
    pattern_type: str,
    raw_predicted_class: int,
    predicted_class: int,
    class1: float,
    class2: float,
    class3: float,
    corrected: bool = False,
    correction_reason: str | None = None,
    engine: str,
):
    probs = [class1, class2, class3]
    return {
        "patternType": pattern_type,
        "engine": engine,
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


def analyze_with_model(bundle: dict, pil_image: Image.Image, pattern_type: str):
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
    raw_predicted_class = int(torch.argmax(probabilities).item()) + 1
    if pattern_type == PATTERN_CROWN:
        predicted_class, corrected, correction_reason = apply_user_perception_correction(
            raw_predicted_class, class1, class2, class3
        )
    else:
        predicted_class = raw_predicted_class
        corrected = False
        correction_reason = None

    return build_analysis_response(
        pattern_type=pattern_type,
        raw_predicted_class=raw_predicted_class,
        predicted_class=predicted_class,
        class1=class1,
        class2=class2,
        class3=class3,
        corrected=corrected,
        correction_reason=correction_reason,
        engine="model",
    )


def analyze_with_mock(pattern_type: str):
    time.sleep(0.8)
    raw = [random.random(), random.random(), random.random()]
    total = sum(raw)
    class1, class2, class3 = (value / total for value in raw)
    probs = [class1, class2, class3]
    raw_predicted_class = probs.index(max(probs)) + 1

    return build_analysis_response(
        pattern_type=pattern_type,
        raw_predicted_class=raw_predicted_class,
        predicted_class=raw_predicted_class,
        class1=class1,
        class2=class2,
        class3=class3,
        corrected=False,
        correction_reason=None,
        engine="mock",
    )


crown_bundle = load_model_bundle(os.getenv("AI_MODEL_PATH", DEFAULT_CROWN_MODEL_PATH))
if crown_bundle is None:
    raise FileNotFoundError(
        f"Crown model file not found: {os.getenv('AI_MODEL_PATH', DEFAULT_CROWN_MODEL_PATH)}"
    )

mline_bundle = load_model_bundle(os.getenv("AI_MLINE_MODEL_PATH", DEFAULT_MLINE_MODEL_PATH))

app = FastAPI(title=APP_TITLE)


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "unified-ai-server",
        "patterns": {
            PATTERN_CROWN: {
                "engine": "model",
                "modelPath": crown_bundle["model_path"],
            },
            PATTERN_M_LINE: {
                "engine": "model" if mline_bundle else "mock",
                "modelPath": mline_bundle["model_path"] if mline_bundle else None,
            },
        },
        "device": str(crown_bundle["device"]),
    }


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    patternType: str | None = Form(None),
    pattern_type_query: str | None = Query(None, alias="patternType"),
):
    pattern_type = normalize_pattern_type(patternType or pattern_type_query or PATTERN_CROWN)

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Image file is empty.")

    try:
        pil_image = Image.open(BytesIO(raw)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Invalid image format.") from exc

    if pattern_type == PATTERN_CROWN:
        return analyze_with_model(crown_bundle, pil_image, pattern_type)

    if mline_bundle is not None:
        return analyze_with_model(mline_bundle, pil_image, pattern_type)

    return analyze_with_mock(pattern_type)


if __name__ == "__main__":
    host = os.getenv("AI_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVER_PORT", "8000"))
    uvicorn.run("api_server:app", host=host, port=port, reload=False)
