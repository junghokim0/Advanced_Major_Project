module.exports = (err, req, res, next) => {
  console.error(err);
  const body = {
    error: err.message || 'Internal Server Error',
  };
  if (err.code) body.code = err.code;
  if (err.blurScore != null) body.blurScore = err.blurScore;
  if (err.minBlurScore != null) body.minBlurScore = err.minBlurScore;
  res.status(err.status || 500).json(body);
};
