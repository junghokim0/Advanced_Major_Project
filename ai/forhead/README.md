\# Forehead Hair Loss Classification Model



\## 개요



본 폴더는 이마 헤어라인 기반 탈모 단계 분류 모델 학습 및 테스트를 위한 코드와 관련 파일을 포함합니다.



기존 정수리 이미지 기반 분류 모델과 별도로, 이마 영역 이미지를 활용하여 `1\_level`과 `3\_level`을 분류하는 EfficientNet-B0 기반 이진 분류 모델을 학습하였습니다.



\## 폴더 구성



```text

forhead/

├── README.md

├── EfficientNet\_B0.ipynb

├── hairlinedatasplit.ipynb

├── best\_model\_forehead.pth

└── 기타 학습/테스트 관련 파일



데이터셋



학습에 사용한 원본 데이터 및 분리된 데이터셋은 용량 문제로 GitHub에 직접 업로드하지 않고 Google Drive 링크로 공유합니다.



데이터 다운로드 링크:



https://drive.google.com/drive/folders/1iOAfHWFFtWYq7Adeaodot8i9DEJjjJDV?usp=drive\_link





