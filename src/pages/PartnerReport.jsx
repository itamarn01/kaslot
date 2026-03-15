import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { FiCalendar, FiMapPin, FiPieChart, FiCreditCard, FiTrendingUp, FiDollarSign, FiLink, FiPhone } from 'react-icons/fi';

export default function PartnerReport() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`/partners/${id}/report`)
            .then(res => setReport(res.data))
            .catch(() => setError('לא ניתן לטעון את הדוח. ייתכן שהקישור אינו תקין.'))
            .finally(() => setLoading(false));
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

    const { partner, events, payments, totalExpected, totalPaid, totalDebt = { Shekel: 0, Dollar: 0, Euro: 0 }, linkedBandExpenses = [], totalBandExpenses = { Shekel: 0 }, budgetInfo } = report;
    const totalBudgetDeduction = (budgetInfo?.totalBudgetDeduction || 0);
    const balance = {
        Shekel: totalExpected.Shekel + (totalBandExpenses.Shekel || 0) + (totalDebt.Shekel || 0) - totalBudgetDeduction - totalPaid.Shekel,
        Dollar: totalExpected.Dollar + (totalDebt.Dollar || 0) - totalPaid.Dollar,
        Euro: totalExpected.Euro + (totalDebt.Euro || 0) - totalPaid.Euro,
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8" dir="rtl">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FiPieChart size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{partner.name}</h1>
                    <span className="bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full text-sm font-bold">
                        שותף ({partner.percentage}%)
                    </span>
                    {partner.linkedSupplierIds && partner.linkedSupplierIds.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="text-slate-500 text-xs w-full mb-1">מקושר לספקים:</span>
                            {partner.linkedSupplierIds.map(s => (
                                <span key={s._id} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] border border-slate-600">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-slate-600 mt-3">דוח יוצר ע"י Kaslot • {new Date().toLocaleDateString('he-IL')}</p>
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {['Shekel', 'Dollar', 'Euro'].map(cur => (
                        (totalExpected[cur] > 0 || totalPaid[cur] > 0 || (totalDebt[cur] || 0) > 0 || (cur === 'Shekel' && ((totalBandExpenses.Shekel || 0) > 0))) && (
                            <div key={cur} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                                <p className="text-xs text-slate-500 mb-3 font-medium">{cur === 'Shekel' ? 'שקל ₪' : cur === 'Dollar' ? 'דולר $' : 'יורו €'}</p>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">רווח מאירועים</span>
                                        <span className="text-blue-400 font-bold">{getCurrencySymbol(cur)}{Math.round(totalExpected[cur]).toLocaleString()}</span>
                                    </div>
                                    {cur === 'Shekel' && (totalBandExpenses.Shekel || 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-xs flex items-center gap-1"><FiLink size={9} /> הוצאות להקה</span>
                                            <span className="text-cyan-400 font-bold">₪{(totalBandExpenses.Shekel || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {cur === 'Shekel' && totalBudgetDeduction > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-xs text-orange-400/80">הפחתת תקציב</span>
                                            <span className="text-orange-400 font-bold">-₪{Math.round(totalBudgetDeduction).toLocaleString()}</span>
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
                                        <span className="text-emerald-400 font-bold">{getCurrencySymbol(cur)}{Math.round(totalPaid[cur]).toLocaleString()}</span>
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

                {/* Budget Deduction Card */}
                {budgetInfo?.budget && budgetInfo.monthlyBudgetDeduction > 0 && (
                    <div className="bg-slate-800 rounded-2xl border border-amber-500/20 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                            <FiDollarSign className="text-amber-400" />
                            <h2 className="font-bold text-slate-100">ניכוי תקציב ({budgetInfo.budget.year})</h2>
                        </div>
                        <div className="p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">תקציב שנתי (חלק {partner.percentage}%)</span>
                                <span className="text-amber-400 font-medium">₪{Math.round(budgetInfo.budget.amount * partner.percentage / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">ניכוי חודשי</span>
                                <span className="text-orange-400 font-medium">-₪{budgetInfo.monthlyBudgetDeduction.toLocaleString('he-IL', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700 pt-2">
                                <span className="text-slate-300 font-semibold">ניכוי מצטבר ({budgetInfo.monthsElapsed} חודשים)</span>
                                <span className="text-red-400 font-bold">-₪{budgetInfo.totalBudgetDeduction.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">ניכוי ב-{budgetInfo.budget.deductionDay} לכל חודש</p>
                        </div>
                    </div>
                )}

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
                                        <div className="flex justify-between items-start mb-2">
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
                                                <div className="text-lg font-bold text-emerald-400 whitespace-nowrap">{getCurrencySymbol(ev.currency)}{Math.round(ev.expectedPay).toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-500">סה״כ לתשלום</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/50 rounded-xl p-3 mt-3 space-y-2 text-sm border border-slate-700/50 shadow-inner">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-xs">רווח כשותף ({partner.percentage}%):</span>
                                                <span className="text-violet-400 font-bold">{getCurrencySymbol(ev.currency)}{Math.round(ev.partnerShare).toLocaleString()}</span>
                                            </div>
                                            {ev.supplierEarnings > 0 && (
                                                <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                                                    <span className="text-slate-400 text-xs">שכר כספק:</span>
                                                    <span className="text-blue-400 font-bold">{getCurrencySymbol(ev.currency)}{Math.round(ev.supplierEarnings).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {ev.substitutes && ev.substitutes.length > 0 && (
                                                <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-2">
                                                    {ev.substitutes.map((sub, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-orange-500/5 border border-orange-500/10 rounded-lg px-3 py-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                                                                    <FiUsers size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-semibold text-orange-400/80">הוחלפת על ידי:</p>
                                                                    <p className="text-xs text-slate-200 font-bold">
                                                                        {sub.name}
                                                                        {sub.role && <span className="text-slate-500 font-normal"> ({sub.role})</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="text-orange-400 font-black text-xs">
                                                                -{getCurrencySymbol(sub.currency)}{sub.pay.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
                            <h2 className="font-bold text-slate-100">תשלומים ({payments.filter(p => p.direction !== 'debt').length})</h2>
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
