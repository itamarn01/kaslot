import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiSearch, FiShare2, FiCreditCard, FiTrash2, FiChevronDown, FiChevronUp, FiPieChart, FiX, FiEdit2 } from 'react-icons/fi';
import { PaymentsSkeleton } from '../components/Skeletons';

export default function Payments() {
    const [suppliers, setSuppliers] = useState([]);
    const [partners, setPartners] = useState([]);
    const [payments, setPayments] = useState([]);
    const [events, setEvents] = useState([]);
    const [budgetSummary, setBudgetSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEntityId, setExpandedEntityId] = useState(null);

    // Payment modal (suppliers/partners)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: '', currency: 'Shekel', method: 'Cash', note: '', type: 'general', date: new Date().toISOString().split('T')[0] });

    // Active sub-tab
    const [activeTab, setActiveTab] = useState('suppliers');

    // Client payments state
    const [clientSummary, setClientSummary] = useState(null);
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [clientEditId, setClientEditId] = useState(null);
    const [clientForm, setClientForm] = useState({ eventId: '', amount: '', method: 'Cash', type: 'regular', date: new Date().toISOString().split('T')[0], note: '' });
    const [clientError, setClientError] = useState('');

    // Share toast
    const [shareToast, setShareToast] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const [suppliersRes, partnersRes, paymentsRes, eventsRes, budgetRes, clientRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/partners'),
                api.get('/payments'),
                api.get('/events'),
                api.get(`/budget/summary?year=${currentYear}`).catch(() => ({ data: null })),
                api.get('/client-payments/summary').catch(() => ({ data: null })),
            ]);
            setSuppliers(suppliersRes.data);
            setPartners(partnersRes.data);
            setPayments(paymentsRes.data);
            setEvents(eventsRes.data);
            setBudgetSummary(budgetRes.data);
            setClientSummary(clientRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    const clientMethodLabel = (m) => ({ Cash: 'מזומן', 'Bank Transfer': 'העברה בנקאית', Check: "צ'ק", Bit: 'ביט', Paybox: 'פייבוקס' }[m] || m);

    const allLinkedSupplierIds = new Set(partners.flatMap(p => p.linkedSupplierIds ? p.linkedSupplierIds.map(s => s._id || s) : []));

    // Build per-supplier balance (only suppliers NOT linked to any partner)
    const supplierBalances = suppliers
        .filter(s => !allLinkedSupplierIds.has(s._id))
        .map(s => {
            const totalExpected = { Shekel: 0, Dollar: 0, Euro: 0 };
            events.forEach(ev => {
                ev.participants?.forEach(p => {
                    if (p.supplierId === s._id || p.supplierId?._id === s._id) {
                        const cur = p.currency || 'Shekel';
                        totalExpected[cur] += p.expectedPay || 0;
                    }
                });
            });
            const totalPaid = { Shekel: 0, Dollar: 0, Euro: 0 };
            const entityPayments = payments.filter(p => p.supplierId?._id === s._id || p.supplierId === s._id);
            entityPayments.forEach(p => { totalPaid[p.currency || 'Shekel'] += p.amount || 0; });
            const balance = {
                Shekel: totalExpected.Shekel - totalPaid.Shekel,
                Dollar: totalExpected.Dollar - totalPaid.Dollar,
                Euro: totalExpected.Euro - totalPaid.Euro,
            };
            return {
                entity: { ...s, displayRole: s.role },
                type: 'supplier', id: s._id,
                totalExpected, totalPaid, balance, entityPayments,
                hasDebt: Object.values(balance).some(v => v > 0),
                hasCredit: Object.values(balance).some(v => v < 0),
                budgetDeduction: 0,
            };
        });

    // Budget deduction map
    const budgetDeductionMap = {};
    if (budgetSummary?.budget && budgetSummary.monthsElapsed > 0) {
        (budgetSummary.partnerDeductions || []).forEach(pd => {
            budgetDeductionMap[pd._id] = pd.monthlyDeduction * budgetSummary.monthsElapsed;
        });
    }

    // Build per-partner balance
    const partnerBalances = partners.map(p => {
        const totalExpected = { Shekel: 0, Dollar: 0, Euro: 0 };
        const linkedIds = p.linkedSupplierIds ? p.linkedSupplierIds.map(s => s._id || s) : [];

        events.forEach(ev => {
            const evCurrency = ev.currency || 'Shekel';
            const eventSupplierCosts = (ev.participants || [])
                .filter(part => !part.isSubstitute && (part.currency || 'Shekel') === evCurrency)
                .reduce((sum, part) => sum + (part.expectedPay || 0), 0);
            const eventProfit = (ev.totalPrice || 0) - eventSupplierCosts;
            const partnerShare = eventProfit * (p.percentage / 100);
            if (partnerShare > 0) totalExpected[evCurrency] += partnerShare;

            ev.participants?.forEach(part => {
                if (!part.isSubstitute && linkedIds.includes(part.supplierId?._id || part.supplierId)) {
                    totalExpected[part.currency || 'Shekel'] += part.expectedPay || 0;
                }
            });
            ev.participants?.forEach(part => {
                if (part.isSubstitute && part.replacesPartnerId && (part.replacesPartnerId === p._id || part.replacesPartnerId._id === p._id)) {
                    totalExpected[part.currency || 'Shekel'] -= part.expectedPay || 0;
                }
            });
        });

        const eventEarnings = { ...totalExpected };
        const budgetDeduction = budgetDeductionMap[p._id] || 0;

        const totalPaid = { Shekel: 0, Dollar: 0, Euro: 0 };
        const entityPayments = payments.filter(pay =>
            pay.partnerId?._id === p._id || pay.partnerId === p._id ||
            linkedIds.includes(pay.supplierId?._id || pay.supplierId)
        );
        entityPayments.forEach(pay => { totalPaid[pay.currency || 'Shekel'] += pay.amount || 0; });

        const balance = {
            Shekel: eventEarnings.Shekel - budgetDeduction - totalPaid.Shekel,
            Dollar: eventEarnings.Dollar - totalPaid.Dollar,
            Euro: eventEarnings.Euro - totalPaid.Euro,
        };

        return {
            entity: { ...p, displayRole: `שותף (${p.percentage}%)` },
            type: 'partner', id: p._id,
            totalExpected: eventEarnings,
            totalPaid, balance, entityPayments,
            hasDebt: Object.values(balance).some(v => v > 0),
            hasCredit: Object.values(balance).some(v => v < 0),
            budgetDeduction,
        };
    });

    const allBalances = [...partnerBalances, ...supplierBalances];
    const filteredBalances = allBalances.filter(({ entity }) =>
        entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.displayRole.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openPaymentModal = (entityData) => {
        setSelectedEntity({ id: entityData.id, name: entityData.entity.name, role: entityData.entity.displayRole, type: entityData.type });
        setPaymentForm({ amount: '', currency: 'Shekel', method: 'Cash', note: '', type: 'general', date: new Date().toISOString().split('T')[0] });
        setIsPaymentModalOpen(true);
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                amount: parseFloat(paymentForm.amount),
                currency: paymentForm.currency,
                method: paymentForm.type === 'loan' ? 'Loan' : paymentForm.method,
                date: paymentForm.date,
                note: paymentForm.note || (paymentForm.type === 'loan' ? 'הלוואה' : ''),
            };
            if (selectedEntity.type === 'partner') payload.partnerId = selectedEntity.id;
            else payload.supplierId = selectedEntity.id;
            await api.post('/payments', payload);
            setIsPaymentModalOpen(false);
            fetchAll();
        } catch (err) { console.error(err); }
    };

    const handleDeletePayment = async (id) => {
        if (window.confirm('למחוק תשלום זה?')) {
            try { await api.delete(`/payments/${id}`); fetchAll(); }
            catch (err) { console.error(err); }
        }
    };

    const handleShare = (entityId, entityName, type) => {
        const route = type === 'partner' ? 'partner-report' : 'supplier-report';
        const url = `${window.location.origin}/${route}/${entityId}`;
        navigator.clipboard.writeText(url).then(() => {
            setShareToast(`כתובת הדוח של ${entityName} הועתקה!`);
            setTimeout(() => setShareToast(''), 3000);
        });
    };

    // Client payment handlers
    const openClientModal = (payment = null, presetEventId = '') => {
        setClientEditId(payment?._id || null);
        setClientForm(payment
            ? { eventId: payment.eventId?._id || payment.eventId, amount: payment.amount, method: payment.method, type: payment.type, date: new Date(payment.date).toISOString().split('T')[0], note: payment.note || '' }
            : { eventId: presetEventId, amount: '', method: 'Cash', type: 'regular', date: new Date().toISOString().split('T')[0], note: '' }
        );
        setClientError('');
        setClientModalOpen(true);
    };

    const handleClientSave = async (e) => {
        e.preventDefault();
        setClientError('');
        try {
            const payload = { ...clientForm, amount: Number(clientForm.amount) };
            if (clientEditId) await api.put(`/client-payments/${clientEditId}`, payload);
            else await api.post('/client-payments', payload);
            setClientModalOpen(false);
            fetchAll();
        } catch (err) { setClientError(err.response?.data?.message || 'שגיאה'); }
    };

    const handleClientDelete = async (id) => {
        if (!window.confirm('למחוק תשלום זה?')) return;
        try { await api.delete(`/client-payments/${id}`); fetchAll(); }
        catch (err) { console.error(err); }
    };

    if (loading) return <PaymentsSkeleton />;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">תשלומים</h2>
            </div>

            {/* Sub-tabs nav */}
            <div className="flex gap-2 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('suppliers')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition -mb-px ${
                        activeTab === 'suppliers' ? 'border-blue-500 text-blue-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    🎵 ספקים / שותפים
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition -mb-px ${
                        activeTab === 'clients' ? 'border-emerald-500 text-emerald-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    👥 תשלומי לקוחות
                    {clientSummary?.totalOutstanding > 0 && (
                        <span className="mr-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                            חוב: ₪{Math.round(clientSummary.totalOutstanding).toLocaleString()}
                        </span>
                    )}
                </button>
            </div>

            {/* ===== SUPPLIERS / PARTNERS TAB ===== */}
            {activeTab === 'suppliers' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <div className="relative w-full md:w-72">
                            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="חיפוש לפי שם..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredBalances.length === 0 && (
                            <p className="text-center text-slate-500 py-16">לא נמצאו שותפים או ספקים.</p>
                        )}
                        {filteredBalances.map(({ entity, type, id, totalExpected, totalPaid, balance, entityPayments, hasDebt, budgetDeduction }) => {
                            const isExpanded = expandedEntityId === id;
                            const currencies = ['Shekel', 'Dollar', 'Euro'].filter(c => totalExpected[c] > 0 || totalPaid[c] > 0);
                            return (
                                <div key={id} className={`bg-slate-800 rounded-2xl border overflow-hidden transition-all ${hasDebt ? 'border-red-500/30' : 'border-slate-700'}`}>
                                    <div
                                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-slate-700/40 transition"
                                        onClick={() => setExpandedEntityId(isExpanded ? null : id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${hasDebt ? 'bg-gradient-to-br from-red-500 to-orange-500' : type === 'partner' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                                                {type === 'partner' ? <FiPieChart size={18} /> : entity.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-100">{entity.name}</p>
                                                <p className="text-xs text-slate-500">{entity.displayRole}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="flex flex-wrap gap-2">
                                                {currencies.length === 0 ? (
                                                    <span className="text-xs text-slate-500">אין פעילות</span>
                                                ) : currencies.map(cur => (
                                                    <span key={cur} className={`text-xs font-bold px-2.5 py-1 rounded-full ${balance[cur] > 0 ? 'bg-red-500/20 text-red-400' : balance[cur] < 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {balance[cur] > 0 ? `חוב: ${getCurrencySymbol(cur)}${Math.round(balance[cur]).toLocaleString()}` : balance[cur] < 0 ? `קרדיט: ${getCurrencySymbol(cur)}${Math.round(Math.abs(balance[cur])).toLocaleString()}` : 'מאוזן'}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => openPaymentModal({ id, entity, type })}
                                                    className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                                                >
                                                    <FiPlus size={14} /> תשלום
                                                </button>
                                                <button
                                                    onClick={() => handleShare(id, entity.name, type)}
                                                    className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition"
                                                    title="שתף דוח"
                                                >
                                                    <FiShare2 size={16} />
                                                </button>
                                            </div>
                                            {isExpanded ? <FiChevronUp className="text-slate-400 flex-shrink-0" /> : <FiChevronDown className="text-slate-400 flex-shrink-0" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-700 bg-slate-900/50">
                                            {currencies.length > 0 && (
                                                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-700/50">
                                                    {currencies.map(cur => (
                                                        <div key={cur} className="text-sm space-y-1 bg-slate-800/60 rounded-xl p-3">
                                                            <p className="text-xs text-slate-500 font-medium mb-2">{cur === 'Shekel' ? '₪ שקל' : cur === 'Dollar' ? '$ דולר' : '€ יורו'}</p>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400">רווח מאירועים</span>
                                                                <span className="text-blue-400 font-semibold">{getCurrencySymbol(cur)}{Math.round(totalExpected[cur]).toLocaleString()}</span>
                                                            </div>
                                                            {type === 'partner' && cur === 'Shekel' && budgetDeduction > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-400 text-xs">הפחתת תקציב</span>
                                                                    <span className="text-orange-400 font-semibold">-₪{Math.round(budgetDeduction).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400">שולם</span>
                                                                <span className="text-emerald-400 font-semibold">{getCurrencySymbol(cur)}{Math.round(totalPaid[cur]).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
                                                                <span className="text-slate-300 font-bold">יתרה לתשלום</span>
                                                                <span className={`font-bold ${balance[cur] > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                                    {getCurrencySymbol(cur)}{Math.round(Math.abs(balance[cur])).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="p-4">
                                                <p className="text-xs text-slate-500 font-medium mb-3">היסטוריית תשלומים</p>
                                                {entityPayments.length === 0 ? (
                                                    <p className="text-slate-600 text-sm">אין תשלומים עדיין.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {entityPayments.map(pay => (
                                                            <div key={pay._id} className="flex justify-between items-center bg-slate-800 px-3 py-2.5 rounded-lg border border-slate-700">
                                                                <div className="flex items-center gap-2">
                                                                    <FiCreditCard size={14} className="text-slate-500" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-slate-200">{methodLabel(pay.method)}</p>
                                                                        <p className="text-xs text-slate-500">
                                                                            {new Date(pay.date).toLocaleDateString('he-IL')}
                                                                            {pay.eventId?.title && ` • ${pay.eventId.title}`}
                                                                            {pay.note && ` • ${pay.note}`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-emerald-400 font-bold">{getCurrencySymbol(pay.currency)}{pay.amount.toLocaleString()}</span>
                                                                    <button onClick={() => handleDeletePayment(pay._id)} className="p-1 text-slate-500 hover:text-red-400 transition">
                                                                        <FiTrash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ===== CLIENT PAYMENTS TAB ===== */}
            {activeTab === 'clients' && (
                <div className="space-y-4">
                    {/* Summary cards */}
                    {clientSummary && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                                <p className="text-xs text-slate-500 mb-1">סה"כ מחירי אירועים</p>
                                <p className="text-2xl font-bold text-blue-400">₪{Math.round(clientSummary.totalExpected).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                                <p className="text-xs text-slate-500 mb-1">שולם</p>
                                <p className="text-2xl font-bold text-emerald-400">₪{Math.round(clientSummary.totalReceived).toLocaleString()}</p>
                            </div>
                            <div className={`rounded-2xl p-4 border ${clientSummary.totalOutstanding > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                <p className="text-xs text-slate-500 mb-1">יתרה לגבייה</p>
                                <p className={`text-2xl font-bold ${clientSummary.totalOutstanding > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    ₪{Math.round(clientSummary.totalOutstanding).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={() => openClientModal()}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow"
                        >
                            <FiPlus size={16} /> הוסף תשלום לקוח
                        </button>
                    </div>

                    {(!clientSummary?.events || clientSummary.events.length === 0) ? (
                        <p className="text-center text-slate-500 py-12">אין אירועים. הוסף אירוע תחילה!</p>
                    ) : (
                        <div className="space-y-3">
                            {clientSummary.events.map(ev => (
                                <div key={ev._id} className={`bg-slate-800 rounded-2xl border overflow-hidden ${ev.balance > 0 ? 'border-red-500/30' : 'border-emerald-500/20'}`}>
                                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                            <p className="font-bold text-slate-100">{ev.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span>{new Date(ev.date).toLocaleDateString('he-IL')}</span>
                                                {ev.eventType && <span className="bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">{ev.eventType}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-0.5">מחיר</p>
                                                <p className="font-bold text-slate-200">₪{ev.totalPrice.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-0.5">שולם</p>
                                                <p className="font-bold text-emerald-400">₪{ev.totalPaid.toLocaleString()}</p>
                                            </div>
                                            <div className={`text-center px-3 py-2 rounded-xl ${ev.balance > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                                                <p className="text-xs text-slate-500 mb-0.5">{ev.balance > 0 ? 'יתרה' : 'שולם'}</p>
                                                <p className={`font-bold text-lg ${ev.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₪{Math.abs(ev.balance).toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => openClientModal(null, ev._id)}
                                                className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg transition border border-emerald-500/20"
                                            >
                                                <FiPlus size={12} /> תשלום
                                            </button>
                                        </div>
                                    </div>

                                    {ev.payments && ev.payments.length > 0 && (
                                        <div className="border-t border-slate-700 divide-y divide-slate-700/60">
                                            {ev.payments.map(pay => (
                                                <div key={pay._id} className="px-4 py-3 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pay.type === 'advance' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'}`}>
                                                            {pay.type === 'advance' ? 'מקדמה' : 'רגיל'}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200">{clientMethodLabel(pay.method)}</p>
                                                            <p className="text-xs text-slate-500">{new Date(pay.date).toLocaleDateString('he-IL')}{pay.note && ` • ${pay.note}`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-emerald-400 font-bold">₪{pay.amount.toLocaleString()}</span>
                                                        <button onClick={() => openClientModal(pay)} className="p-1.5 text-slate-400 hover:text-blue-400 transition"><FiEdit2 size={13} /></button>
                                                        <button onClick={() => handleClientDelete(pay._id)} className="p-1.5 text-slate-400 hover:text-red-400 transition"><FiTrash2 size={13} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== CLIENT PAYMENT MODAL ===== */}
            {clientModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-bold text-slate-100">{clientEditId ? 'עריכת תשלום' : 'תשלום לקוח'}</h3>
                            <button onClick={() => setClientModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"><FiX size={20} /></button>
                        </div>
                        {clientError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">{clientError}</div>}
                        <form onSubmit={handleClientSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">אירוע</label>
                                <select required value={clientForm.eventId} onChange={e => setClientForm({...clientForm, eventId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500">
                                    <option value="">בחר אירוע...</option>
                                    {(clientSummary?.events || []).map(ev => <option key={ev._id} value={ev._id}>{ev.title} — {new Date(ev.date).toLocaleDateString('he-IL')}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">סכום (₪)</label>
                                    <input required type="number" min="0" step="any" value={clientForm.amount} onChange={e => setClientForm({...clientForm, amount: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">תאריך</label>
                                    <input required type="date" value={clientForm.date} onChange={e => setClientForm({...clientForm, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">אמצעי תשלום</label>
                                    <select value={clientForm.method} onChange={e => setClientForm({...clientForm, method: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500">
                                        <option value="Cash">מזומן</option>
                                        <option value="Bank Transfer">העברה בנקאית</option>
                                        <option value="Check">צ'ק</option>
                                        <option value="Bit">ביט</option>
                                        <option value="Paybox">פייבוקס</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">סוג תשלום</label>
                                    <select value={clientForm.type} onChange={e => setClientForm({...clientForm, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500">
                                        <option value="regular">רגיל</option>
                                        <option value="advance">מקדמה</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">הערה (לא חובה)</label>
                                <input type="text" value={clientForm.note} onChange={e => setClientForm({...clientForm, note: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" placeholder="מקדמה ראשונה, תשלום סופי..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setClientModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition">שמור</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== SUPPLIER PAYMENT MODAL ===== */}
            {isPaymentModalOpen && selectedEntity && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${selectedEntity.type === 'partner' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-emerald-600'}`}>
                                {selectedEntity.type === 'partner' ? <FiPieChart size={18} /> : selectedEntity.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">רישום תשלום</h3>
                                <p className="text-sm text-slate-400">{selectedEntity.name} • {selectedEntity.role}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setPaymentForm({ ...paymentForm, type: 'general' })} className={`py-2.5 rounded-lg text-sm font-medium transition ${paymentForm.type === 'general' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                                    תשלום רגיל
                                </button>
                                <button type="button" onClick={() => setPaymentForm({ ...paymentForm, type: 'loan' })} className={`py-2.5 rounded-lg text-sm font-medium transition ${paymentForm.type === 'loan' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                                    הלוואה
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">סכום</label>
                                    <input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">מטבע</label>
                                    <select value={paymentForm.currency} onChange={e => setPaymentForm({ ...paymentForm, currency: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100">
                                        <option value="Shekel">שקל (₪)</option>
                                        <option value="Dollar">דולר ($)</option>
                                        <option value="Euro">יורו (€)</option>
                                    </select>
                                </div>
                            </div>

                            {paymentForm.type === 'general' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">אמצעי תשלום</label>
                                        <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100">
                                            <option value="Cash">מזומן</option>
                                            <option value="Bit">ביט</option>
                                            <option value="Paybox">פייבוקס</option>
                                            <option value="Bank Transfer">העברה בנקאית</option>
                                            <option value="Check">צ'ק</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">תאריך</label>
                                        <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                            )}

                            {paymentForm.type === 'loan' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">תאריך</label>
                                    <input required type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">הערה (לא חובה)</label>
                                <input type="text" value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="תשלום חודשי, עבור הופעה..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">ביטול</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition shadow-lg">אשר תשלום</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Toast */}
            {shareToast && (
                <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-600 text-sm font-medium z-50">
                    ✓ {shareToast}
                </div>
            )}
        </div>
    );
}
