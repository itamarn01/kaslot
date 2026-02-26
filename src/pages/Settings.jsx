import React from 'react';

export default function Settings() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">הגדרות מתקדמות</h2>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4">אמצעי תשלום נתמכים</h3>
                <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> מזומן</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> ביט</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400"></span> פייבוקס</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> העברה בנקאית</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> ציק</li>
                </ul>
                <p className="mt-4 text-sm text-slate-500">אלו מוגדרים במערכת כברירת מחדל ולא ניתנים לעריכה כרגע.</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-100 mb-4">מטבעות</h3>
                <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> שקל דיגיטלי (₪)</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> דולר אמריקאי ($)</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400"></span> יורו (€)</li>
                </ul>
            </div>
        </div>
    );
}
