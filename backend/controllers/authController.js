const authService = require('../services/authService');

exports.signup = async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at || null,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = await authService.login(req.body);
    res.json({ token });
  } catch (error) {
    next(error);
  }
};
