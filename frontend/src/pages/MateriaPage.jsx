import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, ChevronRight, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { materiaService } from '../services/materiaService';
import { conteudoService } from '../services/conteudoService';
import { desempenhoService } from '../services/desempenhoService';
import { useDocumentTitle } from '../shared/useDocumentTitle';
import { SkeletonList } from '../shared/Skeleton';

function MateriaPage() {
  const { materiaId } = useParams();
  const navigate = useNavigate();

  const [materia, setMateria] = useState(null);
  useDocumentTitle(materia?.nome || 'Matéria');
  const [conteudos, setConteudos] = useState([]);
  const [desempenho, setDesempenho] = useState(null);
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
      const [materias, listaConteudos, desempenhoData] = await Promise.all([
        materiaService.listMaterias(),
        conteudoService.listByMateria(materiaId),
        desempenhoService.getByMateria(materiaId, { dias: 30 }).catch(() => null)
      ]);

      const materiaAtual = materias.find((item) => String(item.id) === String(materiaId));
      if (!materiaAtual) {
        setErrorMessage('Matéria não encontrada.');
        setMateria(null);
      } else {
        setMateria(materiaAtual);
      }
      setConteudos(listaConteudos);
      setDesempenho(desempenhoData);
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
      <section className="dashboard-hero dashboard-hero-tinted">
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
            <div className="dashboard-hero-content">
              <p className="eyebrow">
                <Link to="/dashboard" className="back-link">
                  <ArrowLeft size={14} /> Matérias
                </Link>
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
                  className="secondary-button small button-with-spinner"
                  onClick={handleStartEdit}
                  disabled={isDeleting}
                >
                  <Pencil size={14} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  className="secondary-button small danger button-with-spinner"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? 'Excluindo...' : 'Excluir'}</span>
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {desempenho && desempenho.resumo && desempenho.resumo.total_respostas > 0 ? (
        <section className="content-card materia-desempenho-card">
          <div className="materia-desempenho-info">
            <div className="materia-desempenho-icon" aria-hidden="true">
              <BarChart3 size={22} />
            </div>
            <div>
              <h3 className="materia-desempenho-title">Seu desempenho nesta matéria</h3>
              <div className="materia-desempenho-chips">
                <span className="stat-chip neutral">
                  <strong>{desempenho.resumo.total_respostas}</strong> respostas
                </span>
                <span className="stat-chip success">
                  <strong>{desempenho.resumo.total_acertos}</strong> acertos
                </span>
                <span className="stat-chip">
                  <strong>{desempenho.resumo.taxa_acerto}%</strong> de acerto
                </span>
              </div>
            </div>
          </div>
          <Link
            to={`/desempenho/materias/${materiaId}`}
            className="primary-button small button-with-spinner"
          >
            <span>Ver detalhes</span>
            <ArrowRight size={14} />
          </Link>
        </section>
      ) : null}

      <section className="content-grid">
        <article className="content-card">
          <h2 className="card-heading">
            <span className="card-heading-icon" aria-hidden="true">
              <Plus size={18} />
            </span>
            Novo conteúdo
          </h2>
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
            <button type="submit" className="primary-button button-with-spinner" disabled={isCreating}>
              {isCreating ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Criar conteúdo</span>
                </>
              )}
            </button>
          </form>
        </article>

        <article className="content-card">
          <h2 className="card-heading">
            <span className="card-heading-icon" aria-hidden="true">
              <FileText size={18} />
            </span>
            Conteúdos cadastrados
          </h2>
          {isLoading ? <SkeletonList items={3} /> : null}
          {!isLoading && errorMessage ? <p className="feedback error">{errorMessage}</p> : null}
          {!isLoading && !errorMessage && conteudos.length === 0 ? (
            <div className="empty-state">
              <FileText size={36} className="empty-state-svg" aria-hidden="true" />
              <strong>Nenhum conteúdo nesta matéria ainda</strong>
              <p className="muted">
                Adicione um texto teórico usando o formulário ao lado para a IA gerar resumo,
                pontos-chave, questões e flashcards.
              </p>
            </div>
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
                    <ChevronRight size={18} className="matter-item-arrow" aria-hidden="true" />
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
