"""HSV 입력 품질·보정 기준 (팀원 실측, patternType별)."""

PATTERN_CROWN = "crown"
PATTERN_M_LINE = "m_line"

# 모델 입력과 동일 크기에서 Laplacian 분산 (흐림 게이트)
INFERENCE_SIZE = 224
LAPLACIAN_VAR_MIN = 80

# patternType -> 권장·한계 (V·S는 0~1, OpenCV HSV 채널 /255 기준)
QUALITY_PROFILES = {
    PATTERN_M_LINE: {
        "label": "이마(M자)",
        "v_recommended": (0.38, 0.57),
        "v_too_dark": 0.35,
        "v_too_bright": 0.75,
        "s_recommended": (0.20, 0.30),
    },
    PATTERN_CROWN: {
        "label": "정수리",
        "v_recommended": (0.40, 0.60),
        "v_too_dark": 0.35,
        "v_too_bright": 0.80,
        "s_recommended": (0.18, 0.27),
    },
}
