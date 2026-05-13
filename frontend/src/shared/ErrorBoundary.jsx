import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign('/dashboard');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="dashboard-page">
        <section className="content-card">
          <h2>Algo deu errado</h2>
          <p className="muted">
            A pagina encontrou um erro inesperado. Voce pode voltar ao dashboard e tentar
            novamente.
          </p>
          {this.state.error?.message ? (
            <p className="feedback error">{this.state.error.message}</p>
          ) : null}
          <button type="button" className="primary-button" onClick={this.handleReset}>
            Voltar ao dashboard
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
