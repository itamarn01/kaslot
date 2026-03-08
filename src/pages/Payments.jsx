import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiSearch, FiShare2, FiCreditCard, FiTrendingDown, FiUser, FiTrash2, FiChevronDown, FiChevronUp, FiPieChart } from 'react-icons/fi';
import { PaymentsSkeleton } from '../components/Skeletons';

export default function Payments() {
    const [suppliers, setSuppliers] = useState([]);
    const [partners, setPartners] = useState([]);
    const [payments, setPayments] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEntityId, setExpandedEntityId] = useState(null);

    // Payment modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(null); // { id, name, role/percentage, type: 'supplier' | 'partner' }
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        currency: 'Shekel',
        method: 'Cash',
        note: '',
        type: 'general', // 'general' | 'loan'
    });

    // Share toast
    const [shareToast, setShareToast] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [suppliersRes, partnersRes, paymentsRes, eventsRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/partners'),
                api.get('/payments'),
                api.get('/events'),
            ]);
            setSuppliers(suppliersRes.data);
            setPartners(partnersRes.data);
            setPayments(paymentsRes.data);
            setEvents(eventsRes.data);
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

    const allLinkedSupplierIds = new Set(partners.flatMap(p => p.linkedSupplierIds ? p.linkedSupplierIds.map(s => s._id || s) : []));

    // Build per-supplier balance from events (expected) and payments (paid)
    // Only include suppliers that are NOT linked to any partner
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
            const entityPayments = payments.filter(p =>
                p.supplierId?._id === s._id || p.supplierId === s._id
            );
            entityPayments.forEach(p => {
                const cur = p.currency || 'Shekel';
                totalPaid[cur] += p.amount || 0;
            });

            const balance = {
                Shekel: totalExpected.Shekel - totalPaid.Shekel,
                Dollar: totalExpected.Dollar - totalPaid.Dollar,
                Euro: totalExpected.Euro - totalPaid.Euro,
            };

            const hasDebt = Object.values(balance).some(v => v > 0);
            const hasCredit = Object.values(balance).some(v => v < 0);

            return {
                entity: { ...s, displayRole: s.role },
                type: 'supplier',
                id: s._id,
                totalExpected,
                totalPaid,
                balance,
                entityPayments,
                hasDebt,
                hasCredit
            };
        });

    // Build per-partner balance
    const partnerBalances = partners.map(p => {
        const totalExpected = { Shekel: 0, Dollar: 0, Euro: 0 };
        const linkedIds = p.linkedSupplierIds ? p.linkedSupplierIds.map(s => s._id || s) : [];

        events.forEach(ev => {
            const evCurrency = ev.currency || 'Shekel';
            const eventSupplierCosts = (ev.participants || [])
                .filter(part => (part.currency || 'Shekel') === evCurrency)
                .reduce((sum, part) => sum + (part.expectedPay || 0), 0);
            const eventProfit = (ev.totalPrice || 0) - eventSupplierCosts;
            const partnerShare = eventProfit * (p.percentage / 100);

            if (partnerShare > 0) {
                totalExpected[evCurrency] += partnerShare;
            }

            ev.participants?.forEach(part => {
                if (linkedIds.includes(part.supplierId?._id || part.supplierId)) {
                    const cur = part.currency || 'Shekel';
                    totalExpected[cur] += part.expectedPay || 0;
                }
            });
        });

        const totalPaid = { Shekel: 0, Dollar: 0, Euro: 0 };
        const entityPayments = payments.filter(pay =>
            pay.partnerId?._id === p._id || pay.partnerId === p._id ||
            linkedIds.includes(pay.supplierId?._id || pay.supplierId)
        );
        entityPayments.forEach(pay => {
            const cur = pay.currency || 'Shekel';
            totalPaid[cur] += pay.amount || 0;
        });

        const balance = {
            Shekel: totalExpected.Shekel - totalPaid.Shekel,
            Dollar: totalExpected.Dollar - totalPaid.Dollar,
            Euro: totalExpected.Euro - totalPaid.Euro,
        };

        const hasDebt = Object.values(balance).some(v => v > 0);
        const hasCredit = Object.values(balance).some(v => v < 0);

        return {
            entity: { ...p, displayRole: `שותף (${p.percentage}%)` },
            type: 'partner',
            id: p._id,
            totalExpected,
            totalPaid,
            balance,
            entityPayments,
            hasDebt,
            hasCredit
        };
    });

    const allBalances = [...partnerBalances, ...supplierBalances];

    const filteredBalances = allBalances.filter(({ entity }) =>
        entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.displayRole.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openPaymentModal = (entityData) => {
        setSelectedEntity({
            id: entityData.id,
            name: entityData.entity.name,
            role: entityData.entity.displayRole,
            type: entityData.type
        });
        setPaymentForm({ amount: '', currency: 'Shekel', method: 'Cash', note: '', type: 'general' });
        setIsPaymentModalOpen(true);
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                amount: parseFloat(paymentForm.amount),
                currency: paymentForm.currency,
                method: paymentForm.type === 'loan' ? 'Loan' : paymentForm.method,
                note: paymentForm.note || (paymentForm.type === 'loan' ? 'הלוואה' : ''),
            };

            if (selectedEntity.type === 'partner') {
                payload.partnerId = selectedEntity.id;
            } else {
                payload.supplierId = selectedEntity.id;
            }

            await api.post('/payments', payload);
            setIsPaymentModalOpen(false);
            fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePayment = async (id) => {
        if (window.confirm('למחוק תשלום זה?')) {
            try {
                await api.delete(`/payments/${id}`);
                fetchAll();
            } catch (err) { console.error(err); }
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

    if (loading) return <PaymentsSkeleton />;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">תשלומים</h2>
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

            {/* Balance Cards */}
            <div className="space-y-3">
                {filteredBalances.length === 0 && (
                    <p className="text-center text-slate-500 py-16">לא נמצאו שותפים או ספקים.</p>
                )}
                {filteredBalances.map(({ entity, type, id, totalExpected, totalPaid, balance, entityPayments, hasDebt }) => {
                    const isExpanded = expandedEntityId === id;
                    const currencies = ['Shekel', 'Dollar', 'Euro'].filter(c => totalExpected[c] > 0 || totalPaid[c] > 0);

                    return (
                        <div key={id} className={`bg-slate-800 rounded-2xl border overflow-hidden transition-all ${hasDebt ? 'border-red-500/30' : 'border-slate-700'}`}>
                            {/* Header Row */}
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
                                    {/* Balance badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {currencies.length === 0 ? (
                                            <span className="text-xs text-slate-500">אין פעילות</span>
                                        ) : currencies.map(cur => (
                                            <span key={cur} className={`text-xs font-bold px-2.5 py-1 rounded-full ${balance[cur] > 0 ? 'bg-red-500/20 text-red-400' : balance[cur] < 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {balance[cur] > 0 ? `חוב: ${getCurrencySymbol(cur)}${Math.round(balance[cur]).toLocaleString()}` : balance[cur] < 0 ? `קרדיט: ${getCurrencySymbol(cur)}${Math.round(Math.abs(balance[cur])).toLocaleString()}` : `מאוזן`}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Actions */}
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

                            {/* Expanded Detail */}
                            {isExpanded && (
                                <div className="border-t border-slate-700 bg-slate-900/50">
                                    {/* Summary row */}
                                    {currencies.length > 0 && (
                                        <div className="p-4 grid grid-cols-3 gap-3 border-b border-slate-700/50">
                                            {currencies.map(cur => (
                                                <div key={cur} className="text-sm space-y-1">
                                                    <p className="text-xs text-slate-600 font-medium">{cur === 'Shekel' ? '₪ שקל' : cur === 'Dollar' ? '$ דולר' : '€ יורו'}</p>
                                                    <div className="flex justify-between"><span className="text-slate-400">לתשלום</span><span className="text-blue-400 font-semibold">{getCurrencySymbol(cur)}{Math.round(totalExpected[cur]).toLocaleString()}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-400">שולם</span><span className="text-emerald-400 font-semibold">{getCurrencySymbol(cur)}{Math.round(totalPaid[cur]).toLocaleString()}</span></div>
                                                    <div className="flex justify-between border-t border-slate-700 pt-1"><span className="text-slate-400">יתרה</span><span className={`font-bold ${balance[cur] > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{getCurrencySymbol(cur)}{Math.round(Math.abs(balance[cur])).toLocaleString()}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Payment history */}
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
                                                            <button
                                                                onClick={() => handleDeletePayment(pay._id)}
                                                                className="p-1 text-slate-500 hover:text-red-400 transition"
                                                            >
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

            {/* Add Payment Modal */}
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
                            {/* Type */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentForm({ ...paymentForm, type: 'general' })}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition ${paymentForm.type === 'general' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                >
                                    תשלום רגיל
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentForm({ ...paymentForm, type: 'loan' })}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition ${paymentForm.type === 'loan' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                >
                                    הלוואה
                                </button>
                            </div>

                            {paymentForm.type === 'loan' && (
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-2.5 text-sm text-orange-300">
                                    הלוואה - תשלום מראש. יחושב כחלק מהחוב.
                                </div>
                            )}

                            {/* Amount + Currency */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">סכום</label>
                                    <input
                                        required
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                                        placeholder="0"
                                    />
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

                            {/* Method (only for general) */}
                            {paymentForm.type === 'general' && (
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
                            )}

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">הערה (לא חובה)</label>
                                <input
                                    type="text"
                                    value={paymentForm.note}
                                    onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                    placeholder="תשלום חודשי, עבור הופעה..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                                />
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
                <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-600 text-sm font-medium animate-pulse z-50">
                    ✓ {shareToast}
                </div>
            )}
        </div>
    );
}
