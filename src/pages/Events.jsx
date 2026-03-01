import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiCalendar, FiMapPin, FiPhone, FiChevronDown, FiChevronUp, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#0f172a',
        borderColor: state.isFocused ? '#3b82f6' : '#334155',
        color: '#f1f5f9',
        borderRadius: '0.5rem',
        padding: '0.15rem 0',
        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
        '&:hover': {
            borderColor: '#3b82f6'
        }
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        marginTop: '0.25rem',
        zIndex: 50,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#334155' : 'transparent',
        color: state.isFocused ? '#f1f5f9' : '#cbd5e1',
        cursor: 'pointer',
        '&:active': {
            backgroundColor: '#475569'
        }
    }),
    singleValue: (base) => ({
        ...base,
        color: '#f1f5f9',
    }),
    input: (base) => ({
        ...base,
        color: '#f1f5f9',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#94a3b8',
    }),
    noOptionsMessage: (base) => ({
        ...base,
        color: '#94a3b8',
    })
};

export default function Events() {
    const [events, setEvents] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isEditEventMode, setIsEditEventMode] = useState(false);
    const [isEditSupplierMode, setIsEditSupplierMode] = useState(false);

    const [eventForm, setEventForm] = useState({ title: '', date: '', location: '', phone_number: '', totalPrice: '', currency: 'Shekel' });
    const [currentEventId, setCurrentEventId] = useState(null);

    const [supplierForm, setSupplierForm] = useState({ supplierId: '', expectedPay: '', currency: 'Shekel' });
    const [currentParticipantId, setCurrentParticipantId] = useState(null);

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
        if (window.confirm('האם אתה בטוח שברצונך להסיר ספק זה מהאירוע?')) {
            try {
                await api.delete(`/events/${eventId}/participants/${supplierId}`);
                fetchData();
            } catch (err) { console.error(err); }
        }
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

    const currentEvent = events.find(ev => ev._id === currentEventId);
    const currentParticipantIds = currentEvent?.participants?.map(p => p.supplierId?._id) || [];

    const supplierOptions = suppliers
        .filter(s => !currentParticipantIds.includes(s._id))
        .map(s => ({
            value: s._id,
            label: `${s.name} (${s.role})`,
            supplier: s
        }));

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

    const groupEventsByMonth = (eventsList) => {
        const sortedEvents = [...eventsList].sort((a, b) => new Date(b.date) - new Date(a.date));

        const grouped = {};
        sortedEvents.forEach(ev => {
            const date = new Date(ev.date);
            const monthYear = date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
            if (!grouped[monthYear]) {
                grouped[monthYear] = {
                    monthYear,
                    dateObj: new Date(date.getFullYear(), date.getMonth(), 1),
                    events: []
                };
            }
            grouped[monthYear].events.push(ev);
        });

        return Object.values(grouped).sort((a, b) => b.dateObj - a.dateObj);
    };

    const groupedEvents = groupEventsByMonth(filteredEvents);

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
                {filteredEvents.length === 0 && (
                    <p className="text-center text-slate-500 py-12">אין אירועים להצגה. הוסף אירוע ראשון!</p>
                )}

                {groupedEvents.map((group, groupIdx) => (
                    <div key={groupIdx} className="mb-8">
                        <h3 className="text-xl font-bold text-slate-100 mb-4 px-2 border-b border-slate-700 pb-2">
                            {group.monthYear} <span className="text-slate-400 text-sm font-normal">({group.events.length})</span>
                        </h3>
                        <div className="space-y-4">
                            {group.events.map(ev => {
                                const isExpanded = expandedEventId === ev._id;
                                const totalExpectedSuppliersPay = ev.participants ? ev.participants.reduce((sum, p) => sum + (p.expectedPay || 0), 0) : 0;
                                const eventProfit = ev.totalPrice - totalExpectedSuppliersPay;

                                return (
                                    <div key={ev._id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div
                                            className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-700/50 transition gap-4"
                                            onClick={() => toggleEventExpand(ev._id)}
                                        >
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-100">{ev.title}</h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1"><FiCalendar /> {new Date(ev.date).toLocaleDateString('he-IL')}</span>
                                                    {ev.location && <span className="flex items-center gap-1"><FiMapPin /> {ev.location}</span>}
                                                    {ev.phone_number && <span className="flex items-center gap-1"><FiPhone /> {ev.phone_number}</span>}
                                                    <span className="flex items-center gap-1" title="מחיר ללקוח"><span className="text-slate-300">הכנסה:</span> <span className="text-emerald-400 font-medium">{getCurrencySymbol(ev.currency)}{ev.totalPrice}</span></span>
                                                    <span className="flex items-center gap-1 bg-slate-700/50 px-2 py-0.5 rounded-lg border border-slate-600/50" title="רווח קופה (הכנסה פחות הוצאות ספקים)">
                                                        <span className="text-slate-300">רווח קופה:</span>
                                                        <strong className={`${eventProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{getCurrencySymbol(ev.currency)}{eventProfit}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
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

                                        {isExpanded && (
                                            <div className="p-5 border-t border-slate-700 bg-slate-900/50">
                                                <h4 className="font-bold text-slate-300 mb-4">הרכב / ספקים באירוע:</h4>
                                                {(!ev.participants || ev.participants.length === 0) ? (
                                                    <p className="text-slate-500 text-sm">טרם צורפו נגנים או ספקים לאירוע זה.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {ev.participants.map(p => {
                                                            const supplierPayments = (ev.payments || []).filter(pay => pay.supplierId?._id === p.supplierId?._id);
                                                            const totalPaid = supplierPayments.reduce((acc, curr) => acc + curr.amount, 0);
                                                            const balance = p.expectedPay - totalPaid;
                                                            return (
                                                                <div key={p._id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                                                    <div>
                                                                        <p className="font-bold text-slate-100">{p.supplierId?.name} <span className="text-slate-400 font-normal text-sm">({p.supplierId?.role})</span></p>
                                                                        <div className="flex gap-4 text-sm mt-1">
                                                                            <span>סיכום: <strong className="text-blue-400">{getCurrencySymbol(p.currency)}{p.expectedPay}</strong></span>
                                                                            <span>שולם: <strong className="text-emerald-400">{getCurrencySymbol(p.currency)}{totalPaid}</strong></span>
                                                                            <span>יתרה: <strong className={balance > 0 ? 'text-red-400' : 'text-slate-400'}>{getCurrencySymbol(p.currency)}{balance}</strong></span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
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
                    </div>
                ))}
            </div>

            {/* CREATE / EDIT EVENT MODAL */}
            {isEventModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">{isEditEventMode ? 'ערוך אירוע' : 'אירוע חדש'}</h3>
                        <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">שם האירוע</label>
                                <input required type="text" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">תאריך</label>
                                <input required type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">מיקום</label>
                                <input type="text" value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">טלפון של בעל אירוע</label>
                                <input type="text" value={eventForm.phone_number} onChange={e => setEventForm({ ...eventForm, phone_number: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">מחיר סגירה (ללהקה)</label>
                                    <input required type="number" min="0" value={eventForm.totalPrice} onChange={e => setEventForm({ ...eventForm, totalPrice: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
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

            {/* ADD / EDIT SUPPLIER MODAL */}
            {isSupplierModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">{isEditSupplierMode ? 'ערוך שכר מסוכם' : 'הוסף נגן/ספק לאירוע'}</h3>
                        <form onSubmit={handleAddOrUpdateSupplierToEvent} className="space-y-4">
                            {!isEditSupplierMode && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">בחר ספק</label>
                                    <Select
                                        options={supplierOptions}
                                        placeholder="חיפוש נגן לפי שם או תפקיד..."
                                        styles={customSelectStyles}
                                        value={supplierOptions.find(opt => opt.value === supplierForm.supplierId) || null}
                                        onChange={(selectedOption) => {
                                            if (selectedOption) {
                                                const s = selectedOption.supplier;
                                                setSupplierForm(prev => ({
                                                    ...prev,
                                                    supplierId: s._id,
                                                    expectedPay: s.default_price ? s.default_price : prev.expectedPay,
                                                    currency: s.default_price ? (s.currency || 'Shekel') : prev.currency
                                                }));
                                            } else {
                                                setSupplierForm(prev => ({ ...prev, supplierId: '' }));
                                            }
                                        }}
                                        noOptionsMessage={() => "לא נמצאו תוצאות נוספות. (האם הנגן כבר מקושר לאירוע?)"}
                                        isClearable
                                        required
                                    />

                                    {currentEvent?.participants?.length > 0 && (
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                            <p className="text-xs font-semibold text-slate-400 mb-2">כבר משתתפים באירוע:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {currentEvent.participants.map(p => (
                                                    <span key={p._id} className="text-xs bg-slate-800 text-slate-300 px-2 py-1.5 rounded-md border border-slate-600">
                                                        {p.supplierId?.name} ({p.supplierId?.role})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">שכר מסוכם</label>
                                    <input required type="number" min="0" value={supplierForm.expectedPay} onChange={e => setSupplierForm({ ...supplierForm, expectedPay: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" />
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
        </div>
    );
}
