function toUserResponseDto(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    created_at: user.created_at
  };
}

function toLoginResponseDto(user, token) {
  return {
    token,
    usuario: toUserResponseDto(user)
  };
}

module.exports = {
  toUserResponseDto,
  toLoginResponseDto
};
