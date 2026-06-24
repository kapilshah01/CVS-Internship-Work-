import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

export default function AdminShell({ user, title, subtitle, actions, children }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-shell__main">
        <AdminNavbar user={user} title={title} subtitle={subtitle} actions={actions} />
        <div className="admin-shell__content">
          {children}
        </div>
      </div>
    </div>
  );
}
