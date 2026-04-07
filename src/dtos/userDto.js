function toUserDto(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    created_at: user.created_at
  };
}

module.exports = {
  toUserDto
};
