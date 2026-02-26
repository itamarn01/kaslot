import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FiGrid, FiCalendar, FiUsers, FiSettings } from 'react-icons/fi';

import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';

function Layout({ children }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 z-50">
        <div className="p-4 hidden md:block">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Kaslot</h1>
        </div>
        <ul className="flex md:flex-col justify-around md:justify-start p-2 md:p-4 gap-2">
          <li>
            <Link to="/" className="flex flex-col md:flex-row items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition">
              <FiGrid size={24} className="text-blue-400" />
              <span className="text-xs md:text-base">דשבורד</span>
            </Link>
          </li>
          <li>
            <Link to="/events" className="flex flex-col md:flex-row items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition">
              <FiCalendar size={24} className="text-emerald-400" />
              <span className="text-xs md:text-base">אירועים</span>
            </Link>
          </li>
          <li>
            <Link to="/suppliers" className="flex flex-col md:flex-row items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition">
              <FiUsers size={24} className="text-purple-400" />
              <span className="text-xs md:text-base">ספקים/נגנים</span>
            </Link>
          </li>
          <li>
            <Link to="/settings" className="flex flex-col md:flex-row items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition">
              <FiSettings size={24} className="text-slate-400" />
              <span className="text-xs md:text-base">הגדרות</span>
            </Link>
          </li>
        </ul>
      </nav>

      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
