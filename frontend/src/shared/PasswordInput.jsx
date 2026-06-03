import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  ariaInvalid,
  ariaDescribedBy
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="password-field">
      <input
        name={name}
        type={visivel ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default PasswordInput;
