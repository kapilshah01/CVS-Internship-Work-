import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import WhatsAppButton from './components/WhatsAppButton';
import { dbGetCurrentUser, dbLogoutUser, dbOnAuthStateChange, isSupabaseConfigured } from './utils/db';
import AdminProtectedRoute from './admin/ProtectedRoute';

/* Lazy load pages for code splitting */
const Home = lazy(() => import('./pages/Home'));
const EmployeeLogin = lazy(() => import('./pages/Login'));
const StaffRegister = lazy(() => import('./pages/Register'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const AdminDashboard = lazy(() => import('./admin/Dashboard'));
const AdminLogin = lazy(() => import('./admin/Login'));
const AdminEmployees = lazy(() => import('./admin/Clients'));
const AdminAppointments = lazy(() => import('./admin/Appointments'));
const AdminInquiries = lazy(() => import('./admin/Inquiries'));
const AdminFeedback = lazy(() => import('./admin/Feedback'));
const AdminInvoices = lazy(() => import('./admin/Invoices'));
const AdminServices = lazy(() => import('./admin/Services'));

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner"></div>
    </div>
  );
}

function SetupNotice() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8fafc' }}>
      <div style={{ maxWidth: '760px', width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 8px 30px rgba(10,22,40,0.08)', padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.75rem', fontSize: '1.6rem' }}>Supabase Setup Required</h1>
        <p style={{ marginBottom: '1rem', color: '#475569', lineHeight: 1.7 }}>
          The app is now using a real database, but the Supabase environment keys are missing, so the site cannot connect yet.
        </p>
        <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Create `china_consultant/.env` with:</p>
        <pre style={{ margin: 0, padding: '1rem', background: '#0f172a', color: '#e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`}</pre>
        <p style={{ marginTop: '1rem', color: '#475569', lineHeight: 1.7 }}>
          Then restart the Vite server and refresh `http://localhost:5173`.
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    const loginPath = allowedRoles?.includes('employee') ? '/employee/login' : '/admin/login';
    return <Navigate to={loginPath} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes({ user, isDark, toggleDark, handleLogin, handleLogout }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && (
        <Navbar onToggleDarkMode={toggleDark} isDark={isDark} user={user} onLogout={handleLogout} />
      )}

      <div id="main-content">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<><Home /><Footer /></>} />
            <Route path="/employee/login" element={<EmployeeLogin onLogin={handleLogin} />} />
            <Route path="/register" element={<StaffRegister />} />
            <Route path="/employee/register" element={<StaffRegister initialRole="employee" />} />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={['employee']}>
                  <EmployeeDashboard user={user} /><Footer />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
            <Route path="/admin/register" element={<StaffRegister initialRole="admin" />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute user={user}>
                  <AdminDashboard user={user} />
                </AdminProtectedRoute>
              }
            />
            <Route path="/admin/employees" element={<AdminProtectedRoute user={user}><AdminEmployees user={user} /></AdminProtectedRoute>} />
            <Route path="/admin/clients" element={<Navigate to="/admin/employees" replace />} />
            <Route path="/admin/appointments" element={<AdminProtectedRoute user={user}><AdminAppointments user={user} /></AdminProtectedRoute>} />
            <Route path="/admin/inquiries" element={<AdminProtectedRoute user={user}><AdminInquiries user={user} /></AdminProtectedRoute>} />
            <Route path="/admin/feedback" element={<AdminProtectedRoute user={user}><AdminFeedback user={user} /></AdminProtectedRoute>} />
            <Route path="/admin/invoices" element={<AdminProtectedRoute user={user}><AdminInvoices user={user} /></AdminProtectedRoute>} />
            <Route path="/admin/services" element={<AdminProtectedRoute user={user}><AdminServices user={user} /></AdminProtectedRoute>} />
            <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/employee-dashboard" element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/employee/login" replace />} />
            <Route path="/customer-dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      {!isAdminRoute && <ChatBot />}
      {!isAdminRoute && <WhatsAppButton />}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cvs-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const currentUser = await dbGetCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    loadSession();

    const { data: authListener } = dbOnAuthStateChange((nextUser) => {
      if (mounted) {
        setUser(nextUser);
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const warmRoutes = () => {
      import('./pages/Login');
      import('./pages/Register');
      import('./pages/EmployeeDashboard');
      import('./admin/Dashboard');
      import('./admin/Clients');
      import('./admin/Appointments');
      import('./admin/Inquiries');
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmRoutes);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(warmRoutes, 600);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('cvs-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);
  const handleLogin = (userData) => setUser(userData);
  const handleLogout = async () => {
    await dbLogoutUser();
    setUser(null);
  };

  if (!authReady) {
    return <LoadingSpinner />;
  }

  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AppRoutes user={user} isDark={isDark} toggleDark={toggleDark} handleLogin={handleLogin} handleLogout={handleLogout} />
    </BrowserRouter>
  );
}
