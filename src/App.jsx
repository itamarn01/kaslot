import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FiGrid, FiCalendar, FiUsers, FiSettings, FiCreditCard, FiPieChart, FiLogOut } from 'react-icons/fi';

import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import Partners from './pages/Partners';
import SupplierReport from './pages/SupplierReport';
import PartnerReport from './pages/PartnerReport';

function NavLink({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <li>
      <Link
        to={to}
        className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 rounded-xl transition text-xs md:text-base
          ${isActive
            ? 'bg-blue-500/20 text-blue-400'
            : 'hover:bg-slate-700 text-slate-400 hover:text-slate-100'
          }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 text-slate-100">
      <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 z-50">
        <div className="p-4 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">K</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Kaslot</h1>
          </div>
        </div>
        {/* User info */}
        {user && (
          <div className="hidden md:flex items-center gap-2 px-4 pb-3 border-b border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <ul className="flex md:flex-col justify-around md:justify-start px-2 py-1 md:p-4 gap-1">
          <NavLink to="/" icon={<FiGrid size={22} />} label="דשבורד" />
          <NavLink to="/events" icon={<FiCalendar size={22} />} label="אירועים" />
          <NavLink to="/payments" icon={<FiCreditCard size={22} />} label="תשלומים" />
          <NavLink to="/suppliers" icon={<FiUsers size={22} />} label="ספקים" />
          <NavLink to="/partners" icon={<FiPieChart size={22} />} label="שותפים" />
          <NavLink to="/settings" icon={<FiSettings size={22} />} label="הגדרות" />
        </ul>
        {/* Logout button - desktop only */}
        <div className="hidden md:block px-4 mt-auto pb-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-sm"
          >
            <FiLogOut size={18} />
            <span>התנתק</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto" dir="rtl">
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <Routes>
      {/* Auth page */}
      <Route path="/auth" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Auth />
      } />

      {/* Public share pages - no nav, no auth */}
      <Route path="/supplier-report/:id" element={<SupplierReport />} />
      <Route path="/partner-report/:id" element={<PartnerReport />} />

      {/* Main app with nav - protected */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
