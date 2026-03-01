import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { FiTrendingUp, FiCreditCard, FiActivity, FiUsers } from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const fetchData = async () => {
        try {
            const [summaryRes, eventsRes] = await Promise.all([
                api.get('/dashboard/summary'),
                api.get('/events')
            ]);
            setSummary(summaryRes.data);
            setEvents(eventsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper functions and memoized chart data
    const chartData = useMemo(() => {
        if (!events.length) return { monthly: [], expenses: [] };

        const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
            name: months[i],
            income: 0,
            profit: 0,
            expenses: 0
        }));

        const expensesBySupplier = {};

        events.forEach(ev => {
            const evDate = new Date(ev.date);
            if (evDate.getFullYear().toString() === selectedYear) {
                const monthIndex = evDate.getMonth();

                // Income for the month
                monthlyStats[monthIndex].income += ev.totalPrice || 0;

                // Calculate expenses for this event
                let eventExpenses = 0;
                if (ev.participants && ev.participants.length > 0) {
                    ev.participants.forEach(p => {
                        const pay = p.expectedPay || 0;
                        eventExpenses += pay;

                        // Track expenses by supplier role/name for PieChart
                        const supplierName = p.supplierId ? p.supplierId.name : 'לא ידוע';
                        const role = p.supplierId ? p.supplierId.role : 'אחר';
                        const key = `${role} - ${supplierName}`;

                        if (!expensesBySupplier[key]) {
                            expensesBySupplier[key] = { name: key, value: 0 };
                        }
                        expensesBySupplier[key].value += pay;
                    });
                }

                monthlyStats[monthIndex].expenses += eventExpenses;
                monthlyStats[monthIndex].profit += (ev.totalPrice || 0) - eventExpenses;
            }
        });

        const expensesData = Object.values(expensesBySupplier).sort((a, b) => b.value - a.value);

        return {
            monthly: monthlyStats,
            expenses: expensesData
        };
    }, [events, selectedYear]);

    const COLORS = ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#38bdf8', '#fb923c', '#94a3b8'];

    const availableYears = useMemo(() => {
        const years = new Set(events.map(ev => new Date(ev.date).getFullYear().toString()));
        years.add(new Date().getFullYear().toString()); // Ensure current year is always an option
        return Array.from(years).sort((a, b) => b - a);
    }, [events]);

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

            {/* Charts Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-10 mb-6 gap-4">
                <h3 className="text-2xl font-bold text-slate-100">ניתוח נתונים וגרפים</h3>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">סנן לפי שנה:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Income/Profit Bar Chart */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg h-96">
                    <h4 className="text-lg font-bold text-slate-300 mb-6">מגמת הכנסות ורווח חודשי (ש״ח)</h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartData.monthly} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
                            <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} tickFormatter={(value) => `₪${value}`} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                formatter={(value) => [`₪${value}`, '']}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="income" name="הכנסה מאירועים" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="רווח קופה" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Expenses Breakdown Pie Chart */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg h-96 flex flex-col">
                    <h4 className="text-lg font-bold text-slate-300 mb-2">פילוח הוצאות לנגנים/ספקים</h4>
                    {chartData.expenses.length > 0 ? (
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.expenses}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.expenses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                                        formatter={(value) => [`₪${value}`, '']}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            אין הוצאות בשנה זו.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
