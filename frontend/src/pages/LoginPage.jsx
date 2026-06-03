import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn } from 'lucide-react';
import AuthShell from '../shared/AuthShell';
import Spinner from '../shared/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function mapLoginError(error) {
  if (error?.isNetworkError) return error.message;
  if (error?.status === 401) return 'Email ou senha inválidos. Verifique e tente novamente.';
  if (error?.status === 429) return 'Muitas tentativas seguidas. Aguarde alguns instantes.';
  if (error?.status >= 500) return 'Não foi possível entrar agora. Tente novamente em instantes.';
  return error?.message || 'Não foi possível entrar.';
}

function LoginPage() {
  useDocumentTitle('Entrar');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.fromRegister) {
      setSuccessMessage('Conta criada com sucesso! Faça login para continuar.');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(mapLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Entrar no StudyAI"
      subtitle="Acesse sua base de estudos e continue de onde parou."
    >
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            name="senha"
            type="password"
            placeholder="Digite sua senha"
            value={formData.senha}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </label>

        {successMessage ? <p className="feedback success">{successMessage}</p> : null}
        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

        <button type="submit" className="primary-button button-with-spinner" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size={16} label="Entrando" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span>Entrar</span>
            </>
          )}
        </button>

        <p className="auth-link auth-link-helper">
          <Link to="/recuperar-senha">
            <KeyRound size={14} /> Esqueci minha senha
          </Link>
        </p>
      </form>

      <p className="auth-link">
        Ainda não tem conta? <Link to="/cadastro">Criar cadastro</Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
