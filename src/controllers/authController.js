const authService = require('../services/authService');
const { buildRegisterInputDto, buildLoginInputDto } = require('../dtos/authInputDto');

async function register(req, res, next) {
  try {
    const input = buildRegisterInputDto(req.body);
    const output = await authService.register(input);

    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const input = buildLoginInputDto(req.body);
    const output = await authService.login(input);

    res.status(200).json(output);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login
};
