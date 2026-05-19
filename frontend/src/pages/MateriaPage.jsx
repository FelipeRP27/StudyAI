import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { materiaService } from '../services/materiaService';
import { conteudoService } from '../services/conteudoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';

function MateriaPage() {
  const { materiaId } = useParams();
  const navigate = useNavigate();

  const [materia, setMateria] = useState(null);
  useDocumentTitle(materia?.nome || 'Matéria');
  const [conteudos, setConteudos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({ titulo: '', texto: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', descricao: '' });
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [materias, listaConteudos] = await Promise.all([
        materiaService.listMaterias(),
        conteudoService.listByMateria(materiaId)
      ]);

      const materiaAtual = materias.find((item) => String(item.id) === String(materiaId));
      if (!materiaAtual) {
        setErrorMessage('Matéria não encontrada.');
        setMateria(null);
      } else {
        setMateria(materiaAtual);
      }
      setConteudos(listaConteudos);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [materiaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      await conteudoService.create({
        titulo: formData.titulo,
        texto: formData.texto,
        materia_id: Number(materiaId)
      });
      setFormData({ titulo: '', texto: '' });
      await loadData();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = () => {
    if (!materia) return;
    setEditForm({
      nome: materia.nome || '',
      descricao: materia.descricao || ''
    });
    setEditError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    setEditError('');
    setIsSaving(true);

    try {
      const atualizada = await materiaService.update(materiaId, {
        nome: editForm.nome,
        descricao: editForm.descricao || null
      });
      setMateria(atualizada);
      setIsEditing(false);
    } catch (error) {
      setEditError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!materia) return;
    const totalConteudos = conteudos.length;
    const aviso =
      totalConteudos > 0
        ? `Excluir a matéria "${materia.nome}"?\n\nIsso vai apagar permanentemente ${totalConteudos} conteúdo(s) e todo o material gerado por IA (resumos, pontos-chave, questões, alternativas, flashcards e respostas registradas).\n\nTarefas vinculadas a essa matéria não serão excluídas — apenas perderão o vínculo.`
        : `Excluir a matéria "${materia.nome}"?\n\nEssa ação não pode ser desfeita.`;

    if (!window.confirm(aviso)) return;

    setIsDeleting(true);
    try {
      await materiaService.remove(materiaId);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        {isEditing ? (
          <form className="form materia-edit-form" onSubmit={handleSaveEdit}>
            <p className="eyebrow">Editando matéria</p>
            <label className="field">
              <span>Nome</span>
              <input
                name="nome"
                type="text"
                value={editForm.nome}
                onChange={handleEditChange}
                required
                autoFocus
              />
            </label>
            <label className="field">
              <span>Descrição</span>
              <input
                name="descricao"
                type="text"
                value={editForm.descricao}
                onChange={handleEditChange}
                placeholder="Opcional"
              />
            </label>
            {editError ? <p className="feedback error">{editError}</p> : null}
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <div>
              <p className="eyebrow">
                <Link to="/dashboard">← Matérias</Link>
              </p>
              <h1>{materia?.nome || 'Carregando matéria...'}</h1>
              <p className="dashboard-copy">
                {materia?.descricao ||
                  'Organize conteúdos teóricos e gere material de estudo ativo.'}
              </p>
            </div>

            {materia ? (
              <div className="hero-actions">
                <button
                  type="button"
                  className="secondary-button small"
                  onClick={handleStartEdit}
                  disabled={isDeleting}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="secondary-button small danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="content-grid">
        <article className="content-card">
          <h2>Novo conteúdo</h2>
          <p className="muted">
            Cole o texto teórico (resumo de aula, capítulo de apostila, lei seca) e o StudyAI vai
            transformar em resumo, pontos-chave, questões e flashcards.
          </p>
          <form className="form" onSubmit={handleCreate}>
            <label className="field">
              <span>Título</span>
              <input
                name="titulo"
                type="text"
                placeholder="Ex: Princípios da Administração Pública"
                value={formData.titulo}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className="field">
              <span>Texto</span>
              <textarea
                name="texto"
                rows={8}
                placeholder="Cole aqui o conteúdo teórico"
                value={formData.texto}
                onChange={handleInputChange}
                required
              />
              <small className="field-help">
                Recomendado: pelo menos 500 caracteres para a IA gerar bom material
                (resumo, pontos-chave, questões e flashcards). Mínimo aceito: 20 caracteres.
              </small>
            </label>
            {createError ? <p className="feedback error">{createError}</p> : null}
            <button type="submit" className="primary-button" disabled={isCreating}>
              {isCreating ? 'Salvando...' : 'Criar conteúdo'}
            </button>
          </form>
        </article>

        <article className="content-card">
          <h2>Conteúdos cadastrados</h2>
          {isLoading ? <p>Carregando conteúdos...</p> : null}
          {!isLoading && errorMessage ? <p className="feedback error">{errorMessage}</p> : null}
          {!isLoading && !errorMessage && conteudos.length === 0 ? (
            <p className="muted">Nenhum conteúdo cadastrado ainda nesta matéria.</p>
          ) : null}
          {!isLoading && conteudos.length > 0 ? (
            <ul className="matter-list">
              {conteudos.map((conteudo) => (
                <li key={conteudo.id} className="matter-item">
                  <Link to={`/conteudos/${conteudo.id}`}>
                    <div className="matter-item-text">
                      <strong>{conteudo.titulo}</strong>
                      <span>
                        {conteudo.texto.length > 140
                          ? `${conteudo.texto.slice(0, 140)}...`
                          : conteudo.texto}
                      </span>
                    </div>
                    <span className="matter-item-arrow" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </main>
  );
}

export default MateriaPage;
