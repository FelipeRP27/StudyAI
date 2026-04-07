const AppError = require('../config/appError');

function buildRegisterInputDto(body) {
  const { nome, email, senha } = body;

  if (!nome || !email || !senha) {
    throw new AppError('nome, email and senha are required', 400);
  }

  return {
    nome: String(nome).trim(),
    email: String(email).trim().toLowerCase(),
    senha: String(senha)
  };
}

function buildLoginInputDto(body) {
  const { email, senha } = body;

  if (!email || !senha) {
    throw new AppError('email and senha are required', 400);
  }

  return {
    email: String(email).trim().toLowerCase(),
    senha: String(senha)
  };
}

module.exports = {
  buildRegisterInputDto,
  buildLoginInputDto
};
