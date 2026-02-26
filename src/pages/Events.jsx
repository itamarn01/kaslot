import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiCalendar, FiMapPin, FiPhone, FiDollarSign, FiChevronDown, FiChevronUp, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal specific states
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditEventMode, setIsEditEventMode] = useState(false);
    const [isEditSupplierMode, setIsEditSupplierMode] = useState(false);
    const [supplierModalSearchTerm, setSupplierModalSearchTerm] = useState('');

    // Form states
    const [eventForm, setEventForm] = useState({ title: '', date: '', location: '', phone_number: '', totalPrice: '', currency: 'Shekel' });
    const [currentEventId, setCurrentEventId] = useState(null);

    const [supplierForm, setSupplierForm] = useState({ supplierId: '', expectedPay: '', currency: 'Shekel' });
    const [currentParticipantId, setCurrentParticipantId] = useState(null); // supplierId in event context

    const [paymentForm, setPaymentForm] = useState({ supplierId: '', amount: '', currency: 'Shekel', method: 'Cash' });

    const getCurrencySymbol = (currency) => {
        switch (currency) {
            case 'Dollar': return '$';
            case 'Euro': return '€';
            case 'Shekel':
            default: return '₪';
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [eventsRes, suppliersRes] = await Promise.all([
                api.get('/events'),
                api.get('/suppliers')
            ]);
            // For each event, we should ideally fetch its payments, or backend could aggregate
            // Since backend doesn't aggregate payments per event yet in GET /events, let's fetch payments
            const paymentsRes = await api.get('/payments');
            const payments = paymentsRes.data;

            const eventsWithPayments = eventsRes.data.map(ev => {
                const evPayments = payments.filter(p => p.eventId?._id === ev._id || p.eventId === ev._id);
                return { ...ev, payments: evPayments };
            });

            setEvents(eventsWithPayments);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Event Handlers
    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            if (isEditEventMode) {
                await api.put(`/events/${currentEventId}`, eventForm);
            } else {
                await api.post('/events', eventForm);
            }
            setIsEventModalOpen(false);
            setEventForm({ title: '', date: '', location: '', phone_number: '', totalPrice: '', currency: 'Shekel' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק אירוע זה? כל הנתונים והתשלומים המקושרים יימחקו.')) {
            try {
                await api.delete(`/events/${id}`);
                fetchData();
            } catch (err) { console.error(err); }
        }
    };

    const handleAddOrUpdateSupplierToEvent = async (e) => {
        e.preventDefault();
        try {
            if (isEditSupplierMode) {
                await api.put(`/events/${currentEventId}/participants/${currentParticipantId}`, { expectedPay: supplierForm.expectedPay, currency: supplierForm.currency });
            } else {
                await api.post(`/events/${currentEventId}/participants`, supplierForm);
            }
            setIsSupplierModalOpen(false);
            setSupplierForm({ supplierId: '', expectedPay: '', currency: 'Shekel' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error adding/updating supplier'); }
    };

    const handleRemoveSupplierFromEvent = async (eventId, supplierId) => {
        if (window.confirm('האם אתה בטוח שברצונך להסיר ספק זה מהאירוע? התשלומים המקושרים יימחקו.')) {
            try {
                await api.delete(`/events/${eventId}/participants/${supplierId}`);
                fetchData();
            } catch (err) { console.error(err); }
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/payments', { ...paymentForm, eventId: currentEventId });
            setIsPaymentModalOpen(false);
            setPaymentForm({ supplierId: '', amount: '', currency: 'Shekel', method: 'Cash' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const openEventModal = (ev = null) => {
        if (ev) {
            setIsEditEventMode(true);
            setCurrentEventId(ev._id);
            setEventForm({
                title: ev.title,
                date: ev.date.split('T')[0],
                location: ev.location || '',
                phone_number: ev.phone_number || '',
                totalPrice: ev.totalPrice,
                currency: ev.currency || 'Shekel'
            });
        } else {
            setIsEditEventMode(false);
            setCurrentEventId(null);
            setEventForm({ title: '', date: '', location: '', phone_number: '', totalPrice: '', currency: 'Shekel' });
        }
        setIsEventModalOpen(true);
    };

    const openSupplierModal = (eventId, participant = null) => {
        setCurrentEventId(eventId);
        setSupplierModalSearchTerm('');
        if (participant) {
            setIsEditSupplierMode(true);
            setCurrentParticipantId(participant.supplierId._id);
            setSupplierForm({ supplierId: participant.supplierId._id, expectedPay: participant.expectedPay, currency: participant.currency || 'Shekel' });
        } else {
            setIsEditSupplierMode(false);
            setCurrentParticipantId(null);
            setSupplierForm({ supplierId: '', expectedPay: '', currency: 'Shekel' });
        }
        setIsSupplierModalOpen(true);
    };

    const openPaymentModal = (eventId, supplierId) => {
        setCurrentEventId(eventId);
        setPaymentForm({ ...paymentForm, supplierId });
        setIsPaymentModalOpen(true);
    };

    const toggleEventExpand = (id) => {
        setExpandedEventId(expandedEventId === id ? null : id);
    };

    if (loading) return <div className="text-center">טוען...</div>;

    const filteredEvents = events.filter(ev => {
        const search = searchTerm.toLowerCase();
        return (
            ev.title.toLowerCase().includes(search) ||
            (ev.location && ev.location.toLowerCase().includes(search)) ||
            new Date(ev.date).toLocaleDateString('he-IL').includes(search)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">אירועים</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="חיפוש אירוע..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                    <button
                        onClick={() => openEventModal()}
                        className="flex shrink-0 items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition shadow-lg font-medium"
                    >
                        <FiPlus /> הוסף אירוע
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredEvents.map(ev => {
                    const isExpanded = expandedEventId === ev._id;
                    return (
                        <div key={ev._id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                            {/* Event Header */}
                            <div
                                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-700/50 transition gap-4"
                                onClick={() => toggleEventExpand(ev._id)}
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100">{ev.title}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><FiCalendar /> {new Date(ev.date).toLocaleDateString('he-IL')}</span>
                                        {ev.location && <span className="flex items-center gap-1"><FiMapPin /> {ev.location}</span>}
                                        {ev.phone_number && <span className="flex items-center gap-1"><FiPhone /> {ev.phone_number}</span>}
                                        <span className="flex items-center gap-1 text-emerald-400 font-medium">{getCurrencySymbol(ev.currency)}{ev.totalPrice}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEventModal(ev); }}
                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded-lg transition"
                                        title="ערוך אירוע"
                                    >
                                        <FiEdit2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev._id); }}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition"
                                        title="מחק אירוע"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openSupplierModal(ev._id); }}
                                        className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition"
                                    >
                                        + הוסף נגן/ספק
                                    </button>
                                    {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            {/* Event Details (Expanded) */}
                            {isExpanded && (
                                <div className="p-5 border-t border-slate-700 bg-slate-900/50">
                                    <h4 className="font-bold text-slate-300 mb-4">הרכב / ספקים באירוע:</h4>
                                    {(!ev.participants || ev.participants.length === 0) ? (
                                        <p className="text-slate-500 text-sm">טרם צורפו נגנים או ספקים לאירוע זה.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {ev.participants.map(p => {
                                                const supplierPayments = ev.payments.filter(pay => pay.supplierId?._id === p.supplierId?._id);
                                                const totalPaid = supplierPayments.reduce((acc, curr) => acc + curr.amount, 0);
                                                const balance = p.expectedPay - totalPaid;

                                                return (
                                                    <div key={p._id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div>
                                                            <p className="font-bold text-slate-100">{p.supplierId?.name} <span className="text-slate-400 font-normal text-sm">({p.supplierId?.role})</span></p>
                                                            <div className="flex gap-4 text-sm mt-1">
                                                                <span>סיכום: <strong className="text-blue-400">{getCurrencySymbol(p.currency)}{p.expectedPay}</strong></span>
                                                                <span>שולם: <strong className="text-emerald-400">{getCurrencySymbol(p.currency)}{totalPaid}</strong></span>
                                                                <span>יתרה: <strong className={balance > 0 ? 'text-red-400' : 'text-slate-400'}>{getCurrencySymbol(p.currency)}{balance}</strong></span>
                                                            </div>
                                                        </div>

                                                        <div className="w-full md:w-auto flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                            <button
                                                                onClick={() => openPaymentModal(ev._id, p.supplierId?._id)}
                                                                className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg transition"
                                                            >
                                                                הוסף תשלום
                                                            </button>
                                                            <div className="flex items-center gap-1 mt-2 sm:mt-0">
                                                                <button
                                                                    onClick={() => openSupplierModal(ev._id, p)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition"
                                                                    title="ערוך ספק"
                                                                >
                                                                    <FiEdit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveSupplierFromEvent(ev._id, p.supplierId?._id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                                                                    title="הסר ספק"
                                                                >
                                                                    <FiTrash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CREATE EVENT MODAL */}
            {isEventModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">אירוע חדש</h3>
                        <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">שם האירוע</label>
                                <input required type="text" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">תאריך</label>
                                <input required type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">מיקום</label>
                                <input type="text" value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">טלפון של בעל אירוע</label>
                                <input type="text" value={eventForm.phone_number} onChange={e => setEventForm({ ...eventForm, phone_number: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">מחיר סגירה (ללהקה)</label>
                                    <input required type="number" min="0" value={eventForm.totalPrice} onChange={e => setEventForm({ ...eventForm, totalPrice: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">מטבע</label>
                                    <select value={eventForm.currency} onChange={e => setEventForm({ ...eventForm, currency: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100">
                                        <option value="Shekel">שקל (₪)</option>
                                        <option value="Dollar">דולר ($)</option>
                                        <option value="Euro">יורו (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-slate-400">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium">שמור</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD SUPPLIER TO EVENT MODAL */}
            {isSupplierModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">{isEditSupplierMode ? 'ערוך שכר מסוכם' : 'הוסף נגן/ספק לאירוע'}</h3>
                        <form onSubmit={handleAddOrUpdateSupplierToEvent} className="space-y-4">
                            {!isEditSupplierMode && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">בחר ספק</label>

                                    <div className="relative mb-2">
                                        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="חיפוש נגן לפי שם או תפקיד..."
                                            value={supplierModalSearchTerm}
                                            onChange={(e) => setSupplierModalSearchTerm(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <select required value={supplierForm.supplierId} onChange={e => setSupplierForm({ ...supplierForm, supplierId: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500">
                                        <option value="">-- בחר ספק --</option>
                                        {suppliers.filter(s => {
                                            const term = supplierModalSearchTerm.toLowerCase();
                                            return s.name.toLowerCase().includes(term) || s.role.toLowerCase().includes(term);
                                        }).map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">שכר מסוכם</label>
                                    <input required type="number" min="0" value={supplierForm.expectedPay} onChange={e => setSupplierForm({ ...supplierForm, expectedPay: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">מטבע</label>
                                    <select value={supplierForm.currency} onChange={e => setSupplierForm({ ...supplierForm, currency: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100">
                                        <option value="Shekel">שקל (₪)</option>
                                        <option value="Dollar">דולר ($)</option>
                                        <option value="Euro">יורו (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 text-slate-400">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium">הוסף</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">רישום תשלום</h3>
                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">סכום</label>
                                <input required type="number" min="1" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-emerald-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">מטבע</label>
                                    <select value={paymentForm.currency} onChange={e => setPaymentForm({ ...paymentForm, currency: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100">
                                        <option value="Shekel">שקל (₪)</option>
                                        <option value="Dollar">דולר ($)</option>
                                        <option value="Euro">יורו (€)</option>
                                    </select>
                                </div>
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
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-400">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium">אשר תשלום</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
