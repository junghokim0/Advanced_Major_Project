
# terminal에서 아래 명령어 입력
# streamlit 설치(없는 경우)pip install streamlit
# cd C:\Users\User\Desktop\초과학기\전심프\ai비전 -> 자기 컴퓨터에서 해당 경로로 이동
# streamlit run service.py


import streamlit as st
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms
import torchvision.models as models

# ======================================
# 모델 경로
# ======================================

# 모델 파일 경로를 자신의 환경에 맞게 수정
MODEL_PATH = r"C:\Users\User\Desktop\초과학기\전심프\ai비전\bestmodel\best_model.pth"

# ======================================
# 기본 설정
# ======================================
st.set_page_config(
    page_title="탈모 단계 AI 분석",
    page_icon="🧠",
    layout="centered"
)

# ======================================
# CSS 스타일
# ======================================
st.markdown("""
<style>
.main {
    background-color: #f8fafc;
}

.title-box {
    background: linear-gradient(135deg, #2563eb, #14b8a6);
    padding: 28px;
    border-radius: 22px;
    color: white;
    text-align: center;
    margin-bottom: 25px;
}

.title-box h1 {
    margin-bottom: 8px;
    font-size: 34px;
}

.title-box p {
    font-size: 16px;
    opacity: 0.95;
}

.result-card {
    background-color: white;
    padding: 24px;
    border-radius: 20px;
    box-shadow: 0px 8px 24px rgba(15, 23, 42, 0.08);
    margin-top: 20px;
}

.prediction {
    font-size: 28px;
    font-weight: 800;
    color: #2563eb;
    text-align: center;
}

.sub-text {
    text-align: center;
    color: #64748b;
    margin-bottom: 18px;
}

.prob-row {
    margin-bottom: 18px;
}

.prob-label {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    margin-bottom: 6px;
}

.notice-box {
    background-color: #fff7ed;
    color: #9a3412;
    padding: 16px;
    border-radius: 16px;
    font-size: 14px;
    margin-top: 22px;
}
</style>
""", unsafe_allow_html=True)

# ======================================
# Header
# ======================================
st.markdown("""
<div class="title-box">
    <h1>탈모 단계 AI 분석</h1>
    <p>모발 이미지를 업로드하면 AI가 단계별 확률을 분석합니다.</p>
</div>
""", unsafe_allow_html=True)

# ======================================
# Device / Class
# ======================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class_names = ["정상 단계", "의심 단계", "진행 단계"]

display_names = {
    "정상 단계": "정상 단계",
    "의심 단계": "의심(부분 탈모)단계",
    "진행 단계": "진행 단계"
}

# ======================================
# Model
# ======================================
def create_model(num_classes=3):
    model = models.efficientnet_b0(weights=None)

    in_features = model.classifier[1].in_features

    model.classifier[1] = nn.Linear(
        in_features,
        num_classes
    )

    return model

test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

@st.cache_resource
def load_model():
    model = create_model(num_classes=3)

    model.load_state_dict(
        torch.load(
            MODEL_PATH,
            map_location=device
        )
    )

    model = model.to(device)
    model.eval()

    return model

model = load_model()

# ======================================
# Predict
# ======================================
def predict_image(image):
    image = image.convert("RGB")

    input_tensor = test_transform(image)
    input_tensor = input_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probs = F.softmax(outputs, dim=1)[0]

    # 각 클래스 확률
    prob_1 = probs[0].item()
    prob_3 = probs[1].item()
    prob_5 = probs[2].item()

    # 기본 예측
    pred_idx = torch.argmax(probs).item()
    correction_reason = None
    # ======================================
    # 후처리 규칙
    # ======================================

    # 3단계로 예측되었을 때
    if pred_idx == 1:

        # 3단계 확률이 애매한 경우
        if 0.50 <= prob_3 <= 0.60:

            # 5단계 가능성이 매우 낮고
            # 1단계 확률이 어느 정도 높으면
            if prob_5 < 0.10 and prob_1 >= 0.30:

                # 1단계로 보정
                pred_idx = 0
                correction_reason = (
    f"AI 분석 결과, 의심(부분 탈모)단계 확률이 {prob_3 * 100:.2f}%로 가장 높게 나타났지만 "
    f"정상 단계 확률 또한 {prob_1 * 100:.2f}%로 유사하게 분석되었습니다. "
    f"반면 진행 단계 가능성은 {prob_5 * 100:.2f}%로 매우 낮게 나타났습니다. "
    f"이를 종합적으로 고려했을 때, 본 이미지는 정상 단계와 의심(부분 탈모)단계 사이의 경계 구간으로 판단되며 "
    f"심한 탈모 진행 가능성은 낮은 편으로 분석됩니다."
                )
    pred_class = class_names[pred_idx]

    return pred_class, probs, correction_reason
# ======================================
# UI
# ======================================
uploaded_file = st.file_uploader(
    "분석할 이미지를 업로드하세요",
    type=["jpg", "jpeg", "png"]
)

if uploaded_file is not None:
    image = Image.open(uploaded_file)

    st.image(
        image,
        caption="업로드한 이미지",
        use_container_width=True
    )

    with st.spinner("AI가 이미지를 분석하는 중입니다..."):
        pred_class, probs, correction_reason = predict_image(image)
    
    st.markdown('<div class="result-card">', unsafe_allow_html=True)

    st.markdown(
        f"""
        <div class="prediction">{display_names[pred_class]}</div>
        <div class="sub-text">가장 높은 확률로 예측된 결과입니다.</div>
        """,
        unsafe_allow_html=True
    )

    st.subheader("클래스별 예측 확률")

    for class_name, prob in zip(class_names, probs):
        percent = prob.item() * 100

        st.markdown(
            f"""
            <div class="prob-row">
                <div class="prob-label">
                    <span>{display_names[class_name]}</span>
                    <span>{percent:.2f}%</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        st.progress(float(prob.item()))
    if correction_reason is not None:
        st.warning(correction_reason)
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("""
    <div class="notice-box">
        해당 결과는 AI 기반 참고용 분석이며, 의료적 진단을 대체하지 않습니다.
    </div>
    """, unsafe_allow_html=True)

else:
    st.info("JPG, JPEG, PNG 형식의 이미지를 업로드하면 분석이 시작됩니다.")