import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/services', label: 'Services' },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <span className="navbar__logo-icon">CV</span>
        <div>
          <strong>Admin Panel</strong>
          <p>China Visa Service</p>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
