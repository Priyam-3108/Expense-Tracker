import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import Amount from '../components/Amount';
import DebtList from '../components/DebtList';
import DebtForm from '../components/DebtForm';
import DebtStats from '../components/DebtStats';
import RepaymentModal from '../components/RepaymentModal';

const STORE = 'debtView';
// Day-to-day default: money others owe me, still pending, soonest due first.
const DEFAULT_VIEW = { type: 'lent', status: 'active', quick: '', sort: 'due', q: '' };

const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
const isOpen = (d) => d.status !== 'paid';

const chip = (on) =>
    `min-h-[36px] px-3 rounded-full text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd]/50 ${
        on
            ? 'bg-[#533afd] border-[#533afd] text-white'
            : 'bg-white dark:bg-transparent border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
    }`;

const field = 'h-11 rounded-lg text-sm bg-white dark:bg-[#232325] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-[#ededed] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd]/50';

export default function Debts() {
    const { debts, loading, deleteDebt } = useDebt();
    const { currency } = useAuth();
    const [view, setView] = useState(() => {
        try { return { ...DEFAULT_VIEW, ...JSON.parse(localStorage.getItem(STORE)), q: '' }; } catch { return DEFAULT_VIEW; }
    });
    const [form, setForm] = useState(null); // { type, edit? }
    const [repay, setRepay] = useState(null);
    const patch = (p) => setView((v) => ({ ...v, ...p }));

    useEffect(() => {
        const { q, ...rest } = view; // eslint-disable-line no-unused-vars
        localStorage.setItem(STORE, JSON.stringify(rest));
    }, [view]);

    const today = localISO(new Date());
    const weekEnd = localISO(new Date(Date.now() + 7 * 86400000));
    const all = useMemo(() => debts || [], [debts]);

    const summary = useMemo(() => {
        const overdue = (d) => d.dueDate && d.dueDate < today;
        const week = (d) => d.dueDate && d.dueDate >= today && d.dueDate <= weekEnd;
        const sum = (a) => a.reduce((s, d) => s + d.currentAmount, 0);
        const act = all.filter(isOpen);
        const lent = act.filter((d) => d.type === 'lent');
        const borrowed = act.filter((d) => d.type === 'borrowed');
        const od = act.filter(overdue);
        const wk = act.filter(week);
        return {
            receivable: sum(lent), payable: sum(borrowed), lentActive: lent.length, borrowedActive: borrowed.length,
            overdueCount: od.length, overdueAmount: sum(od), weekCount: wk.length, weekAmount: sum(wk),
        };
    }, [all, today, weekEnd]);

    const visible = useMemo(() => {
        const q = view.q.trim().toLowerCase();
        const quick = {
            overdue: (d) => isOpen(d) && d.dueDate && d.dueDate < today,
            week: (d) => isOpen(d) && d.dueDate && d.dueDate >= today && d.dueDate <= weekEnd,
        }[view.quick];
        const list = all.filter((d) =>
            (view.type === 'all' || d.type === view.type) &&
            (view.status === 'all' || (view.status === 'active' ? isOpen(d) : !isOpen(d))) &&
            (!quick || quick(d)) &&
            (!q || d.personName.toLowerCase().includes(q) || (d.notes || '').toLowerCase().includes(q))
        );
        const sorts = {
            due: (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || b.date.localeCompare(a.date),
            amount: (a, b) => b.currentAmount - a.currentAmount,
            newest: (a, b) => b.date.localeCompare(a.date),
            name: (a, b) => a.personName.localeCompare(b.personName),
        };
        return [...list].sort(sorts[view.sort] || sorts.due);
    }, [all, view, today, weekEnd]);

    const count = (t) => all.filter((d) => (t === 'all' || d.type === t) && isOpen(d)).length;
    const total = visible.filter(isOpen).reduce((s, d) => s + d.currentAmount, 0);
    const dirty = view.q || view.quick || view.status !== DEFAULT_VIEW.status || view.sort !== DEFAULT_VIEW.sort;

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) await deleteDebt(id);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64" role="status" aria-label="Loading">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1100px]">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">Debts</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1a6]">Track money you lend and borrow.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setForm({ type: 'borrowed' })} className="btn-secondary btn-md inline-flex items-center gap-1.5">
                        <Plus size={16} strokeWidth={1.5} aria-hidden="true" /> I borrowed
                    </button>
                    <button onClick={() => setForm({ type: 'lent' })} className="btn-primary btn-md inline-flex items-center gap-1.5">
                        <Plus size={16} strokeWidth={1.5} aria-hidden="true" /> I lent money
                    </button>
                </div>
            </div>

            <DebtStats s={summary} view={view} onPick={(p) => patch({ ...p, status: 'active', q: '' })} />

            <div className="glass-card p-4 sm:p-6">
                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] p-1" role="group" aria-label="Type">
                            {[['lent', 'Lent'], ['borrowed', 'Borrowed'], ['all', 'All']].map(([v, l]) => (
                                <button
                                    key={v} aria-pressed={view.type === v}
                                    onClick={() => patch({ type: v })}
                                    className={`flex-1 md:flex-none md:px-5 min-h-[36px] rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd]/50 ${
                                        view.type === v ? 'bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {l} <span className="text-xs text-gray-400 dark:text-[#85858b]">{count(v)}</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                            <input
                                type="search" value={view.q} onChange={(e) => patch({ q: e.target.value })}
                                placeholder="Search person or note" aria-label="Search debts"
                                className={`${field} w-full pl-9 pr-3 placeholder-gray-400`}
                            />
                        </div>
                        <select value={view.sort} onChange={(e) => patch({ sort: e.target.value })} aria-label="Sort by" className={`${field} px-3`}>
                            <option value="due">Sort: Due soonest</option>
                            <option value="amount">Sort: Highest amount</option>
                            <option value="newest">Sort: Newest</option>
                            <option value="name">Sort: Name A–Z</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {[['active', 'Pending'], ['paid', 'Settled'], ['all', 'All']].map(([v, l]) => (
                            <button key={v} onClick={() => patch({ status: v })} className={chip(view.status === v)} aria-pressed={view.status === v}>{l}</button>
                        ))}
                        <span className="w-px h-5 bg-gray-200 dark:bg-white/[0.1] mx-1" aria-hidden="true" />
                        <button onClick={() => patch({ quick: view.quick === 'overdue' ? '' : 'overdue', status: 'active' })} className={chip(view.quick === 'overdue')} aria-pressed={view.quick === 'overdue'}>
                            Overdue{summary.overdueCount ? ` · ${summary.overdueCount}` : ''}
                        </button>
                        <button onClick={() => patch({ quick: view.quick === 'week' ? '' : 'week', status: 'active' })} className={chip(view.quick === 'week')} aria-pressed={view.quick === 'week'}>
                            Due this week{summary.weekCount ? ` · ${summary.weekCount}` : ''}
                        </button>
                        {dirty && (
                            <button onClick={() => patch({ ...DEFAULT_VIEW, type: view.type })} className="inline-flex items-center gap-1 min-h-[36px] px-2 text-sm text-[#533afd] dark:text-[#8b7ffe] hover:underline">
                                <X size={14} aria-hidden="true" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 py-3 text-xs text-gray-500 dark:text-[#85858b] border-y border-gray-200 dark:border-white/[0.06]">
                    <span>{visible.length} record{visible.length === 1 ? '' : 's'}</span>
                    {total > 0 && <span>Pending total <Amount value={total} currency={currency} className="font-mono tabular-nums text-gray-900 dark:text-[#ededed]" /></span>}
                </div>

                <DebtList
                    debts={visible} today={today} filtered={all.length > 0}
                    onRecord={setRepay} onEdit={(d) => setForm({ type: d.type, edit: d })} onDelete={handleDelete}
                    onAdd={() => setForm({ type: 'lent' })}
                />
            </div>

            {form && <DebtForm isOpen onClose={() => setForm(null)} editDebt={form.edit || null} type={form.type} />}
            {repay && <RepaymentModal isOpen onClose={() => setRepay(null)} debt={repay} />}
        </div>
    );
}
