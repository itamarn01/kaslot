import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [formData, setFormData] = useState({ name: '', role: '', contact_info: '' });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentSupplier) {
                await api.put(`/suppliers/${currentSupplier._id}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק ספק זה?')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const openModal = (supplier = null) => {
        if (supplier) {
            setCurrentSupplier(supplier);
            setFormData({ name: supplier.name, role: supplier.role, contact_info: supplier.contact_info || '' });
        } else {
            setCurrentSupplier(null);
            setFormData({ name: '', role: '', contact_info: '' });
        }
        setIsModalOpen(true);
    };

    if (loading) return <div className="text-center">טוען...</div>;

    const filteredSuppliers = suppliers.filter(s => {
        const search = searchTerm.toLowerCase();
        return (
            s.name.toLowerCase().includes(search) ||
            s.role.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ספקים ונגנים</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="חיפוש לפי שם או תפקיד..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-slate-100 focus:outline-none focus:border-purple-500 transition"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="w-full sm:w-auto flex shrink-0 justify-center items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-500/20 font-medium"
                    >
                        <FiPlus /> הוסף ספק
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map(s => (
                    <div key={s._id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col justify-between hover:border-purple-500/50 transition">
                        <div>
                            <h3 className="text-xl font-bold text-slate-100">{s.name}</h3>
                            <p className="text-purple-400 font-medium">{s.role}</p>
                            <p className="text-slate-400 text-sm mt-2">{s.contact_info || 'אין פרטי קשר'}</p>
                        </div>
                        <div className="flex gap-2 mt-6 justify-end">
                            <button onClick={() => openModal(s)} className="p-2 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-lg transition">
                                <FiEdit2 />
                            </button>
                            <button onClick={() => handleDelete(s._id)} className="p-2 bg-slate-700 hover:bg-slate-600 text-red-400 rounded-lg transition">
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">{currentSupplier ? 'ערוך ספק' : 'ספק חדש'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">שם</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">תפקיד/כלי</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">פרטי קשר (לא חובה)</label>
                                <input
                                    type="text"
                                    value={formData.contact_info}
                                    onChange={e => setFormData({ ...formData, contact_info: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">ביטול</button>
                                <button type="submit" className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition shadow-lg shadow-purple-500/20">שמור</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
