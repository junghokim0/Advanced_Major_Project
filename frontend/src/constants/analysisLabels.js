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

export function getClassProbabilityLabels(patternType = 'crown') {
  if (patternType === 'm_line') {
    return [
      { key: 'class1', label: 'Class 1 (M자 경미)' },
      { key: 'class2', label: 'Class 2 (M자 중등)' },
      { key: 'class3', label: 'Class 3 (M자 진행)' },
    ];
  }
  return [
    { key: 'class1', label: 'Class 1 (정상 단계)' },
    { key: 'class2', label: 'Class 2 (의심 단계)' },
    { key: 'class3', label: 'Class 3 (진행 단계)' },
  ];
}
