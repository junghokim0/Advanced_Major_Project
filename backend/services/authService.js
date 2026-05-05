const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { signToken } = require('../utils/jwt');

exports.signup = async ({ email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    const error = new Error('Email already registered.');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdUser = await userRepository.createUser({ email, password: hashedPassword });

  return createdUser;
};

exports.login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const passwordMatched = await bcrypt.compare(password, user.password);
  if (!passwordMatched) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  return signToken({ userId: user.id, email: user.email });
};
