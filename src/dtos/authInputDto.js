const AppError = require('../config/appError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;
const NOME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 150;

function buildRegisterInputDto(body) {
  const { nome, email, senha } = body;

  if (!nome || !email || !senha) {
    throw new AppError('nome, email and senha are required', 400);
  }

  const nomeTrimmed = String(nome).trim();
  const emailNormalizado = String(email).trim().toLowerCase();
  const senhaStr = String(senha);

  if (nomeTrimmed.length === 0 || nomeTrimmed.length > NOME_MAX_LENGTH) {
    throw new AppError(`nome must be between 1 and ${NOME_MAX_LENGTH} characters`, 400);
  }
  if (emailNormalizado.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(emailNormalizado)) {
    throw new AppError('email must be a valid address', 400);
  }
  if (senhaStr.length < SENHA_MIN_LENGTH) {
    throw new AppError(`senha must have at least ${SENHA_MIN_LENGTH} characters`, 400);
  }

  return {
    nome: nomeTrimmed,
    email: emailNormalizado,
    senha: senhaStr
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
