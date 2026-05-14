import { useState } from 'react';

function CopyButton({ text, label = 'Copiar' }) {
  const [copiado, setCopiado] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (error) {
      console.error('[CopyButton] falha ao copiar:', error.message);
    }
  };

  return (
    <button
      type="button"
      className={`copy-button ${copiado ? 'copied' : ''}`}
      onClick={handleCopy}
      aria-label={label}
    >
      {copiado ? '✓ Copiado' : label}
    </button>
  );
}

export default CopyButton;
