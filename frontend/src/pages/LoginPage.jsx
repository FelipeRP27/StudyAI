import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../shared/AuthShell';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function LoginPage() {
  useDocumentTitle('Entrar');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.message);
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
            required
          />
        </label>

        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth-link">
        Ainda não tem conta? <Link to="/cadastro">Criar cadastro</Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
