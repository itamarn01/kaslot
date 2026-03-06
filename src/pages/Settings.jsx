import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiLink, FiUnlock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function Settings() {
    const [googleConnected, setGoogleConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkGoogleStatus();
        // Check if returning from Google OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'connected') {
            setGoogleConnected(true);
            // Clean URL
            window.history.replaceState({}, document.title, '/settings');
        }
    }, []);

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

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">הגדרות מתקדמות</h2>

            {/* Google Connection */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <img src="https://www.gstatic.com/images/branding/product/1x/googleg_16dp.png" alt="Google" className="w-5 h-5" />
                    חיבור חשבון Google
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
        </div>
    );
}
