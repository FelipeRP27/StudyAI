function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-brand">
        <p className="eyebrow">StudyAI</p>
        <h1>Assistente inteligente para concursos públicos</h1>
        <p>
          Organize matérias, concentre conteúdos e prepare a base para estudos ativos em um único
          fluxo.
        </p>
      </section>

      <section className="auth-panel auth-panel-form">
        <header className="auth-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </header>

        {children}
      </section>
    </main>
  );
}

export default AuthShell;
