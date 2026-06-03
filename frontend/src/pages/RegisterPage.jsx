import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthShell from '../shared/AuthShell';
import Spinner from '../shared/Spinner';
import PasswordInput from '../shared/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../shared/useDocumentTitle';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;

function validarFormulario({ nome, email, senha }) {
  const erros = {};
  if (!nome.trim()) {
    erros.nome = 'Informe seu nome completo.';
  }
  if (!email.trim()) {
    erros.email = 'Informe seu email.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    erros.email = 'Email inválido. Use o formato nome@exemplo.com.';
  }
  if (!senha) {
    erros.senha = 'Crie uma senha.';
  } else if (senha.length < SENHA_MIN_LENGTH) {
    erros.senha = `A senha precisa ter ao menos ${SENHA_MIN_LENGTH} caracteres.`;
  }
  return erros;
}

function RegisterPage() {
  useDocumentTitle('Cadastro');
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const erros = validarFormulario(formData);
    if (Object.keys(erros).length > 0) {
      setFieldErrors(erros);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
      navigate('/login', { state: { fromRegister: true } });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Prepare sua área de estudos para matérias, conteúdos e acompanhamento."
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Nome</span>
          <input
            name="nome"
            type="text"
            placeholder="Seu nome completo"
            value={formData.nome}
            onChange={handleChange}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.nome)}
          />
          {fieldErrors.nome ? <small className="field-error">{fieldErrors.nome}</small> : null}
        </label>

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? <small className="field-error">{fieldErrors.email}</small> : null}
        </label>

        <label className="field">
          <span>Senha</span>
          <PasswordInput
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            placeholder="Crie uma senha"
            autoComplete="new-password"
            ariaInvalid={Boolean(fieldErrors.senha)}
            ariaDescribedBy="senha-help"
          />
          {fieldErrors.senha ? (
            <small className="field-error">{fieldErrors.senha}</small>
          ) : (
            <small id="senha-help" className="field-help">
              Mínimo de {SENHA_MIN_LENGTH} caracteres.
            </small>
          )}
        </label>

        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

        <button type="submit" className="primary-button button-with-spinner" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size={16} label="Cadastrando" />
              <span>Cadastrando...</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Cadastrar</span>
            </>
          )}
        </button>
      </form>

      <p className="auth-link">
        Já possui conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthShell>
  );
}

export default RegisterPage;
