# Forehead Hair Loss Classification Model

## 개요

본 폴더는 이마 헤어라인 기반 탈모 단계 분류 모델 학습 및 테스트를 위한 코드와 관련 파일을 포함합니다.

기존 정수리 이미지 기반 분류 모델과 별도로, 이마 영역 이미지를 활용하여 1_level과 3_level을 분류하는 EfficientNet-B0 기반 이진 분류 모델을 학습하였습니다.

## 폴더 구성

- README.md
- EfficientNet_B0.ipynb
- hairlinedatasplit.ipynb
- best_model_forehead.pth
- 기타 학습 및 테스트 관련 파일

## 데이터셋

학습에 사용한 원본 데이터 및 분리된 데이터셋은 용량 문제로 GitHub에 직접 업로드하지 않고 Google Drive 링크로 공유합니다.

데이터 다운로드 링크:

https://drive.google.com/drive/folders/1iOAfHWFFtWYq7Adeaodot8i9DEJjjJDV?usp=drive_link

팀원은 위 링크에서 데이터를 다운로드한 뒤, Google Drive 또는 로컬 환경에 맞게 경로를 수정하여 실행하면 됩니다.

## 데이터 구조 예시

Colab 기준 원본 데이터 경로 예시:

/content/drive/MyDrive/전심프/data/hairloss_forehead/

해당 폴더 안에는 다음 클래스 폴더가 있어야 합니다.

- 1_level
- 3_level

데이터 split 이후 구조 예시:

/content/drive/MyDrive/전심프/data/hairloss_forehead_split/

해당 폴더 안에는 다음과 같은 구조가 생성됩니다.

- train
  - 1_level
  - 3_level
- val
  - 1_level
  - 3_level
- test
  - 1_level
  - 3_level

## 모델 설명

- 사용 모델: EfficientNet-B0
- 학습 방식: ImageNet pretrained weight 기반 fine-tuning
- 분류 방식: 2-class image classification
- 분류 클래스:
  - 1_level: 정상 또는 약한 단계
  - 3_level: 탈모 의심 단계
- 저장 모델:
  - best_model_forehead.pth

## 실행 순서

1. Google Drive에서 데이터셋을 다운로드합니다.
2. 다운로드한 데이터를 Colab 또는 로컬 환경에 업로드합니다.
3. hairlinedatasplit.ipynb를 실행하여 train, val, test 데이터로 분리합니다.
4. EfficientNet_B0.ipynb를 실행하여 모델을 학습합니다.
5. 저장된 best_model_forehead.pth를 이용하여 실제 이마 이미지 예측을 수행합니다.

## 주요 개선 사항

초기 이마 분류 모델에서는 일부 M자형 이마 이미지가 정상으로 오분류되는 문제가 있었습니다.

분석 결과, 얼굴 전체와 배경이 함께 포함된 이미지에서 모델이 헤어라인보다 주변 특징에 영향을 받을 수 있음을 확인하였습니다.

이를 개선하기 위해 다음과 같은 방향을 적용할 수 있습니다.

- 정상 판정 threshold 조정
- M자형 이마 hard case 데이터 추가
- 이마 또는 헤어라인 영역 중심의 crop 기준 통일
- 학습 데이터와 실제 입력 이미지의 촬영 각도 및 조명 기준 정리

## 주의사항

- 데이터 경로는 실행 환경에 맞게 수정해야 합니다.
- GitHub에는 대용량 데이터셋을 직접 올리지 않고 Google Drive 링크를 사용합니다.
- 실제 테스트 이미지가 학습 데이터와 촬영 각도, 조명, crop 범위가 다르면 오분류가 발생할 수 있습니다.
- 모델 파일 용량이 큰 경우 GitHub 업로드 제한에 걸릴 수 있으므로 필요 시 Google Drive 링크로 별도 공유할 수 있습니다.