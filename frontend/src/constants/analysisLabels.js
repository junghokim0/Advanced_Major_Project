const COLORS = {
  medical600: '#0d9488',
  medical50: '#f0fdfa',
  amber500: '#f59e0b',
  amber50: '#fffbeb',
  red500: '#ef4444',
  red50: '#fef2f2',
};

export const CATEGORY_BY_PATTERN = {
  crown: {
    1: { label: '정상 단계', color: COLORS.medical600, bg: COLORS.medical50 },
    2: { label: '의심 단계', color: COLORS.amber500, bg: COLORS.amber50 },
    3: { label: '진행 단계', color: COLORS.red500, bg: COLORS.red50 },
  },
  m_line: {
    1: { label: 'M자 경미', color: COLORS.medical600, bg: COLORS.medical50 },
    2: { label: 'M자 중등', color: COLORS.amber500, bg: COLORS.amber50 },
    3: { label: 'M자 진행', color: COLORS.red500, bg: COLORS.red50 },
  },
};

export function getCategoryMeta(category, patternType = 'crown') {
  const map = CATEGORY_BY_PATTERN[patternType] || CATEGORY_BY_PATTERN.crown;
  const key = Number(category);
  if (map[key]) return map[key];
  return map[3];
}

/** 단계별 자가 관리·촬영 팁 (홈 최근 분석) */
const CATEGORY_TIPS_BY_PATTERN = {
  crown: {
    1: '현재 단계는 양호합니다. 같은 조명·각도로 주 1회 촬영해 변화만 추적하세요. 규칙적인 수면·샴푸 습관을 유지하면 좋습니다.',
    2: '초기 변화가 의심됩니다. 이번 주에 한 번 더 촬영해 추이를 확인하고, 스트레스·수면·영양을 점검해 보세요. 악화 시 전문의 상담을 권장합니다.',
    3: '진행 가능성이 있습니다. 피부과·탈모 클리닉 상담을 고려하고, MOJI Before/After 기록을 진료 시 참고 자료로 활용해 보세요.',
  },
  m_line: {
    1: 'M자 라인 변화가 경미한 단계입니다. 이마·헤어라인을 같은 각도로 2주에 한 번 기록해 비교하세요.',
    2: '헤어라인 후퇴가 눈에 띄기 시작할 수 있습니다. 촬영 간격을 줄이고, 두피 자극(과도한 스타일링)을 피해 보세요.',
    3: 'M자 진행이 두드러질 수 있습니다. 전문 진료와 함께 기록 탭에서 시계열·호전/악화 추이를 확인하세요.',
  },
};

export function getCategoryTip(category, patternType = 'crown') {
  const map = CATEGORY_TIPS_BY_PATTERN[patternType] || CATEGORY_TIPS_BY_PATTERN.crown;
  const key = Number(category);
  if (map[key]) return map[key];
  return map[3] || map[1];
}

export function getClassProbabilityLabels(patternType = 'crown') {
  if (patternType === 'm_line') {
    return [
      { key: 'class1', label: 'Class 1 (M자 경미)' },
      { key: 'class3', label: 'Class 3 (M자 진행)' },
    ];
  }
  return [
    { key: 'class1', label: 'Class 1 (정상 단계)' },
    { key: 'class2', label: 'Class 2 (의심 단계)' },
    { key: 'class3', label: 'Class 3 (진행 단계)' },
  ];
}
