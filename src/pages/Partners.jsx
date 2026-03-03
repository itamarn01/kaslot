import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiEdit2, FiTrash2, FiLink, FiPercent } from 'react-icons/fi';
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
        '&:hover': { borderColor: '#3b82f6' }
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
        '&:active': { backgroundColor: '#475569' }
    }),
    singleValue: (base) => ({ ...base, color: '#f1f5f9' }),
    input: (base) => ({ ...base, color: '#f1f5f9' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    noOptionsMessage: (base) => ({ ...base, color: '#94a3b8' })
};

export default function Partners() {
    const [partners, setPartners] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [form, setForm] = useState({ name: '', percentage: '', linkedSupplierIds: [] });
    const [error, setError] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [partnersRes, suppliersRes] = await Promise.all([
                api.get('/partners'),
                api.get('/suppliers')
            ]);
            setPartners(partnersRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalPercentage = partners.reduce((sum, p) => {
        if (isEditMode && p._id === currentId) return sum;
        return sum + p.percentage;
    }, 0);

    const currentFormPercentage = Number(form.percentage) || 0;
    const projectedTotal = totalPercentage + currentFormPercentage;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                name: form.name,
                percentage: Number(form.percentage),
                linkedSupplierIds: form.linkedSupplierIds
            };
            if (isEditMode) {
                await api.put(`/partners/${currentId}`, payload);
            } else {
                await api.post('/partners', payload);
            }
            setIsModalOpen(false);
            setForm({ name: '', percentage: '', linkedSupplierIds: [] });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'שגיאה בשמירה');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק שותף זה?')) {
            try {
                await api.delete(`/partners/${id}`);
                fetchData();
            } catch (err) { console.error(err); }
        }
    };

    const openModal = (partner = null) => {
        if (partner) {
            setIsEditMode(true);
            setCurrentId(partner._id);
            setForm({
                name: partner.name,
                percentage: partner.percentage,
                linkedSupplierIds: partner.linkedSupplierIds ? partner.linkedSupplierIds.map(s => s._id || s) : []
            });
        } else {
            setIsEditMode(false);
            setCurrentId(null);
            setForm({ name: '', percentage: '', linkedSupplierIds: [] });
        }
        setError('');
        setIsModalOpen(true);
    };

    const supplierOptions = suppliers.map(s => ({
        value: s._id,
        label: `${s.name} (${s.role})`
    }));

    if (loading) return <div className="text-center">טוען...</div>;

    const displayTotal = partners.reduce((sum, p) => sum + p.percentage, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">שותפים</h2>
                <button
                    onClick={() => openModal()}
                    className="flex shrink-0 items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-5 py-2.5 rounded-xl transition shadow-lg font-medium"
                >
                    <FiPlus /> הוסף שותף
                </button>
            </div>

            {/* Percentage Progress Bar */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">חלוקת אחוזים</span>
                    <span className={`text-sm font-bold ${displayTotal === 100 ? 'text-emerald-400' : displayTotal > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                        {displayTotal}% / 100%
                    </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${displayTotal === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : displayTotal > 100 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-violet-500 to-purple-400'}`}
                        style={{ width: `${Math.min(displayTotal, 100)}%` }}
                    />
                </div>
                {displayTotal < 100 && (
                    <p className="text-xs text-amber-400/80 mt-2">נותרו {100 - displayTotal}% לחלוקה</p>
                )}
                {displayTotal === 100 && (
                    <p className="text-xs text-emerald-400/80 mt-2">✓ החלוקה מלאה</p>
                )}
            </div>

            {/* Partners Cards */}
            {partners.length === 0 ? (
                <p className="text-center text-slate-500 py-12">אין שותפים. הוסף שותף ראשון!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partners.map(partner => (
                        <div key={partner._id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-violet-500/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-violet-500/5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100">{partner.name}</h3>
                                    {partner.linkedSupplierIds && partner.linkedSupplierIds.length > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                                            <FiLink size={12} />
                                            מקושר ל: {partner.linkedSupplierIds.map(s => s.name).join(', ')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openModal(partner)}
                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition"
                                        title="ערוך"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(partner._id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                                        title="מחק"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-500"
                                        style={{ width: `${partner.percentage}%` }}
                                    />
                                </div>
                                <span className="text-lg font-bold text-violet-400 min-w-[3rem] text-left">
                                    {partner.percentage}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">{isEditMode ? 'ערוך שותף' : 'שותף חדש'}</h3>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">שם השותף</label>
                                <input
                                    required
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                                    placeholder="לדוגמא: נתנאל יוסף"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    אחוז שותפות
                                    <span className={`mr-2 text-xs ${projectedTotal > 100 ? 'text-red-400' : 'text-slate-500'}`}>
                                        (סה"כ עם שותפים אחרים: {projectedTotal}%)
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max={100 - totalPercentage}
                                        value={form.percentage}
                                        onChange={e => setForm({ ...form, percentage: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                                        placeholder="25"
                                    />
                                    <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">קישור לספק (אופציונלי)</label>
                                <Select
                                    isMulti
                                    options={supplierOptions}
                                    placeholder="בחר ספקים לקישור..."
                                    styles={customSelectStyles}
                                    value={supplierOptions.filter(opt => form.linkedSupplierIds.includes(opt.value))}
                                    onChange={(selected) => setForm({ ...form, linkedSupplierIds: selected ? selected.map(s => s.value) : [] })}
                                    isClearable
                                />
                                <p className="text-xs text-slate-500 mt-1">אם השותף הוא גם ספק/נגן, קשר אותו כדי לראות סה"כ הכנסות משולבות</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg text-white font-medium">שמור</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
