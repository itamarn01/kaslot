import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { FiPlus, FiCalendar, FiMapPin, FiPhone, FiChevronDown, FiChevronUp, FiEdit2, FiTrash2, FiSearch, FiDownload, FiUpload, FiSend } from 'react-icons/fi';
import Select from 'react-select';
import { EventsSkeleton } from '../components/Skeletons';

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
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isEditEventMode, setIsEditEventMode] = useState(false);
    const [isEditSupplierMode, setIsEditSupplierMode] = useState(false);

    const [eventForm, setEventForm] = useState({ title: '', date: '', location: '', phone_number: '', totalPrice: '', currency: 'Shekel' });
    const [currentEventId, setCurrentEventId] = useState(null);

    const [supplierForm, setSupplierForm] = useState({ supplierId: '', expectedPay: '', currency: 'Shekel', isSubstitute: false, replacesPartnerId: '' });
    const [currentParticipantId, setCurrentParticipantId] = useState(null);

    // Calendar invite state
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [calendarEventId, setCalendarEventId] = useState(null);
    const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
    const [calendarSending, setCalendarSending] = useState(false);
    const [calendarResult, setCalendarResult] = useState(null);

    // Import/Export state
    const [showDataMenu, setShowDataMenu] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Sheets import modal
    const [isSheetsImportOpen, setIsSheetsImportOpen] = useState(false);
    const [sheetsUrl, setSheetsUrl] = useState('');
    const [sheetsImportType, setSheetsImportType] = useState('events');

    const fileInputRef = useRef(null);
    const dataMenuRef = useRef(null);

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

    // Close data menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dataMenuRef.current && !dataMenuRef.current.contains(e.target)) {
                setShowDataMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            const [eventsRes, suppliersRes, partnersRes] = await Promise.all([
                api.get('/events'),
                api.get('/suppliers'),
                api.get('/partners')
            ]);
            const paymentsRes = await api.get('/payments');
            const payments = paymentsRes.data;

            const eventsWithPayments = eventsRes.data.map(ev => {
                const evPayments = payments.filter(p => p.eventId?._id === ev._id || p.eventId === ev._id);
                return { ...ev, payments: evPayments };
            });

            setEvents(eventsWithPayments);
            setSuppliers(suppliersRes.data);
            setPartners(partnersRes.data);
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
            const payload = {
                expectedPay: supplierForm.expectedPay,
                currency: supplierForm.currency,
                isSubstitute: supplierForm.isSubstitute,
                replacesPartnerId: supplierForm.isSubstitute ? supplierForm.replacesPartnerId : null
            };
            if (isEditSupplierMode) {
                await api.put(`/events/${currentEventId}/participants/${currentParticipantId}`, payload);
            } else {
                await api.post(`/events/${currentEventId}/participants`, { ...payload, supplierId: supplierForm.supplierId });
            }
            setIsSupplierModalOpen(false);
            setSupplierForm({ supplierId: '', expectedPay: '', currency: 'Shekel', isSubstitute: false, replacesPartnerId: '' });
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
            setSupplierForm({
                supplierId: participant.supplierId._id,
                expectedPay: participant.expectedPay,
                currency: participant.currency || 'Shekel',
                isSubstitute: participant.isSubstitute || false,
                replacesPartnerId: participant.replacesPartnerId || ''
            });
        } else {
            setIsEditSupplierMode(false);
            setCurrentParticipantId(null);
            setSupplierForm({ supplierId: '', expectedPay: '', currency: 'Shekel', isSubstitute: false, replacesPartnerId: '' });
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

    // ========== Calendar Invite Handlers ==========
    const openCalendarModal = (eventId) => {
        const ev = events.find(e => e._id === eventId);
        if (!ev || !ev.participants || ev.participants.length === 0) {
            alert('אין ספקים באירוע זה. הוסף ספקים תחילה.');
            return;
        }
        setCalendarEventId(eventId);
        // Pre-select all suppliers with emails
        const withEmail = ev.participants
            .filter(p => {
                const fullSupplier = suppliers.find(s => s._id === (p.supplierId?._id || p.supplierId));
                return fullSupplier?.email;
            })
            .map(p => p.supplierId?._id || p.supplierId);
        setSelectedSupplierIds(withEmail);
        setCalendarResult(null);
        setIsCalendarModalOpen(true);
    };

    const handleSendCalendarInvite = async () => {
        if (selectedSupplierIds.length === 0) {
            alert('בחר לפחות ספק אחד עם כתובת אימייל.');
            return;
        }
        setCalendarSending(true);
        setCalendarResult(null);
        try {
            const res = await api.post('/calendar/send-invite', {
                eventId: calendarEventId,
                supplierIds: selectedSupplierIds,
            });
            setCalendarResult({ success: true, data: res.data });
        } catch (err) {
            setCalendarResult({
                success: false,
                message: err.response?.data?.message || 'שגיאה בשליחת זימון',
            });
        } finally {
            setCalendarSending(false);
        }
    };

    const toggleSupplierSelection = (supplierId) => {
        setSelectedSupplierIds(prev =>
            prev.includes(supplierId)
                ? prev.filter(id => id !== supplierId)
                : [...prev, supplierId]
        );
    };

    // ========== Export Handlers ==========
    const handleExportExcel = async (type) => {
        setShowDataMenu(false);
        try {
            const res = await api.get(`/data/export/${type}/excel`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('שגיאה בייצוא: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleExportSheets = async (type) => {
        setShowDataMenu(false);
        try {
            const res = await api.post(`/data/export/${type}/sheets`);
            if (res.data.spreadsheetUrl) {
                window.open(res.data.spreadsheetUrl, '_blank');
            }
            alert(`✅ ${res.data.message}`);
        } catch (err) {
            alert('שגיאה: ' + (err.response?.data?.message || err.message));
        }
    };

    // ========== Import Handlers ==========
    const handleImportExcel = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post(`/data/import/${type}/excel`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportResult({ success: true, message: res.data.message });
            fetchData();
        } catch (err) {
            setImportResult({ success: false, message: err.response?.data?.message || 'שגיאה בייבוא' });
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const handleImportSheets = async () => {
        if (!sheetsUrl) return;
        setImporting(true);
        setImportResult(null);
        try {
            const res = await api.post('/data/import/sheets', {
                spreadsheetUrl: sheetsUrl,
                type: sheetsImportType,
            });
            setImportResult({ success: true, message: res.data.message });
            setIsSheetsImportOpen(false);
            setSheetsUrl('');
            fetchData();
        } catch (err) {
            setImportResult({ success: false, message: err.response?.data?.message || 'שגיאה בייבוא' });
        } finally {
            setImporting(false);
        }
    };

    if (loading) return <EventsSkeleton />;

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
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
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

                    {/* Data Menu Button */}
                    <div className="relative" ref={dataMenuRef}>
                        <button
                            onClick={() => setShowDataMenu(!showDataMenu)}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl transition font-medium text-sm"
                        >
                            <FiDownload size={16} />
                            נתונים
                            <FiChevronDown size={14} />
                        </button>
                        {showDataMenu && (
                            <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 w-64 overflow-hidden">
                                <div className="p-2">
                                    <p className="text-xs text-slate-500 px-3 py-1 font-medium">ייצוא לאקסל</p>
                                    <button onClick={() => handleExportExcel('events')} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2">
                                        <FiDownload size={14} /> ייצוא אירועים
                                    </button>
                                    <button onClick={() => handleExportExcel('suppliers')} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2">
                                        <FiDownload size={14} /> ייצוא ספקים
                                    </button>
                                    <button onClick={() => handleExportExcel('payments')} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2">
                                        <FiDownload size={14} /> ייצוא תשלומים
                                    </button>

                                    <hr className="border-slate-700 my-2" />
                                    <p className="text-xs text-slate-500 px-3 py-1 font-medium">ייצוא ל-Google Sheets</p>
                                    <button onClick={() => handleExportSheets('events')} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2">
                                        <FiUpload size={14} /> אירועים → Google Sheets
                                    </button>
                                    <button onClick={() => handleExportSheets('suppliers')} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2">
                                        <FiUpload size={14} /> ספקים → Google Sheets
                                    </button>

                                    <hr className="border-slate-700 my-2" />
                                    <p className="text-xs text-slate-500 px-3 py-1 font-medium">ייבוא</p>
                                    <label className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2 cursor-pointer">
                                        <FiUpload size={14} /> ייבוא אירועים מאקסל
                                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleImportExcel(e, 'events')} />
                                    </label>
                                    <label className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2 cursor-pointer">
                                        <FiUpload size={14} /> ייבוא ספקים מאקסל
                                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleImportExcel(e, 'suppliers')} />
                                    </label>
                                    <button onClick={() => { setShowDataMenu(false); setIsSheetsImportOpen(true); }} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition flex items-center gap-2">
                                        <FiUpload size={14} /> ייבוא מ-Google Sheets
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => openEventModal()}
                        className="flex shrink-0 items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition shadow-lg font-medium"
                    >
                        <FiPlus /> הוסף אירוע
                    </button>
                </div>
            </div>

            {/* Import Result Banner */}
            {importResult && (
                <div className={`p-3 rounded-xl text-sm font-medium flex justify-between items-center ${importResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <span>{importResult.message}</span>
                    <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
            )}

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
                                // Calculate non-substitute costs for partner profit split
                                const nonSubstituteCosts = ev.participants ? ev.participants.filter(p => !p.isSubstitute).reduce((sum, p) => sum + (p.expectedPay || 0), 0) : 0;
                                const eventProfitForPartners = ev.totalPrice - nonSubstituteCosts;

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
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-bold text-slate-300">הרכב / ספקים באירוע:</h4>
                                                    {ev.participants && ev.participants.length > 0 && (
                                                        <button
                                                            onClick={() => openCalendarModal(ev._id)}
                                                            className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg transition text-sm font-medium border border-blue-500/20"
                                                        >
                                                            <FiSend size={14} />
                                                            📅 שלח זימון בקלנדר
                                                        </button>
                                                    )}
                                                </div>
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
                                                                        <p className="font-bold text-slate-100">
                                                                            {p.supplierId?.name} <span className="text-slate-400 font-normal text-sm">({p.supplierId?.role})</span>
                                                                            {p.isSubstitute && (
                                                                                <span className="mr-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                                                                                    🔄 מחליף{p.replacesPartnerId ? ` את ${partners.find(pt => pt._id === p.replacesPartnerId)?.name || ''}` : ''}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                        <div className="flex gap-4 text-sm mt-1">
                                                                            <span>סיכום: <strong className="text-blue-400">{getCurrencySymbol(p.currency)}{p.expectedPay}</strong></span>
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

                                                {/* Partner Earnings Section */}
                                                {partners.length > 0 && (
                                                    <div className="mt-6 pt-4 border-t border-slate-700">
                                                        <h4 className="font-bold text-violet-300 mb-3">💰 רווחי שותפים באירוע:</h4>
                                                        <div className="space-y-2">
                                                            {partners.map(partner => {
                                                                // Calculate profit share using non-substitute costs only
                                                                const profitShare = eventProfitForPartners * (partner.percentage / 100);
                                                                // Check if partner is linked to a supplier in this event (non-substitute only)
                                                                let supplierPay = 0;
                                                                const linkedIds = partner.linkedSupplierIds ? partner.linkedSupplierIds.map(s => s._id || s) : [];
                                                                (ev.participants || []).forEach(p => {
                                                                    if (!p.isSubstitute && linkedIds.includes(p.supplierId?._id)) {
                                                                        supplierPay += p.expectedPay || 0;
                                                                    }
                                                                });
                                                                // Calculate substitute deductions for this partner
                                                                let substituteDeduction = 0;
                                                                (ev.participants || []).forEach(p => {
                                                                    if (p.isSubstitute && p.replacesPartnerId === partner._id) {
                                                                        substituteDeduction += p.expectedPay || 0;
                                                                    }
                                                                });
                                                                const totalPartnerEarning = profitShare + supplierPay - substituteDeduction;

                                                                return (
                                                                    <div key={partner._id} className="bg-slate-800 p-3 rounded-xl border border-violet-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-violet-400 font-bold text-sm">{partner.percentage}%</span>
                                                                            <span className="font-medium text-slate-100">{partner.name}</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-3 text-sm">
                                                                            <span>חלק מרווח: <strong className="text-violet-400">{getCurrencySymbol(ev.currency)}{Math.round(profitShare)}</strong></span>
                                                                            {supplierPay > 0 && (
                                                                                <span>שכר ספק: <strong className="text-blue-400">{getCurrencySymbol(ev.currency)}{supplierPay}</strong></span>
                                                                            )}
                                                                            {substituteDeduction > 0 && (
                                                                                <span>עלות מחליף: <strong className="text-orange-400">-{getCurrencySymbol(ev.currency)}{substituteDeduction}</strong></span>
                                                                            )}
                                                                            <span className="bg-violet-500/10 px-2 py-0.5 rounded-lg">
                                                                                סה"כ: <strong className={`${totalPartnerEarning >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{getCurrencySymbol(ev.currency)}{Math.round(totalPartnerEarning)}</strong>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
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

                            {/* Substitute Supplier Toggle */}
                            {partners.length > 0 && (
                                <div className="mt-1 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={supplierForm.isSubstitute}
                                                onChange={e => setSupplierForm({ ...supplierForm, isSubstitute: e.target.checked, replacesPartnerId: e.target.checked ? supplierForm.replacesPartnerId : '' })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-orange-500 transition-colors"></div>
                                            <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full peer-checked:-translate-x-5 transition-transform"></div>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-slate-200">🔄 ספק מחליף</span>
                                            <p className="text-xs text-slate-500">העלות תנוכה רק מהשותף שהביא את המחליף</p>
                                        </div>
                                    </label>

                                    {supplierForm.isSubstitute && (
                                        <div className="mt-3">
                                            <label className="block text-sm font-medium text-slate-400 mb-1">מחליף את השותף:</label>
                                            <select
                                                required
                                                value={supplierForm.replacesPartnerId}
                                                onChange={e => setSupplierForm({ ...supplierForm, replacesPartnerId: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                                            >
                                                <option value="">בחר שותף...</option>
                                                {partners.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name} ({p.percentage}%)</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 text-slate-400">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium">הוסף</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CALENDAR INVITE MODAL */}
            {isCalendarModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">📅 שליחת זימון בקלנדר</h3>
                        {(() => {
                            const ev = events.find(e => e._id === calendarEventId);
                            if (!ev) return null;
                            return (
                                <>
                                    <p className="text-slate-400 text-sm mb-4">
                                        אירוע: <strong className="text-slate-200">{ev.title}</strong> | {new Date(ev.date).toLocaleDateString('he-IL')}
                                    </p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        <p className="text-sm font-medium text-slate-300 mb-2">בחר ספקים לזימון:</p>
                                        {ev.participants.map(p => {
                                            const fullSupplier = suppliers.find(s => s._id === (p.supplierId?._id || p.supplierId));
                                            const hasEmail = fullSupplier?.email;
                                            const isSelected = selectedSupplierIds.includes(p.supplierId?._id || p.supplierId);
                                            return (
                                                <label
                                                    key={p._id}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSelected
                                                        ? 'bg-blue-500/10 border-blue-500/30'
                                                        : hasEmail
                                                            ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                                            : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={!hasEmail}
                                                        onChange={() => toggleSupplierSelection(p.supplierId?._id || p.supplierId)}
                                                        className="w-4 h-4 rounded accent-blue-500"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-slate-100">
                                                            {p.supplierId?.name} <span className="text-slate-400">({p.supplierId?.role})</span>
                                                        </p>
                                                        {hasEmail ? (
                                                            <p className="text-xs text-blue-400">{fullSupplier.email}</p>
                                                        ) : (
                                                            <p className="text-xs text-red-400">❌ אין אימייל — הוסף אימייל בדף הספקים</p>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-slate-400">{getCurrencySymbol(p.currency)}{p.expectedPay}</span>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {calendarResult && (
                                        <div className={`mt-4 p-3 rounded-xl text-sm ${calendarResult.success
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                            {calendarResult.success ? (
                                                <div>
                                                    <p className="font-medium">✅ {calendarResult.data.message}</p>
                                                    {calendarResult.data.calendarLink && (
                                                        <a href={calendarResult.data.calendarLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 text-xs mt-1 block">
                                                            צפה באירוע בקלנדר
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <p>❌ {calendarResult.message}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsCalendarModalOpen(false)}
                                            className="px-4 py-2 text-slate-400"
                                        >
                                            סגור
                                        </button>
                                        <button
                                            onClick={handleSendCalendarInvite}
                                            disabled={calendarSending || selectedSupplierIds.length === 0}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white font-medium transition"
                                        >
                                            {calendarSending ? (
                                                <>⏳ שולח...</>
                                            ) : (
                                                <><FiSend size={16} /> שלח זימון ({selectedSupplierIds.length})</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* GOOGLE SHEETS IMPORT MODAL */}
            {isSheetsImportOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">ייבוא מ-Google Sheets</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">קישור ל-Google Sheet</label>
                                <input
                                    type="url"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={sheetsUrl}
                                    onChange={e => setSheetsUrl(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">סוג נתונים</label>
                                <select
                                    value={sheetsImportType}
                                    onChange={e => setSheetsImportType(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100"
                                >
                                    <option value="events">אירועים</option>
                                    <option value="suppliers">ספקים</option>
                                </select>
                            </div>

                            {importResult && (
                                <div className={`p-3 rounded-xl text-sm ${importResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {importResult.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsSheetsImportOpen(false)} className="px-4 py-2 text-slate-400">ביטול</button>
                                <button
                                    onClick={handleImportSheets}
                                    disabled={!sheetsUrl || importing}
                                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white font-medium transition"
                                >
                                    {importing ? '⏳ מייבא...' : 'ייבוא'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
