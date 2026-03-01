import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FiGrid, FiCalendar, FiUsers, FiSettings, FiCreditCard } from 'react-icons/fi';

import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import SupplierReport from './pages/SupplierReport';

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
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 text-slate-100">
      <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 z-50">
        <div className="p-4 hidden md:flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">K</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Kaslot</h1>
        </div>
        <ul className="flex md:flex-col justify-around md:justify-start px-2 py-1 md:p-4 gap-1">
          <NavLink to="/" icon={<FiGrid size={22} />} label="דשבורד" />
          <NavLink to="/events" icon={<FiCalendar size={22} />} label="אירועים" />
          <NavLink to="/payments" icon={<FiCreditCard size={22} />} label="תשלומים" />
          <NavLink to="/suppliers" icon={<FiUsers size={22} />} label="ספקים" />
          <NavLink to="/settings" icon={<FiSettings size={22} />} label="הגדרות" />
        </ul>
      </nav>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto" dir="rtl">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public share page - no nav */}
        <Route path="/supplier-report/:id" element={<SupplierReport />} />

        {/* Main app with nav */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
