const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { env } = require('../config/env');
const AppError = require('../config/appError');
const { toUserResponseDto, toLoginResponseDto } = require('../dtos/authOutputDto');

const SALT_ROUNDS = 10;

async function register(input) {
  const existingUser = await userRepository.findByEmail(input.email);

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(input.senha, SALT_ROUNDS);

  const user = await userRepository.create({
    nome: input.nome,
    email: input.email,
    senha: hashedPassword
  });

  return toUserResponseDto(user);
}

async function login(input) {
  const user = await userRepository.findByEmail(input.email);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.senha, user.senha);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    {
      email: user.email
    },
    env.jwtSecret,
    {
      subject: String(user.id),
      expiresIn: env.jwtExpiresIn
    }
  );

  return toLoginResponseDto(user, token);
}

module.exports = {
  register,
  login
};
