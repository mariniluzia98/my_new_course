import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useActiveUser } from '../context/ActiveUserContext';


export const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser, usuarios } = useActiveUser();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const getBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-danger text-white';
      case 'Instrutor': return 'bg-info text-dark';
      default: return 'bg-primary text-white';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark glass-panel py-3 mb-4 rounded-0 border-top-0 border-start-0 border-end-0 sticky-top">
      <div className="container">
        <Link className="navbar-brand navbar-brand-custom text-gradient-primary d-flex align-items-center gap-2" to="/">
          <i className="bi bi-terminal-fill fs-3 text-gradient-secondary"></i>
          <span>Curso_DEV</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          aria-controls="navbarNav"
          aria-expanded={menuAberto}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${menuAberto ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${isActive('/dashboard')}`} to="/dashboard">
                <i className="bi bi-grid-1x2-fill"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${isActive('/cursos')}`} to="/cursos">
                <i className="bi bi-journal-code"></i> Cursos
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${isActive('/trilhas')}`} to="/trilhas">
                <i className="bi bi-map"></i> Trilhas
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${isActive('/usuarios')}`} to="/usuarios">
                <i className="bi bi-people-fill"></i> Usuários
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${isActive('/financeiro')}`} to="/financeiro">
                <i className="bi bi-currency-dollar"></i> Financeiro
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom d-flex align-items-center gap-2 ${isActive('/certificados')}`} to="/certificados">
                <i className="bi bi-award-fill"></i> Certificados
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {currentUser && (
              <div className="d-flex align-items-center gap-2 me-2">
                <div className="text-end d-none d-sm-block">
                  <div className="fw-semibold text-white fs-7">{currentUser.NomeCompleto}</div>
                  <span className={`badge badge-custom ${getBadgeColor(currentUser.Cargo)}`} style={{ fontSize: '0.7rem' }}>
                    {currentUser.Cargo}
                  </span>
                </div>
                <div className="avatar-circle rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px' }}>
                  {currentUser.NomeCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              </div>
            )}

            <div className="border-start ps-3 border-secondary d-flex align-items-center gap-2">
              <span className="text-secondary fs-7 d-none d-md-inline"><i className="bi bi-person-circle"></i> Perfil:</span>
              <select
                className="form-select form-select-custom py-1 px-2 border-0"
                style={{ fontSize: '0.85rem', width: 'auto', backgroundPosition: 'right 8px center' }}
                value={currentUser?.ID_Usuario || ''}
                onChange={(e) => {
                  const targetId = Number(e.target.value);
                  const found = usuarios.find(u => u.ID_Usuario === targetId);
                  if (found) setCurrentUser(found);
                }}
              >
                {usuarios.map(u => (
                  <option key={u.ID_Usuario} value={u.ID_Usuario}>
                    {u.NomeCompleto} ({u.Cargo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
