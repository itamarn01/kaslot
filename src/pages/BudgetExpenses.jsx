import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  FiPlus, FiTrash2, FiEdit2, FiDollarSign, FiCalendar,
  FiTrendingDown, FiTrendingUp, FiAlertCircle, FiCheckCircle,
  FiX, FiSave
} from 'react-icons/fi';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'מזומן' },
  { value: 'Bit', label: 'ביט' },
  { value: 'Paybox', label: 'פייבוקס' },
  { value: 'Bank Transfer', label: 'העברה בנקאית' },
  { value: 'Check', label: "צ'ק" },
  { value: 'Loan', label: 'הלוואה' },
];

const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function BudgetExpenses() {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Budget form
  const [budgetForm, setBudgetForm] = useState({ amount: '', deductionDay: 10 });
  const [budgetEditing, setBudgetEditing] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetError, setBudgetError] = useState('');

  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseEditId, setExpenseEditId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    method: 'Cash',
    installments: 1,
    date: todayStr(),
    description: '',
  });
  const [expenseError, setExpenseError] = useState('');
  const [expenseSaving, setExpenseSaving] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) years.add(y);
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budget/summary?year=${selectedYear}`);
      setSummary(res.data);
      if (res.data.budget) {
        setBudgetForm({ amount: res.data.budget.amount, deductionDay: res.data.budget.deductionDay });
        setBudgetEditing(false);
      } else {
        setBudgetForm({ amount: '', deductionDay: 10 });
        setBudgetEditing(true); // open form to create budget if none exists
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [selectedYear]);

  // ---- Budget handlers ----
  const handleBudgetSave = async (e) => {
    e.preventDefault();
    setBudgetError('');
    setBudgetSaving(true);
    try {
      const payload = {
        year: selectedYear,
        amount: Number(budgetForm.amount),
        deductionDay: Number(budgetForm.deductionDay),
      };
      if (summary?.budget?._id) {
        await api.put(`/budget/${summary.budget._id}`, payload);
      } else {
        await api.post('/budget', payload);
      }
      setBudgetEditing(false);
      fetchSummary();
    } catch (err) {
      setBudgetError(err.response?.data?.message || 'שגיאה בשמירת התקציב');
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleBudgetDelete = async () => {
    if (!summary?.budget?._id) return;
    if (!window.confirm('האם למחוק את התקציב של שנה זו?')) return;
    try {
      await api.delete(`/budget/${summary.budget._id}`);
      fetchSummary();
    } catch (e) { console.error(e); }
  };

  // ---- Expense handlers ----
  const openNewExpense = () => {
    setExpenseEditId(null);
    setExpenseForm({ amount: '', method: 'Cash', installments: 1, date: todayStr(), description: '' });
    setExpenseError('');
    setExpenseModalOpen(true);
  };

  const openEditExpense = (exp) => {
    setExpenseEditId(exp._id);
    setExpenseForm({
      amount: exp.amount,
      method: exp.method,
      installments: exp.installments,
      date: new Date(exp.date).toISOString().split('T')[0],
      description: exp.description,
    });
    setExpenseError('');
    setExpenseModalOpen(true);
  };

  const handleExpenseSave = async (e) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseSaving(true);
    try {
      const payload = {
        amount: Number(expenseForm.amount),
        method: expenseForm.method,
        installments: Number(expenseForm.installments),
        date: expenseForm.date,
        description: expenseForm.description,
      };
      if (expenseEditId) {
        await api.put(`/budget/expenses/${expenseEditId}`, payload);
      } else {
        await api.post('/budget/expenses', payload);
      }
      setExpenseModalOpen(false);
      fetchSummary();
    } catch (err) {
      setExpenseError(err.response?.data?.message || 'שגיאה בשמירת ההוצאה');
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleExpenseDelete = async (id) => {
    if (!window.confirm('האם למחוק הוצאה זו?')) return;
    try {
      await api.delete(`/budget/expenses/${id}`);
      fetchSummary();
    } catch (e) { console.error(e); }
  };

  const methodLabel = (m) => PAYMENT_METHODS.find(x => x.value === m)?.label || m;

  // ---- Derived values ----
  const budgetAmount = summary?.budgetAmount || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const balance = summary?.balance || 0;
  const monthlyBudget = summary?.monthlyBudget || 0;
  const monthsElapsed = summary?.monthsElapsed || 0;
  const allocatedSoFar = monthlyBudget * monthsElapsed;
  const partnerDeductions = summary?.partnerDeductions || [];
  const expenses = summary?.expenses || [];

  const isDeficit = balance < 0;

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-slate-700 rounded-xl animate-pulse" />
      <div className="h-48 bg-slate-800 rounded-2xl animate-pulse" />
      <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          תקציב והוצאות להקה
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">שנה:</span>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ===== BUDGET SECTION ===== */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15">
              <FiDollarSign size={22} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">תקציב שנתי {selectedYear}</h3>
              {summary?.budget && !budgetEditing && (
                <p className="text-xs text-slate-500 mt-0.5">
                  ניכוי ב-{summary.budget.deductionDay} לכל חודש
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary?.budget && !budgetEditing && (
              <>
                <button
                  onClick={() => setBudgetEditing(true)}
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition"
                  title="ערוך תקציב"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={handleBudgetDelete}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                  title="מחק תקציב"
                >
                  <FiTrash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-5">
          {budgetEditing ? (
            <form onSubmit={handleBudgetSave} className="space-y-4">
              {budgetError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {budgetError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    תקציב שנתי (₪)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={budgetForm.amount}
                    onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    יום ניכוי בחודש (1-28)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="28"
                    value={budgetForm.deductionDay}
                    onChange={e => setBudgetForm({ ...budgetForm, deductionDay: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                {summary?.budget && (
                  <button
                    type="button"
                    onClick={() => { setBudgetEditing(false); setBudgetError(''); }}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 transition"
                  >
                    ביטול
                  </button>
                )}
                <button
                  type="submit"
                  disabled={budgetSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium shadow transition disabled:opacity-60"
                >
                  <FiSave size={16} />
                  {budgetSaving ? 'שומר...' : 'שמור תקציב'}
                </button>
              </div>
            </form>
          ) : summary?.budget ? (
            <div className="space-y-4">
              {/* Budget overview row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">תקציב שנתי</p>
                  <p className="text-2xl font-bold text-amber-400">₪{budgetAmount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">חודשי (1/12)</p>
                  <p className="text-2xl font-bold text-blue-400">₪{Math.round(monthlyBudget).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">הוקצה עד כה ({monthsElapsed} חודשים)</p>
                  <p className="text-2xl font-bold text-violet-400">₪{Math.round(allocatedSoFar).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">יום ניכוי</p>
                  <p className="text-2xl font-bold text-slate-300">{summary.budget.deductionDay}</p>
                  <p className="text-xs text-slate-500">לכל חודש</p>
                </div>
              </div>

              {/* Per-partner monthly deduction breakdown */}
              {partnerDeductions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-400 mb-2">חלוקה חודשית לשותפים</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {partnerDeductions.map(p => (
                      <div key={p._id} className="flex items-center justify-between bg-slate-900/40 border border-slate-700/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.percentage}% שותפות</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-400">
                            -₪{p.monthlyDeduction.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-500">כל חודש</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FiDollarSign size={36} className="mx-auto mb-3 text-slate-600" />
              <p className="mb-4">לא הוגדר תקציב לשנת {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== EXPENSES SECTION ===== */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/15">
              <FiTrendingDown size={22} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              הוצאות להקה {selectedYear}
              {expenses.length > 0 && (
                <span className="mr-2 text-sm font-normal text-slate-500">({expenses.length})</span>
              )}
            </h3>
          </div>
          <button
            onClick={openNewExpense}
            className="flex items-center gap-2 bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition shadow font-medium text-sm"
          >
            <FiPlus size={16} /> הוסף הוצאה
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FiTrendingDown size={36} className="mx-auto mb-3 text-slate-600" />
            <p>אין הוצאות להקה לשנה זו</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2 text-xs text-slate-500 font-medium bg-slate-900/30">
              <span className="col-span-1">תאריך</span>
              <span className="col-span-4">פירוט</span>
              <span className="col-span-2">אמצעי תשלום</span>
              <span className="col-span-2 text-center">תשלומים</span>
              <span className="col-span-2 text-left">סכום</span>
              <span className="col-span-1"></span>
            </div>
            {expenses.map(exp => (
              <div key={exp._id} className="px-5 py-4 hover:bg-slate-700/20 transition grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                {/* Mobile layout */}
                <div className="md:hidden flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-100 mb-0.5">{exp.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(exp.date).toLocaleDateString('he-IL')} •{' '}
                      {methodLabel(exp.method)}{' '}
                      {exp.installments > 1 && `• ${exp.installments} תשלומים`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold text-lg">₪{exp.amount.toLocaleString()}</span>
                    <button onClick={() => openEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg transition">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => handleExpenseDelete(exp._id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Desktop layout */}
                <span className="hidden md:block col-span-1 text-xs text-slate-500">
                  {new Date(exp.date).toLocaleDateString('he-IL')}
                </span>
                <span className="hidden md:block col-span-4 text-sm text-slate-200 font-medium">{exp.description}</span>
                <span className="hidden md:block col-span-2 text-xs text-slate-400">{methodLabel(exp.method)}</span>
                <span className="hidden md:block col-span-2 text-xs text-slate-400 text-center">
                  {exp.installments > 1 ? `${exp.installments} תשלומים` : 'חד-פעמי'}
                </span>
                <span className="hidden md:block col-span-2 text-sm font-bold text-red-400">
                  ₪{exp.amount.toLocaleString()}
                </span>
                <div className="hidden md:flex col-span-1 items-center justify-end gap-1">
                  <button onClick={() => openEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleExpenseDelete(exp._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {/* Total row */}
            <div className="px-5 py-4 bg-slate-900/40 flex justify-between items-center">
              <span className="text-slate-400 font-semibold text-sm">סה״כ הוצאות</span>
              <span className="text-red-400 font-bold text-xl">₪{totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* ===== BALANCE SECTION ===== */}
      {budgetAmount > 0 && (
        <div className={`rounded-2xl border shadow-lg p-6 ${isDeficit
          ? 'bg-gradient-to-br from-red-900/30 to-slate-800 border-red-500/30'
          : 'bg-gradient-to-br from-emerald-900/30 to-slate-800 border-emerald-500/30'
          }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2.5 rounded-xl ${isDeficit ? 'bg-red-500/15' : 'bg-emerald-500/15'}`}>
              {isDeficit
                ? <FiAlertCircle size={24} className="text-red-400" />
                : <FiCheckCircle size={24} className="text-emerald-400" />
              }
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isDeficit ? '⚠️ גירעון תקציבי' : '✅ עודף תקציבי'}
              </h3>
              <p className="text-xs text-slate-500">שנת {selectedYear} — תקציב מול הוצאות</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/60">
              <p className="text-xs text-slate-500 mb-1">תקציב שנתי</p>
              <p className="text-2xl font-bold text-amber-400">₪{budgetAmount.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/60">
              <p className="text-xs text-slate-500 mb-1">סה״כ הוצאות</p>
              <p className="text-2xl font-bold text-red-400">₪{totalExpenses.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-4 border ${isDeficit
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
              <p className="text-xs text-slate-500 mb-1">{isDeficit ? 'גירעון' : 'עודף'}</p>
              <p className={`text-2xl font-bold ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
                {isDeficit ? '-' : '+'}₪{Math.abs(balance).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Visual progress bar */}
          {budgetAmount > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>ניצול תקציב</span>
                <span>{Math.round((totalExpenses / budgetAmount) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isDeficit
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    }`}
                  style={{ width: `${Math.min((totalExpenses / budgetAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== EXPENSE MODAL ===== */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-100">
                {expenseEditId ? 'עריכת הוצאה' : 'הוצאה חדשה'}
              </h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition">
                <FiX size={20} />
              </button>
            </div>

            {expenseError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleExpenseSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">פירוט ההוצאה</label>
                <input
                  required
                  type="text"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  placeholder="רכישת ציוד, חזרה, וכו׳..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">סכום (₪)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">תאריך</label>
                  <input
                    required
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">אמצעי תשלום</label>
                  <select
                    value={expenseForm.method}
                    onChange={e => setExpenseForm({ ...expenseForm, method: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">מספר תשלומים</label>
                  <input
                    type="number"
                    min="1"
                    value={expenseForm.installments}
                    onChange={e => setExpenseForm({ ...expenseForm, installments: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 transition"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={expenseSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow transition disabled:opacity-60"
                >
                  <FiSave size={16} />
                  {expenseSaving ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
