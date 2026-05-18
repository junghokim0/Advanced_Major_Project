import * as ImageManipulator from 'expo-image-manipulator';
import { CAPTURE_IMAGE_QUALITY } from '../constants/captureConfig';
import { resolveGuideCropRect } from '../constants/guideLayouts';

const MIN_CROP_EDGE_PX = 64;

/**
 * 촬영본에서 가이드 타원 bounding box 영역만 crop합니다.
 */
export async function cropImageToGuideRegion(uri, imageWidth, imageHeight, guide) {
  if (!uri || !imageWidth || !imageHeight) {
    throw new Error('잘라낼 이미지 정보가 없습니다.');
  }

  const crop = resolveGuideCropRect(guide, imageWidth, imageHeight);

  if (crop.width < MIN_CROP_EDGE_PX || crop.height < MIN_CROP_EDGE_PX) {
    throw new Error('가이드 영역이 너무 작습니다. guideLayouts 비율을 확인해 주세요.');
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        crop: {
          originX: crop.originX,
          originY: crop.originY,
          width: crop.width,
          height: crop.height,
        },
      },
    ],
    {
      compress: CAPTURE_IMAGE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    crop,
  };
}
