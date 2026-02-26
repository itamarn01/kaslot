import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiTrendingUp, FiCreditCard, FiActivity, FiUsers } from 'react-icons/fi';

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/dashboard/summary');
            setSummary(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full">טוען נתונים...</div>;

    const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-slate-600 transition duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">סקירה כללית</h2>
            </div>

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="סה״כ מחזור אירועים"
                        /*  value={`₪${summary.totalEventsPrice.Shekel.toLocaleString()} | $${summary.totalEventsPrice.Dollar.toLocaleString()} | €${summary.totalEventsPrice.Euro.toLocaleString()}`} */
                        value={`₪${summary.totalEventsPrice.Shekel.toLocaleString()}`}
                        icon={<FiActivity size={24} className="text-blue-400" />}
                        color="bg-blue-400"
                    />
                    <StatCard
                        title="רווח נוכחי"
                        /* value={`₪${summary.totalProfit.Shekel.toLocaleString()} | $${summary.totalProfit.Dollar.toLocaleString()} | €${summary.totalProfit.Euro.toLocaleString()}`} */
                        value={`₪${summary.totalProfit.Shekel.toLocaleString()}`}
                        icon={<FiTrendingUp size={24} className="text-emerald-400" />}
                        color="bg-emerald-400"
                    />
                    <StatCard
                        title="חוב לספקים"
                        /* value={`₪${summary.totalOwed.Shekel.toLocaleString()} | $${summary.totalOwed.Dollar.toLocaleString()} | €${summary.totalOwed.Euro.toLocaleString()}`}
                         */
                        value={`₪${summary.totalOwed.Shekel.toLocaleString()}`}
                        icon={<FiCreditCard size={24} className="text-red-400" />}
                        color="bg-red-400"
                    />
                    <StatCard
                        title="סה״כ אירועים"
                        value={summary.totalEvents}
                        icon={<FiUsers size={24} className="text-purple-400" />}
                        color="bg-purple-400"
                    />
                </div>
            )}

            {/* Breakdown or chart placeholder */}
            <div className="mt-8 bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-4">ניהול כספים</h3>
                <p className="text-slate-400 text-sm">הוסף גרף התפלגות הכנסות והוצאות בהמשך.</p>
                <div className="h-48 bg-slate-700/50 rounded-xl mt-4 flex items-center justify-center border border-slate-600 border-dashed">
                    <span className="text-slate-500">אזור גרף</span>
                </div>
            </div>
        </div>
    );
}
