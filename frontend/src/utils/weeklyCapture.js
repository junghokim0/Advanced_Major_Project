function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 이번 주(월요일 0시 기준)에 분석 이력이 없으면 true — 홈 배너용 */
export function isWeeklyCaptureDue(lastAnalyzedAt) {
  if (!lastAnalyzedAt) return true;
  const last = new Date(lastAnalyzedAt);
  if (Number.isNaN(last.getTime())) return true;
  return last < startOfWeek(new Date());
}
