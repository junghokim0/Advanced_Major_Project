/**
 * 클래스 번호 차이(기준 − 이전)로 Before/After 변화를 해석합니다.
 * 클래스가 높을수록 진행 단계가 높다고 가정합니다.
 */
export function getClassChangeInterpretation(diff) {
  const delta = Number(diff) || 0;
  if (delta > 0) {
    return {
      label: '악화',
      detail: `클래스 +${delta}`,
      hint: '기준 시점이 이전보다 진행 단계가 높습니다.',
      tone: 'worse',
    };
  }
  if (delta < 0) {
    return {
      label: '호전',
      detail: `클래스 ${delta}`,
      hint: '기준 시점이 이전보다 진행 단계가 낮습니다.',
      tone: 'better',
    };
  }
  return {
    label: '유지',
    detail: '클래스 변화 없음',
    hint: '두 시점의 클래스 단계가 같습니다.',
    tone: 'same',
  };
}
