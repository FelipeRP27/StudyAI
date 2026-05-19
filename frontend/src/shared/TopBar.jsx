import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronDown, ListTodo, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { to: '/desempenho', label: 'Desempenho', icon: BarChart3 }
];

function TopBar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const inicial = (usuario?.nome || '?').trim().charAt(0).toUpperCase();
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'estudante';

  return (
    <header className="topbar">
      <NavLink to="/dashboard" className="topbar-brand">
        StudyAI
      </NavLink>

      <nav className="topbar-nav" aria-label="Navegação principal">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} strokeWidth={2.2} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="topbar-profile" ref={menuRef}>
        <button
          type="button"
          className="topbar-profile-button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="topbar-avatar" aria-hidden="true">
            {inicial}
          </span>
          <span className="topbar-profile-name">{primeiroNome}</span>
          <ChevronDown size={14} className="topbar-caret" aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div className="topbar-menu" role="menu">
            <p className="topbar-menu-user">
              <strong>{usuario?.nome}</strong>
              <span>{usuario?.email}</span>
            </p>
            <button
              type="button"
              className="topbar-menu-item danger"
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default TopBar;
