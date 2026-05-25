/**
 * 운영 시 HTTPS 강제 (선택). REQUIRE_HTTPS=true 일 때 비암호화 요청 거절.
 * 로컬 개발(REQUIRE_HTTPS 미설정)에서는 동작하지 않습니다.
 */
function requireHttpsWhenEnabled(req, res, next) {
  if (process.env.REQUIRE_HTTPS !== 'true') {
    return next();
  }

  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  if (proto === 'https') {
    return next();
  }

  return res.status(403).json({
    error: 'HTTPS 연결이 필요합니다. API는 암호화된 채널로만 접근할 수 있습니다.',
  });
}

module.exports = { requireHttpsWhenEnabled };
