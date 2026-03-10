import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { FiCalendar, FiMapPin, FiPieChart, FiCreditCard, FiTrendingUp } from 'react-icons/fi';

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

    const { partner, events, payments, totalExpected, totalPaid } = report;
    const balance = {
        Shekel: totalExpected.Shekel - totalPaid.Shekel,
        Dollar: totalExpected.Dollar - totalPaid.Dollar,
        Euro: totalExpected.Euro - totalPaid.Euro,
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
                        <p className="text-slate-500 text-sm mt-3">מקושר לספקים: {partner.linkedSupplierIds.map(s => s.name).join(', ')}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-3">דוח יוצר ע"י Kaslot • {new Date().toLocaleDateString('he-IL')}</p>
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-3 gap-3">
                    {['Shekel', 'Dollar', 'Euro'].map(cur => (
                        (totalExpected[cur] > 0 || totalPaid[cur] > 0) && (
                            <div key={cur} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                                <p className="text-xs text-slate-500 mb-3 font-medium">{cur === 'Shekel' ? 'שקל ₪' : cur === 'Dollar' ? 'דולר $' : 'יורו €'}</p>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">סה"כ מגיע</span>
                                        <span className="text-blue-400 font-bold">{getCurrencySymbol(cur)}{Math.round(totalExpected[cur]).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">שולם</span>
                                        <span className="text-emerald-400 font-bold">{getCurrencySymbol(cur)}{Math.round(totalPaid[cur]).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-700 pt-1.5 flex justify-between">
                                        <span className="text-slate-400">יתרה</span>
                                        <span className={`font-bold ${balance[cur] > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {getCurrencySymbol(cur)}{Math.round(balance[cur]).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Events */}
                {events.length > 0 && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                            <FiCalendar className="text-emerald-400" />
                            <h2 className="font-bold text-slate-100">אירועים ({events.length})</h2>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {events.map(ev => (
                                <div key={ev._id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-slate-100">{ev.title}</p>
                                            <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><FiCalendar size={11} />{new Date(ev.date).toLocaleDateString('he-IL')}</span>
                                                {ev.location && <span className="flex items-center gap-1"><FiMapPin size={11} />{ev.location}</span>}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-emerald-400">{getCurrencySymbol(ev.currency)}{Math.round(ev.expectedPay).toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-500">סה״כ לאירוע זה</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 rounded-lg p-2 mt-2 space-y-1 text-sm border border-slate-700/50">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-xs">רווח כשותף:</span>
                                            <span className="text-violet-400 font-medium">{getCurrencySymbol(ev.currency)}{Math.round(ev.partnerShare).toLocaleString()}</span>
                                        </div>
                                        {ev.supplierEarnings > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-xs">שכר כספק:</span>
                                                <span className="text-blue-400 font-medium">{getCurrencySymbol(ev.currency)}{Math.round(ev.supplierEarnings).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {ev.substituteDeduction > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-xs">🔄 עלות מחליף:</span>
                                                <span className="text-orange-400 font-medium">-{getCurrencySymbol(ev.currency)}{Math.round(ev.substituteDeduction).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
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
                            <h2 className="font-bold text-slate-100">תשלומים ({payments.length})</h2>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {payments.map(pay => (
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

                {events.length === 0 && payments.length === 0 && (
                    <div className="text-center text-slate-500 py-10">אין נתונים להצגה עדיין.</div>
                )}

                <p className="text-center text-xs text-slate-700 pb-4">הופק באמצעות Kaslot</p>
            </div>
        </div>
    );
}
