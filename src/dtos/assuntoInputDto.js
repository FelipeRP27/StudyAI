const ASSUNTO_MAX_LENGTH = 120;

function normalizarAssunto(valor) {
  if (typeof valor !== 'string') return null;
  const assunto = valor.replace(/\s+/g, ' ').trim().slice(0, ASSUNTO_MAX_LENGTH).trim();
  if (!assunto) return null;
  return assunto.charAt(0).toUpperCase() + assunto.slice(1);
}

module.exports = {
  ASSUNTO_MAX_LENGTH,
  normalizarAssunto
};
