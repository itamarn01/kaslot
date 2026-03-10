import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft, FiSend } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Auth() {
    const { login } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const codeInputsRef = useRef([]);

    // Floating particles
    const [particles] = useState(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5,
        }))
    );

    // Handle Google OAuth callback: ?token=...&name=...&email=...&provider=google
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const name = params.get('name');
        const email = params.get('email');
        const provider = params.get('provider');
        const userId = params.get('userId');
        const googleError = params.get('error');

        // Clean URL
        if (token || googleError) {
            window.history.replaceState({}, document.title, '/auth');
        }

        if (googleError) {
            setError(googleError === 'google_cancelled' ? 'ההתחברות עם Google בוטלה.' : 'שגיאה בהתחברות עם Google. נסה שוב.');
            return;
        }

        if (token && email) {
            // Login completed via Google redirect
            login(
                { _id: userId, name: decodeURIComponent(name || ''), email: decodeURIComponent(email), authProvider: provider || 'google' },
                token
            );
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password,
            });
            if (res.data.requiresVerification) {
                setUserId(res.data.userId);
                setMode('verify');
                setSuccess('קוד אימות נשלח למייל שלך.');
            } else {
                login(res.data.user, res.data.token);
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.requiresVerification) {
                setUserId(data.userId);
                setMode('verify');
                setSuccess('קוד אימות נשלח למייל שלך.');
            } else {
                setError(data?.message || 'שגיאה בהתחברות');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', formData);
            setUserId(res.data.userId);
            setMode('verify');
            setSuccess('נרשמת בהצלחה! קוד אימות נשלח למייל שלך.');
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה בהרשמה');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        if (value && index < 5) codeInputsRef.current[index + 1]?.focus();
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            codeInputsRef.current[index - 1]?.focus();
        }
    };

    const handleCodePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setVerificationCode(pasted.split(''));
            codeInputsRef.current[5]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const code = verificationCode.join('');
        if (code.length !== 6) { setError('יש להזין קוד בן 6 ספרות.'); setLoading(false); return; }
        try {
            const res = await api.post('/auth/verify-email', { userId, code });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה באימות');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/resend-code', { userId });
            setSuccess('קוד חדש נשלח למייל שלך.');
            setVerificationCode(['', '', '', '', '', '']);
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה בשליחת קוד');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email: resetEmail });
            setMode('reset');
            setSuccess('קוד איפוס נשלח למייל שלך.');
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { email: resetEmail, code: resetCode, newPassword });
            setSuccess('הסיסמה שונתה בהצלחה! ניתן להתחבר.');
            setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה באיפוס סיסמה');
        } finally {
            setLoading(false);
        }
    };

    // ─── Google Sign-In via Backend OAuth Redirect ───
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/auth/google/url');
            window.location.href = res.data.url;
        } catch (err) {
            setError('שגיאה בהתחברות עם Google. בדוק שהשרת פועל.');
            setLoading(false);
        }
    };

    // Reusable Google Button SVG
    const GoogleIcon = () => (
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );

    const Divider = () => (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-800 px-4 text-sm text-slate-400">או</span></div>
        </div>
    );

    const GoogleButton = ({ label }) => (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-100 font-medium py-3.5 rounded-xl transition duration-300 disabled:opacity-50"
        >
            {loading ? <span className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin" /> : <GoogleIcon />}
            {label}
        </button>
    );

    const Spinner = () => <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden px-4" dir="rtl">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />
                {particles.map(p => (
                    <div key={p.id} className="absolute rounded-full bg-blue-400/20" style={{
                        left: `${p.x}%`, top: `${p.y}%`,
                        width: `${p.size}px`, height: `${p.size}px`,
                        animation: `float ${p.duration}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`,
                    }} />
                ))}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.08) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Auth Card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 shadow-lg shadow-blue-500/25 mb-4">
                        <span className="text-white font-bold text-3xl">K</span>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Kaslot</h1>
                    <p className="text-slate-400 mt-2 text-sm">ניהול כספים חכם ללהקות ונגנים</p>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/20 p-8">

                    {/* ─── LOGIN ─── */}
                    {mode === 'login' && (
                        <>
                            <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">התחברות</h2>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="relative">
                                    <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input id="login-email" type="email" name="email" placeholder="כתובת מייל"
                                        value={formData.email} onChange={handleChange} required
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition" />
                                </div>
                                <div className="relative">
                                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input id="login-password" type={showPassword ? 'text' : 'password'} name="password" placeholder="סיסמה"
                                        value={formData.password} onChange={handleChange} required
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-12 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                                <div className="flex justify-start">
                                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition">שכחת סיסמה?</button>
                                </div>
                                <button id="login-submit" type="submit" disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-50">
                                    {loading ? <Spinner /> : 'התחבר'}
                                </button>
                            </form>
                            <Divider />
                            <GoogleButton label="התחבר עם Google" />
                            <p className="text-center text-slate-400 text-sm mt-6">
                                אין לך חשבון?{' '}
                                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition">הירשם עכשיו</button>
                            </p>
                        </>
                    )}

                    {/* ─── REGISTER ─── */}
                    {mode === 'register' && (
                        <>
                            <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">יצירת חשבון</h2>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="relative">
                                    <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input id="register-name" type="text" name="name" placeholder="שם מלא"
                                        value={formData.name} onChange={handleChange} required
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                                <div className="relative">
                                    <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input id="register-email" type="email" name="email" placeholder="כתובת מייל"
                                        value={formData.email} onChange={handleChange} required
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                </div>
                                <div className="relative">
                                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input id="register-password" type={showPassword ? 'text' : 'password'} name="password" placeholder="סיסמה (לפחות 6 תווים)"
                                        value={formData.password} onChange={handleChange} required minLength={6}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-12 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                                <button id="register-submit" type="submit" disabled={loading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                                    {loading ? <Spinner /> : 'הירשם'}
                                </button>
                            </form>
                            <Divider />
                            <GoogleButton label="הירשם עם Google" />
                            <p className="text-center text-slate-400 text-sm mt-6">
                                כבר יש לך חשבון?{' '}
                                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition">התחבר</button>
                            </p>
                        </>
                    )}

                    {/* ─── VERIFY EMAIL ─── */}
                    {mode === 'verify' && (
                        <>
                            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-4 transition">
                                <FiArrowLeft size={16} /> חזור
                            </button>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                                    <FiSend className="text-blue-400" size={28} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-100">אימות מייל</h2>
                                <p className="text-slate-400 text-sm mt-2">הזן את הקוד בן 6 הספרות שנשלח למייל שלך</p>
                            </div>
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleCodePaste}>
                                    {verificationCode.map((digit, i) => (
                                        <input key={i} ref={el => codeInputsRef.current[i] = el}
                                            type="text" inputMode="numeric" maxLength={1} value={digit}
                                            onChange={e => handleCodeChange(i, e.target.value)}
                                            onKeyDown={e => handleCodeKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-2xl font-bold bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                                    ))}
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-50">
                                    {loading ? <Spinner /> : 'אמת חשבון'}
                                </button>
                            </form>
                            <p className="text-center text-slate-400 text-sm mt-4">
                                לא קיבלת קוד?{' '}
                                <button onClick={handleResendCode} disabled={loading}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition disabled:opacity-50">שלח שוב</button>
                            </p>
                        </>
                    )}

                    {/* ─── FORGOT PASSWORD ─── */}
                    {mode === 'forgot' && (
                        <>
                            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-4 transition">
                                <FiArrowLeft size={16} /> חזור
                            </button>
                            <h2 className="text-2xl font-bold text-slate-100 mb-2 text-center">שכחתי סיסמה</h2>
                            <p className="text-slate-400 text-sm text-center mb-6">הזן את המייל שלך ונשלח קוד איפוס</p>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="relative">
                                    <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="email" placeholder="כתובת מייל" value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)} required
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition" />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg disabled:opacity-50">
                                    {loading ? <Spinner /> : 'שלח קוד איפוס'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ─── RESET PASSWORD ─── */}
                    {mode === 'reset' && (
                        <>
                            <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-4 transition">
                                <FiArrowLeft size={16} /> חזור
                            </button>
                            <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">איפוס סיסמה</h2>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <input type="text" placeholder="קוד איפוס (6 ספרות)" value={resetCode}
                                    onChange={e => setResetCode(e.target.value)} required maxLength={6}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 px-4 text-center text-2xl tracking-widest text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition" />
                                <div className="relative">
                                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type={showPassword ? 'text' : 'password'} placeholder="סיסמה חדשה (לפחות 6 תווים)"
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl py-3.5 pr-12 pl-12 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg disabled:opacity-50">
                                    {loading ? <Spinner /> : 'שנה סיסמה'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Error / Success */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-shake">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center">
                            {success}
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">© 2024 Kaslot. כל הזכויות שמורות.</p>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
        </div>
    );
}
