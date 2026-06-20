import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import WhatsAppButton from './components/WhatsAppButton';

/* Lazy load pages for code splitting */
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner"></div>
    </div>
  );
}

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cvs-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const warmRoutes = () => {
      import('./pages/Login');
      import('./pages/Register');
      import('./pages/CustomerDashboard');
      import('./pages/EmployeeDashboard');
      import('./pages/AdminDashboard');
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
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar onToggleDarkMode={toggleDark} isDark={isDark} user={user} onLogout={handleLogout} />

      <div id="main-content">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<><Home /><Footer /></>} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route
              path="/customer-dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={['customer']}>
                  <CustomerDashboard user={user} /><Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={['employee']}>
                  <EmployeeDashboard user={user} /><Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={['admin']}>
                  <AdminDashboard user={user} /><Footer />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      <ChatBot />
      <WhatsAppButton />
    </BrowserRouter>
  );
}
