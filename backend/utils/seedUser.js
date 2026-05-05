const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

const DEFAULT_EMAIL = 'test@example.com';
const DEFAULT_PASSWORD = 'Password123!';

exports.DEFAULT_USER = {
  email: DEFAULT_EMAIL,
  password: DEFAULT_PASSWORD,
};

exports.seedDefaultUser = async () => {
  try {
    const existing = await userRepository.findByEmail(DEFAULT_EMAIL);
    if (existing) {
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await userRepository.createUser({ email: DEFAULT_EMAIL, password: hashedPassword });
    console.log(`Default user created: ${DEFAULT_EMAIL}`);
  } catch (error) {
    console.error('Failed to create default user:', error);
  }
};
