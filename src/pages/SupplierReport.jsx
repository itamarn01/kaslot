import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { FiCalendar, FiMapPin, FiUser, FiCreditCard, FiLink, FiPhone, FiFileText, FiKey, FiCheckCircle, FiAlertCircle, FiX, FiExternalLink } from 'react-icons/fi';

const MORNING_STORAGE_KEY = 'morning_api_creds';

export default function SupplierReport() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Morning API state
    const [morningToken, setMorningToken] = useState(null);
    const [morningConnecting, setMorningConnecting] = useState(false);
    const [morningError, setMorningError] = useState('');
    const [morningCreds, setMorningCreds] = useState({ apiId: '', apiSecret: '' });
    const [showMorningForm, setShowMorningForm] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState({});
    const [invoiceResults, setInvoiceResults] = useState({});

    useEffect(() => {
        api.get(`/suppliers/${id}/report`)
            .then(res => setReport(res.data))
            .catch(() => setError('לא ניתן לטעון את הדוח. ייתכן שהקישור אינו תקין.'))
            .finally(() => setLoading(false));

        // Restore saved credentials if any
        try {
            const saved = localStorage.getItem(`${MORNING_STORAGE_KEY}_${id}`);
            if (saved) {
                const { token, apiId } = JSON.parse(saved);
                if (token) { setMorningToken(token); setMorningCreds(prev => ({ ...prev, apiId: apiId || '' })); }
            }
        } catch {}
    }, [id]);

    const getCurrencySymbol = (currency) => {
        switch (currency) {
            case 'Dollar': return '$';
            case 'Euro': return '€';
            default: return '₪';
        }
    };

    const methodLabel = (method) => {
        const map = { Cash: 'מזומן', Bit: 'ביט', Paybox: 'פייבוקס', 'Bank Transfer': 'העברה בנקאית', Check: "צ'ק", Loan: 'הלוואה' };
        return map[method] || method;
    };

    const handleMorningConnect = async (e) => {
        e.preventDefault();
        setMorningConnecting(true);
        setMorningError('');
        try {
            const res = await api.post('/morning/token', { apiId: morningCreds.apiId, apiSecret: morningCreds.apiSecret });
            const token = res.data.token;
            setMorningToken(token);
            setShowMorningForm(false);
            localStorage.setItem(`${MORNING_STORAGE_KEY}_${id}`, JSON.stringify({ token, apiId: morningCreds.apiId }));
        } catch (err) {
            setMorningError(err.response?.data?.message || 'שגיאה בהתחברות');
        } finally {
            setMorningConnecting(false);
        }
    };

    const handleCreateInvoice = async (ev) => {
        if (!morningToken) return;
        setInvoiceLoading(prev => ({ ...prev, [ev._id]: true }));
        try {
            const res = await api.post('/morning/create-invoice', {
                token: morningToken,
                eventTitle: ev.title,
                eventDate: ev.date,
                amount: Math.round(ev.expectedPay),
                clientName: report?.supplier?.name || 'לקוח',
                description: `שירותי נגינה - ${ev.title}`,
            });
            setInvoiceResults(prev => ({ ...prev, [ev._id]: { success: true, url: res.data.url } }));
        } catch (err) {
            const msg = err.response?.data?.message || 'שגיאה בהפקת החשבונית';
            setInvoiceResults(prev => ({ ...prev, [ev._id]: { success: false, error: msg } }));
        } finally {
            setInvoiceLoading(prev => ({ ...prev, [ev._id]: false }));
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-slate-400 text-xl animate-pulse">טוען דוח...</div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-slate-800 rounded-2xl p-8 text-center border border-red-500/30 max-w-md">
                <p className="text-red-400 text-lg">{error}</p>
            </div>
        </div>
    );

    const { supplier, events, payments, totalExpected, totalPaid, totalDebt = { Shekel: 0, Dollar: 0, Euro: 0 }, linkedBandExpenses = [], totalBandExpenses = { Shekel: 0 } } = report;
    const balance = {
        Shekel: totalExpected.Shekel + (totalBandExpenses.Shekel || 0) + (totalDebt.Shekel || 0) - totalPaid.Shekel,
        Dollar: totalExpected.Dollar + (totalDebt.Dollar || 0) - totalPaid.Dollar,
        Euro: totalExpected.Euro + (totalDebt.Euro || 0) - totalPaid.Euro,
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8" dir="rtl">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FiUser size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">{supplier.name}</h1>
                    <p className="text-slate-400 mt-1">{supplier.role}</p>
                    {supplier.contact_info && <p className="text-slate-500 text-sm mt-1">{supplier.contact_info}</p>}
                    <p className="text-xs text-slate-600 mt-3">דוח יוצר ע"י Kaslot • {new Date().toLocaleDateString('he-IL')}</p>
                </div>

                {/* Morning API Section */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FiFileText className="text-green-400" size={18} />
                            <h2 className="font-bold text-slate-100">חשבונית ירוקה / Morning API</h2>
                        </div>
                        {morningToken ? (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                    <FiCheckCircle size={14} /> מחובר
                                </span>
                                <button
                                    onClick={() => { setMorningToken(null); localStorage.removeItem(`${MORNING_STORAGE_KEY}_${id}`); }}
                                    className="text-xs text-slate-500 hover:text-red-400 transition"
                                >
                                    התנתק
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowMorningForm(v => !v)}
                                className="flex items-center gap-1.5 text-xs bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg transition"
                            >
                                <FiKey size={12} /> חבר API
                            </button>
                        )}
                    </div>

                    {showMorningForm && !morningToken && (
                        <form onSubmit={handleMorningConnect} className="p-4 space-y-3 border-b border-slate-700">
                            <p className="text-xs text-slate-400">הזן את מפתחות ה-API שלך מ-Morning (חשבונית ירוקה) להפקת חשבוניות אוטומטית.</p>
                            {morningError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                                    <FiAlertCircle size={12} /> {morningError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-2">
                                <input
                                    required
                                    type="text"
                                    placeholder="API ID"
                                    value={morningCreds.apiId}
                                    onChange={e => setMorningCreds(p => ({ ...p, apiId: e.target.value }))}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-green-500"
                                />
                                <input
                                    required
                                    type="password"
                                    placeholder="API Secret"
                                    value={morningCreds.apiSecret}
                                    onChange={e => setMorningCreds(p => ({ ...p, apiSecret: e.target.value }))}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={morningConnecting}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                                >
                                    {morningConnecting ? 'מתחבר...' : 'התחבר'}
                                </button>
                                <button type="button" onClick={() => setShowMorningForm(false)} className="px-3 py-2 text-slate-400 hover:text-slate-200 transition">
                                    <FiX size={16} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-600">המפתחות נשמרים רק בדפדפן שלך ואינם נשלחים לשרת אחסון.</p>
                        </form>
                    )}

                    {!morningToken && !showMorningForm && (
                        <p className="p-4 text-xs text-slate-500">חבר את ה-API של Morning כדי להפיק חשבוניות ישירות מדף זה לכל אירוע.</p>
                    )}
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {['Shekel', 'Dollar', 'Euro'].map(cur => (
                        (totalExpected[cur] > 0 || totalPaid[cur] > 0 || (totalDebt[cur] || 0) > 0 || (cur === 'Shekel' && (totalBandExpenses.Shekel || 0) > 0)) && (
                            <div key={cur} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                                <p className="text-xs text-slate-500 mb-3 font-medium">{cur === 'Shekel' ? 'שקל ₪' : cur === 'Dollar' ? 'דולר $' : 'יורו €'}</p>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">סה"כ לתשלום</span>
                                        <span className="text-blue-400 font-bold">{getCurrencySymbol(cur)}{totalExpected[cur].toLocaleString()}</span>
                                    </div>
                                    {cur === 'Shekel' && (totalBandExpenses.Shekel || 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-xs flex items-center gap-1"><FiLink size={9} /> הוצאות להקה</span>
                                            <span className="text-cyan-400 font-bold">₪{(totalBandExpenses.Shekel || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {(totalDebt[cur] || 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-xs">חוב (מגיע לי)</span>
                                            <span className="text-amber-400 font-bold">{getCurrencySymbol(cur)}{(totalDebt[cur] || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">שולם</span>
                                        <span className="text-emerald-400 font-bold">{getCurrencySymbol(cur)}{totalPaid[cur].toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-700 pt-1.5 flex justify-between">
                                        <span className="text-slate-300 font-bold">יתרה לתשלום</span>
                                        <span className={`font-bold ${balance[cur] > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {getCurrencySymbol(cur)}{Math.round(balance[cur]).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Events Grouped by Month */}
                {Object.keys(events.reduce((acc, ev) => {
                    const month = new Date(ev.date).toLocaleString('he-IL', { month: 'long', year: 'numeric' });
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(ev);
                    return acc;
                }, {})).map(month => {
                    const monthEvents = events.filter(ev => new Date(ev.date).toLocaleString('he-IL', { month: 'long', year: 'numeric' }) === month);
                    const monthProfit = monthEvents.reduce((acc, ev) => {
                        const cur = ev.currency || 'Shekel';
                        if (!acc[cur]) acc[cur] = 0;
                        acc[cur] += ev.expectedPay;
                        return acc;
                    }, {});

                    return (
                        <div key={month} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <FiCalendar className="text-emerald-400" />
                                    <h2 className="font-bold text-slate-100">{month}</h2>
                                </div>
                                <div className="text-left">
                                    {Object.entries(monthProfit).map(([cur, amount]) => (
                                        <div key={cur} className="text-emerald-400 font-bold text-sm">
                                            {getCurrencySymbol(cur)}{Math.round(amount).toLocaleString()}
                                        </div>
                                    ))}
                                    <div className="text-[10px] text-slate-500">סיכום חודשי</div>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {monthEvents.map(ev => (
                                    <div key={ev._id} className="p-4 hover:bg-slate-700/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-slate-100">{ev.title}</p>
                                                    {ev.eventType && (
                                                        <span className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20">
                                                            {ev.eventType}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2">
                                                    <span className="flex items-center gap-1"><FiCalendar size={12} className="text-slate-600" />{new Date(ev.date).toLocaleDateString('he-IL')}</span>
                                                    {ev.location && <span className="flex items-center gap-1"><FiMapPin size={12} className="text-slate-600" />{ev.location}</span>}
                                                    {ev.phone_number && (
                                                        <a href={`tel:${ev.phone_number}`} className="flex items-center gap-1 text-blue-400 hover:underline">
                                                            <FiPhone size={12} className="text-blue-500" /> {ev.phone_number}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left mr-4">
                                                <div className="text-lg font-bold text-blue-400 whitespace-nowrap">{getCurrencySymbol(ev.currency)}{Math.round(ev.expectedPay).toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-500">שכר לאירוע</div>
                                            </div>
                                        </div>

                                        {/* Morning Invoice Button */}
                                        {morningToken && (
                                            <div className="mt-3">
                                                {invoiceResults[ev._id] ? (
                                                    invoiceResults[ev._id].success ? (
                                                        <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                                            <FiCheckCircle size={13} />
                                                            <span className="font-medium">חשבונית הופקה!</span>
                                                            {invoiceResults[ev._id].url && (
                                                                <a href={invoiceResults[ev._id].url} target="_blank" rel="noreferrer"
                                                                   className="flex items-center gap-1 text-emerald-300 hover:underline mr-auto">
                                                                    <FiExternalLink size={11} /> פתח
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                                            <FiAlertCircle size={13} />
                                                            <span>{invoiceResults[ev._id].error}</span>
                                                            <button onClick={() => setInvoiceResults(p => { const n = {...p}; delete n[ev._id]; return n; })} className="mr-auto text-slate-400 hover:text-white">
                                                                <FiX size={12} />
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateInvoice(ev)}
                                                        disabled={invoiceLoading[ev._id]}
                                                        className="flex items-center gap-1.5 text-xs bg-green-600/15 hover:bg-green-600/25 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                                                    >
                                                        <FiFileText size={12} />
                                                        {invoiceLoading[ev._id] ? 'מפיק...' : 'הפק חשבונית'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Linked Band Expenses */}
                {linkedBandExpenses.length > 0 && (
                    <div className="bg-slate-800 rounded-2xl border border-cyan-500/20 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                            <FiLink className="text-cyan-400" />
                            <h2 className="font-bold text-slate-100">הוצאות להקה מקושרות ({linkedBandExpenses.length})</h2>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {linkedBandExpenses.map(exp => (
                                <div key={exp._id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-100">{exp.description}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(exp.date).toLocaleDateString('he-IL')}</p>
                                    </div>
                                    <span className="text-cyan-400 font-bold">₪{exp.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payments */}
                {payments.length > 0 && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                            <FiCreditCard className="text-purple-400" />
                            <h2 className="font-bold text-slate-100">תשלומים שבוצעו ({payments.filter(p => p.direction !== 'debt').length})</h2>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {payments.filter(p => p.direction !== 'debt').map(pay => (
                                <div key={pay._id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-100">{methodLabel(pay.method)}</p>
                                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                            <span>{new Date(pay.date).toLocaleDateString('he-IL')}</span>
                                            {pay.eventId && <span>אירוע: {pay.eventId.title}</span>}
                                            {pay.note && <span>{pay.note}</span>}
                                        </div>
                                    </div>
                                    <span className="text-emerald-400 font-bold">{getCurrencySymbol(pay.currency)}{pay.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Debts */}
                {payments.filter(p => p.direction === 'debt').length > 0 && (
                    <div className="bg-slate-800 rounded-2xl border border-amber-500/20 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                            <span className="text-amber-400">📝</span>
                            <h2 className="font-bold text-slate-100">חובות ({payments.filter(p => p.direction === 'debt').length})</h2>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {payments.filter(p => p.direction === 'debt').map(pay => (
                                <div key={pay._id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-100">{methodLabel(pay.method)}</p>
                                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                            <span>{new Date(pay.date).toLocaleDateString('he-IL')}</span>
                                            {pay.note && <span>{pay.note}</span>}
                                        </div>
                                    </div>
                                    <span className="text-amber-400 font-bold">{getCurrencySymbol(pay.currency)}{pay.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {events.length === 0 && payments.length === 0 && linkedBandExpenses.length === 0 && (
                    <div className="text-center text-slate-500 py-10">אין נתונים להצגה עדיין.</div>
                )}

                <p className="text-center text-xs text-slate-700 pb-4">הופק באמצעות Kaslot</p>
            </div>
        </div>
    );
}
