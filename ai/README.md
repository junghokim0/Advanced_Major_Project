# AI Part - Hair Loss Vision AI

## 프로젝트 개요

본 프로젝트는 스마트폰으로 촬영한 정수리 이미지를 기반으로 탈모 단계를 분석하는 Vision AI 시스템이다.  
사용자가 업로드한 두피 이미지를 AI 모델이 분석하여 탈모 진행 단계를 예측하고 확률 기반 결과를 제공한다.

---

# 1. Image Dataset Construction

## 데이터셋 확보

- AI Hub 및 Roboflow 기반 정수리 데이터셋 확보
- 전체 데이터 약 4500장 수집

---

## 데이터 검증 및 정제

초기에는 탈모 단계를 5개의 클래스로 구분하여 데이터를 분류하였다.

| Level | Count |
|---|---|
| Level 1 | 533 |
| Level 2 | 516 |
| Level 3 | 424 |
| Level 4 | 393 |
| Level 5 | 289 |

총 4500장의 데이터 중 실제 사용 가능한 데이터만 검증 및 정제하여 약 2155장을 최종 사용하였다.

(Level 1 → 정상 / Level 5 → 심화 탈모)

---

## 클래스 재구성

각 Level 별 데이터 수 불균형 문제와 클래스 간 경계 모호성을 고려하여 기존 5-class 구조를 3-class 구조로 재설계하였다.

| Class | Description | Count |
|---|---|---|
| Class A | 정상 | 533 |
| Class B | 초기~중간 탈모 | 940 |
| Class C | 심화 탈모 | 682 |

초기에는 CNN 모델을 scratch training 방식으로 학습하는 것을 고려하였으나, 실제 사용 가능한 데이터 수가 제한적이었기 때문에 fine-tuning 기반 transfer learning 방식이 더 적절하다고 판단하였다.

따라서 최종적으로 3개의 클래스로 재구성하여 fine-tuning 기반 AI 모델 학습을 진행하였다.

---

# 2. Preprocessing

## What

본 프로젝트에서는 스마트폰으로 촬영된 두피 이미지를 CNN 기반 AI 모델 학습에 적합한 형태로 변환하기 위해 이미지 전처리(preprocessing)를 수행하였다.

전처리 과정에서는 RGB 원본 이미지를 유지한 상태에서 다음 과정을 적용하였다.

- 이미지 크기 통일
- Data Augmentation
- Tensor 변환
- Normalize

또한 학습 데이터와 평가 데이터의 처리 방식을 구분하여:

- Train 데이터 → augmentation 적용
- Validation/Test 데이터 → 기본 전처리만 적용

하도록 구성하였다.

---

## Why

이미지 크기를 통일하는 이유는 CNN 모델이 고정된 입력 크기를 요구하기 때문이다.

또한 실제 스마트폰 촬영 환경에서는:

- 촬영 거리
- 촬영 위치
- 촬영 각도
- 조명 환경

등 다양한 변수가 존재한다.

따라서 augmentation 기법들을 적용하여 모델의 일반화 성능을 향상시키고 overfitting을 완화하고자 하였다.

Normalize는 입력 데이터 분포를 안정화하여 학습 수렴 속도와 모델 성능 향상에 도움을 준다.

Validation/Test 데이터에 augmentation을 적용하지 않은 이유는 모델 성능을 왜곡 없이 공정하게 평가하기 위함이다.

---

## How

모든 이미지에 대해 Resize를 적용하여 입력 크기를 통일하였다.

학습 데이터에는:

- RandomResizedCrop
- HorizontalFlip
- Rotation
- ColorJitter

를 적용하여 실제 스마트폰 촬영 환경의 다양성을 반영하였다.

이후:

- ToTensor
- Normalize

를 적용하여 PyTorch Tensor 형태로 변환하였다.

반면 Validation/Test 데이터에는 augmentation을 적용하지 않고:

- Resize
- CenterCrop
- ToTensor
- Normalize

만 적용하였다.

---

# 3. Feature Extraction (Fine-Tuning)

## What

본 프로젝트에서는 이미지 feature extraction을 위해 PyTorch 기반 pretrained CNN 모델인 EfficientNet-B0를 사용하였다.

EfficientNet-B0는 ImageNet 데이터셋으로 사전 학습(pretrained)된 모델로, edge, texture, pattern 등의 기본적인 시각적 특징을 이미 학습한 상태이다.

본 프로젝트에서는 pretrained 모델을 그대로 사용하는 것이 아니라 탈모 이미지 데이터셋에 맞게 fine-tuning을 수행하였다.

또한 기존 classifier 구조를 수정하여 탈모 단계를 분류하는 3-class classification 모델로 재구성하였다.

---

## Why

초기에는 CNN 모델을 처음부터 학습(scratch training)하는 방식을 고려하였다.

하지만 데이터 정제 이후 실제 사용 가능한 이미지 수가 약 2131장 수준으로 감소하였기 때문에 충분한 학습 데이터를 확보하기 어려웠다.

CNN을 scratch 방식으로 학습할 경우:

- 대량의 데이터 필요
- 데이터 부족 시 overfitting 발생 가능성 증가

문제가 존재한다.

따라서 ImageNet 기반 pretrained 모델을 활용한:

- Transfer Learning
- Fine-Tuning

방식이 더 적절하다고 판단하였다.

또한 EfficientNet-B0는 비교적 적은 파라미터 수로도 높은 성능을 제공하기 때문에 제한된 데이터 환경에서도 안정적인 학습이 가능하다는 장점이 있다.

---

## How

먼저 ImageNet pretrained EfficientNet-B0 모델을 불러온 뒤 기존 1000-class classifier layer를 제거하였다.

이후 탈모 단계 분류를 위한 3개의 output node를 가지도록 classifier를 수정하였다.

Fine-tuning 과정에서 모델은 다음 특징들을 자동으로 추출하도록 학습되었다.

- Hair Density
- Scalp Exposure
- Hair Spacing
- Hair / Scalp Contrast
- Thinning Pattern

---

# 4. Classification (Probability Output)

## What

Feature extraction 과정을 통해 추출된 feature vector는 마지막 classification layer를 통해 탈모 단계를 분류한다.

본 프로젝트에서는:

- 정상(Class A)
- 초기~중간 탈모(Class B)
- 심화 탈모(Class C)

총 3개의 클래스로 구성하였다.

모델의 최종 출력은 각 클래스에 대한 logit 값으로 생성되며 이후 Softmax 함수를 통해 확률값으로 변환된다.

---

## Why

Softmax 기반 확률 출력 방식을 사용한 이유는 단순 classification 결과뿐만 아니라 모델의 신뢰도까지 함께 제공할 수 있기 때문이다.

사용자는:

- 모델의 예측 결과
- 각 클래스 확률값

을 함께 확인할 수 있으며 경계 구간의 모호한 예측 상황도 보다 직관적으로 이해할 수 있다.

또한 확률 기반 출력은 이후 후처리(post-processing) 및 사용자 UI 구성에도 활용 가능하다는 장점이 있다.

---

## How

EfficientNet-B0의 마지막 feature vector는 fully connected classification layer에 입력된다.

이후 Softmax 함수를 적용하여 각 클래스 확률을 계산한다.

예시:

- 정상 : 0.12
- 초기~중간 탈모 : 0.71
- 심화 탈모 : 0.17

→ 가장 높은 확률값인 초기~중간 탈모(Class B)로 최종 예측한다.

모든 클래스 확률의 합은 1이 되도록 정규화된다.

---

# 5. Model Performance

| Metric | Score |
|---|---|
| Final Accuracy | 85.45% |

## Performance Result

![Model Performance](performance.png)

---

# 6. service.py (UI Logic)

## Rule-Based Post Processing

정상 클래스와 초기 탈모 클래스 사이의 경계가 모호한 문제를 해결하기 위해 rule-based post processing을 적용하였다.

다음 조건을 모두 만족할 경우:

- 모델이 3단계로 예측
- 3단계 확률 : 50~60%
- 5단계 확률 : 10% 미만
- 1단계 확률 : 30% 이상

→ 최종 결과를 1단계로 보정한다.

반면 위 조건 중 하나라도 만족하지 않는 경우에는 원래 모델 예측 결과를 그대로 사용한다.

이를 통해 정상과 초기 탈모 사이의 경계 문제를 완화하고 보다 안정적인 사용자 결과를 제공하도록 설계하였다.

---

# Tech Stack

- Python
- PyTorch
- EfficientNet-B0
- OpenCV
- TorchVision

---

# Directory Structure

```bash
ai
 ├── EfficientNet_B0.ipynb
 ├── service.py
 ├── README.md
 └── 실제 사진test/
```