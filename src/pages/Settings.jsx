import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiLink, FiUnlock, FiCheckCircle, FiXCircle, FiLock, FiUser, FiLogOut, FiMail, FiShield } from 'react-icons/fi';

export default function Settings() {
    const { user, logout, updateUser } = useAuth();
    const [googleConnected, setGoogleConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    // Change name
    const [newName, setNewName] = useState('');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameSuccess, setNameSuccess] = useState('');
    const [nameError, setNameError] = useState('');

    // Change password
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passSuccess, setPassSuccess] = useState('');
    const [passError, setPassError] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        if (user) setNewName(user.name || '');
        checkGoogleStatus();
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'connected') {
            setGoogleConnected(true);
            window.history.replaceState({}, document.title, '/settings');
        }
    }, [user]);

    const checkGoogleStatus = async () => {
        try {
            const res = await api.get('/google/status');
            setGoogleConnected(res.data.connected);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const res = await api.get('/google/auth-url');
            window.location.href = res.data.url;
        } catch (err) {
            console.error(err);
            alert('שגיאה בחיבור לגוגל');
        }
    };

    const handleDisconnectGoogle = async () => {
        if (window.confirm('האם אתה בטוח שברצונך לנתק את חשבון Google?')) {
            try {
                await api.delete('/google/disconnect');
                setGoogleConnected(false);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleChangeName = async (e) => {
        e.preventDefault();
        if (!newName.trim() || newName.trim().length < 2) {
            setNameError('השם חייב להיות לפחות 2 תווים.');
            return;
        }
        setNameLoading(true);
        setNameError('');
        setNameSuccess('');
        try {
            const res = await api.put('/auth/change-name', { name: newName.trim() });
            updateUser(res.data.user);
            setNameSuccess('השם שונה בהצלחה!');
            setTimeout(() => setNameSuccess(''), 3000);
        } catch (err) {
            setNameError(err.response?.data?.message || 'שגיאה בשינוי שם');
        } finally {
            setNameLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassError('הסיסמאות אינן תואמות.');
            return;
        }
        if (passwords.new.length < 6) {
            setPassError('הסיסמה חייבת להיות לפחות 6 תווים.');
            return;
        }
        setPassLoading(true);
        setPassError('');
        setPassSuccess('');
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            setPassSuccess('הסיסמה שונתה בהצלחה!');
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setPassSuccess(''), 3000);
        } catch (err) {
            setPassError(err.response?.data?.message || 'שגיאה בשינוי סיסמה');
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">הגדרות</h2>

            {/* Profile Info */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <FiUser className="text-blue-400" size={20} />
                    פרופיל
                </h3>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-slate-100 font-medium text-lg">{user?.name}</p>
                            <p className="text-slate-400 text-sm flex items-center gap-1">
                                <FiMail size={14} /> {user?.email}
                            </p>
                            <p className="text-xs mt-1 flex items-center gap-1">
                                <FiShield size={12} className="text-blue-400" />
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.authProvider === 'google'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    {user?.authProvider === 'google' ? '🔗 Google' : '📧 אימייל'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl border border-red-500/20 transition font-medium text-sm"
                    >
                        <FiLogOut size={18} />
                        <span className="hidden sm:inline">התנתק</span>
                    </button>
                </div>
            </div>

            {/* Change Name */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <FiUser className="text-emerald-400" size={20} />
                    שינוי שם
                </h3>
                <form onSubmit={handleChangeName} className="space-y-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
                        placeholder="שם חדש"
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                    />
                    <button
                        type="submit"
                        disabled={nameLoading || newName.trim() === user?.name}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition shadow-lg font-medium"
                    >
                        {nameLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'שמור שם'}
                    </button>
                    {nameSuccess && <p className="text-emerald-400 text-sm">{nameSuccess}</p>}
                    {nameError && <p className="text-red-400 text-sm">{nameError}</p>}
                </form>
            </div>

            {/* Change Password - only for email users */}
            {user?.authProvider === 'email' && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <FiLock className="text-orange-400" size={20} />
                        שינוי סיסמה
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            placeholder="סיסמה נוכחית"
                            required
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                        />
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            placeholder="סיסמה חדשה (לפחות 6 תווים)"
                            required
                            minLength={6}
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                        />
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            placeholder="אימות סיסמה חדשה"
                            required
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                        />
                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={passLoading}
                                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-xl transition shadow-lg font-medium"
                            >
                                {passLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'שנה סיסמה'}
                            </button>
                            <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
                                <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} className="rounded" />
                                הצג סיסמאות
                            </label>
                        </div>
                        {passSuccess && <p className="text-emerald-400 text-sm">{passSuccess}</p>}
                        {passError && <p className="text-red-400 text-sm">{passError}</p>}
                    </form>
                </div>
            )}

            {/* Google Connection */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <img src="https://www.gstatic.com/images/branding/product/1x/googleg_16dp.png" alt="Google" className="w-5 h-5" />
                    חיבור חשבון Google Calendar
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                    חבר את חשבון Google שלך כדי לשלוח זימונים ב-Google Calendar ולסנכרן נתונים עם Google Sheets.
                </p>
                {loading ? (
                    <p className="text-slate-500">בודק חיבור...</p>
                ) : googleConnected ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <FiCheckCircle size={20} />
                            <span className="font-medium">חשבון Google מחובר</span>
                        </div>
                        <button
                            onClick={handleDisconnectGoogle}
                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition"
                        >
                            <FiUnlock size={16} />
                            נתק חשבון
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnectGoogle}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl transition shadow-lg font-medium"
                    >
                        <FiLink size={16} />
                        חבר חשבון Google
                    </button>
                )}
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4">אמצעי תשלום נתמכים</h3>
                <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> מזומן</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> ביט</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400"></span> פייבוקס</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> העברה בנקאית</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> ציק</li>
                </ul>
                <p className="mt-4 text-sm text-slate-500">אלו מוגדרים במערכת כברירת מחדל ולא ניתנים לעריכה כרגע.</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4">מטבעות</h3>
                <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> שקל דיגיטלי (₪)</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> דולר אמריקאי ($)</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400"></span> יורו (€)</li>
                </ul>
            </div>

            {/* Logout - visible on mobile */}
            <div className="md:hidden">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-4 rounded-2xl border border-red-500/20 transition font-medium"
                >
                    <FiLogOut size={18} />
                    התנתק
                </button>
            </div>
        </div>
    );
}
