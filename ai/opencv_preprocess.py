"""
OpenCV 추론 전처리: 흐림 게이트(224 Laplacian) → HSV 명도·채도 보정.
"""

from __future__ import annotations

import logging
from typing import Any

import cv2
import numpy as np
from PIL import Image

from preprocess_config import (
    INFERENCE_SIZE,
    LAPLACIAN_VAR_MIN,
    PATTERN_CROWN,
    PATTERN_M_LINE,
    QUALITY_PROFILES,
)

logger = logging.getLogger(__name__)


def _profile(pattern_type: str) -> dict[str, Any]:
    return QUALITY_PROFILES.get(pattern_type, QUALITY_PROFILES[PATTERN_CROWN])


def compute_hsv_metrics(bgr: np.ndarray) -> dict[str, float]:
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    s = hsv[:, :, 1].astype(np.float32) / 255.0
    v = hsv[:, :, 2].astype(np.float32) / 255.0
    dark_mask = v < 0.35
    bright_mask = v > 0.75
    pixel_count = max(v.size, 1)
    return {
        "mean_saturation": float(s.mean()),
        "mean_brightness": float(v.mean()),
        "dark_pixel_ratio": float(dark_mask.sum() / pixel_count),
        "bright_pixel_ratio": float(bright_mask.sum() / pixel_count),
    }


def _target_in_range(value: float, low: float, high: float) -> float | None:
    if value < low:
        return (low + high) / 2.0
    if value > high:
        return (low + high) / 2.0
    return None


def correct_bgr_hsv(bgr: np.ndarray, pattern_type: str) -> tuple[np.ndarray, dict[str, Any]]:
    profile = _profile(pattern_type)
    metrics_before = compute_hsv_metrics(bgr)

    v_low, v_high = profile["v_recommended"]
    s_low, s_high = profile["s_recommended"]
    v_mean = metrics_before["mean_brightness"]
    s_mean = metrics_before["mean_saturation"]

    v_target = _target_in_range(v_mean, v_low, v_high)
    s_target = _target_in_range(s_mean, s_low, s_high)

    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    corrections: list[str] = []

    if v_target is not None and v_mean > 1e-6:
        factor = np.clip(v_target / v_mean, 0.5, 2.0)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * factor, 0, 255)
        corrections.append(f"brightness x{factor:.3f} -> target V~{v_target:.3f}")

    if s_target is not None and s_mean > 1e-6:
        factor = np.clip(s_target / s_mean, 0.5, 2.0)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * factor, 0, 255)
        corrections.append(f"saturation x{factor:.3f} -> target S~{s_target:.3f}")

    corrected = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    metrics_after = compute_hsv_metrics(corrected)

    meta = {
        "patternType": pattern_type,
        "profile": profile["label"],
        "metricsBefore": metrics_before,
        "metricsAfter": metrics_after,
        "corrected": bool(corrections),
        "corrections": corrections,
    }
    if corrections:
        logger.info("[OpenCV preprocess] %s: %s", pattern_type, "; ".join(corrections))
    return corrected, meta


def laplacian_variance_at_inference_size(
    bgr: np.ndarray, size: int = INFERENCE_SIZE
) -> float:
    """모델 입력(224)과 동일 크기에서 선명도 분산 계산."""
    resized = bgr
    h, w = bgr.shape[:2]
    if (h, w) != (size, size):
        resized = cv2.resize(bgr, (size, size), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def evaluate_blur(bgr: np.ndarray) -> dict[str, Any]:
    score = laplacian_variance_at_inference_size(bgr)
    return {
        "ok": score >= LAPLACIAN_VAR_MIN,
        "score": round(score, 2),
        "minRequired": LAPLACIAN_VAR_MIN,
        "inferenceSize": INFERENCE_SIZE,
    }


def pil_to_bgr(pil_image: Image.Image) -> np.ndarray:
    rgb = np.array(pil_image.convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def bgr_to_pil(bgr: np.ndarray) -> Image.Image:
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


def preprocess_for_inference(pil_image: Image.Image, pattern_type: str) -> tuple[Image.Image, dict[str, Any]]:
    normalized = pattern_type if pattern_type in (PATTERN_CROWN, PATTERN_M_LINE) else PATTERN_CROWN
    bgr = pil_to_bgr(pil_image)
    corrected_bgr, hsv_meta = correct_bgr_hsv(bgr, normalized)
    return bgr_to_pil(corrected_bgr), hsv_meta
