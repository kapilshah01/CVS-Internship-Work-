import AdminShell from './AdminShell';
import { isSupabaseConfigured } from '../utils/db';

export default function Settings({ user }) {
  return (
    <AdminShell user={user} title="Settings" subtitle="Operational notes for production deployment.">
      <div className="dashboard__panel">
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Environment</h3>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }}>
          Supabase connection: <strong>{isSupabaseConfigured ? 'Configured' : 'Missing keys'}</strong>
        </p>
        <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-text-light)', lineHeight: 1.8 }}>
          <li>Use `.env` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.</li>
          <li>Run `supabase_schema.sql` in the SQL editor before using live features.</li>
          <li>Keep Row Level Security enabled in production.</li>
          <li>Staff accounts are created from the website register page using office access codes.</li>
          <li>Admins can register directly from `/admin/register` using the administrator access code.</li>
          <li>New staff users must verify their email from the Supabase confirmation message before login.</li>
          <li>Employees can log in after verification, and admins can review employee details from the admin panel.</li>
          <li>New admin accounts remain pending until an existing active admin approves them.</li>
          <li>Admin accounts should be kept limited to trusted office users only.</li>
        </ul>
      </div>
    </AdminShell>
  );
}
