import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../shared/AuthShell';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function RegisterPage() {
  useDocumentTitle('Cadastro');
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await register(formData);
      setSuccessMessage('Cadastro realizado com sucesso. Faça login para continuar.');
      setTimeout(() => {
        navigate('/login');
      }, 800);
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
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome</span>
          <input
            name="nome"
            type="text"
            placeholder="Seu nome completo"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </label>

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
            placeholder="Crie uma senha"
            value={formData.senha}
            onChange={handleChange}
            required
          />
        </label>

        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}
        {successMessage ? <p className="feedback success">{successMessage}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className="auth-link">
        Já possui conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthShell>
  );
}

export default RegisterPage;
