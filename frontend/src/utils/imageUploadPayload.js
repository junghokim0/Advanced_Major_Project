import * as ImageManipulator from 'expo-image-manipulator';

function pickOutputFormat(image) {
  const mime = String(image.mimeType || image.type || '').toLowerCase();
  const name = String(image.fileName || image.uri || '').toLowerCase();
  if (mime.includes('png') || name.endsWith('.png')) {
    return {
      format: ImageManipulator.SaveFormat.PNG,
      mimeType: 'image/png',
      ext: 'png',
    };
  }
  return {
    format: ImageManipulator.SaveFormat.JPEG,
    mimeType: 'image/jpeg',
    ext: 'jpg',
  };
}

/**
 * 갤러리 content:// URI 등을 JPEG/PNG 바이트로 정규화 (Android FileReader 미사용).
 */
export async function buildImageUploadPayload(image) {
  if (!image?.uri) {
    throw new Error('선택된 이미지가 없습니다.');
  }

  const { format, mimeType, ext } = pickOutputFormat(image);
  const result = await ImageManipulator.manipulateAsync(image.uri, [], {
    compress: 0.85,
    format,
    base64: true,
  });

  if (!result.base64?.length) {
    throw new Error('이미지를 읽지 못했습니다. jpg, jpeg, png 사진을 다시 선택해 주세요.');
  }

  const baseName = image.fileName?.replace(/\.[^.]+$/i, '') || 'photo';
  return {
    base64: result.base64,
    filename: `${baseName}.${ext}`,
    mimeType,
  };
}
