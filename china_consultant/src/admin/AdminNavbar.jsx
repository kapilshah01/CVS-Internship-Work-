import { useNavigate } from 'react-router-dom';
import { dbLogoutUser } from '../utils/db';

export default function AdminNavbar({ user, title, subtitle, actions }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dbLogoutUser();
    navigate('/admin/login');
  };

  return (
    <header className="admin-navbar">
      <div>
        <p className="admin-navbar__eyebrow">Secure workspace</p>
        <h1 className="admin-navbar__title">{title}</h1>
        {subtitle && <p className="admin-navbar__subtitle">{subtitle}</p>}
      </div>

      <div className="admin-navbar__actions">
        {actions}
        <div className="admin-navbar__user">
          <strong>{user?.name || 'Admin'}</strong>
          <span>{user?.email}</span>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
