'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getAdminPlans,
  getAdminStudents,
  getBackups,
  getDues,
  getExpenses,
  getFinanceSummary,
  getNotices,
  getStaffPayouts,
  getSupportTickets,
  runBackup,
} from '@/lib/api';
import { BackupRow, DueRow, ExpenseRow, FinanceSummary, NoticeRow, PlanRow, StaffPayoutRow, StudentRow, TicketRow } from '@/lib/types';

type TabId = 'students' | 'plans' | 'finance' | 'expenses' | 'payouts' | 'dues' | 'notices' | 'tickets' | 'backups';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'students', label: 'Students' },
  { id: 'plans', label: 'Subscription Plans' },
  { id: 'finance', label: 'Accounts & Finance' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'payouts', label: 'Staff Payouts' },
  { id: 'dues', label: 'Dues & Alerts' },
  { id: 'notices', label: 'Notices' },
  { id: 'tickets', label: 'Support Tickets' },
  { id: 'backups', label: 'Backups' },
];

function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

export default function AdminConsole() {
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('finance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [payouts, setPayouts] = useState<StaffPayoutRow[]>([]);
  const [dues, setDues] = useState<DueRow[]>([]);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [backups, setBackups] = useState<BackupRow[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem('campusway-token') || '';
    setToken(stored);
  }, []);

  const kpis = useMemo(() => ([
    { label: 'Income', value: finance ? `${finance.totalIncome.toFixed(2)}` : '-' },
    { label: 'Expense', value: finance ? `${finance.totalExpenses.toFixed(2)}` : '-' },
    { label: 'Net', value: finance ? `${finance.netProfit.toFixed(2)}` : '-' },
    { label: 'Due Students', value: `${dues.length}` },
  ]), [finance, dues.length]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    const applySafely = <T,>(fn: () => Promise<T>) =>
      fn().catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data.');
        return null;
      });

    (async () => {
      await Promise.all([
        applySafely(async () => {
          const res = await getAdminStudents(token);
          if (!cancelled) setStudents(res.items || []);
        }),
        applySafely(async () => {
          const res = await getAdminPlans(token);
          if (!cancelled) setPlans(res.items || []);
        }),
        applySafely(async () => {
          const res = await getFinanceSummary(token);
          if (!cancelled) setFinance(res);
        }),
        applySafely(async () => {
          const res = await getExpenses(token);
          if (!cancelled) setExpenses(res.items || []);
        }),
        applySafely(async () => {
          const res = await getStaffPayouts(token);
          if (!cancelled) setPayouts(res.items || []);
        }),
        applySafely(async () => {
          const res = await getDues(token);
          if (!cancelled) setDues(res.items || []);
        }),
        applySafely(async () => {
          const res = await getNotices(token);
          if (!cancelled) setNotices(res.items || []);
        }),
        applySafely(async () => {
          const res = await getSupportTickets(token);
          if (!cancelled) setTickets(res.items || []);
        }),
        applySafely(async () => {
          const res = await getBackups(token);
          if (!cancelled) setBackups(res.items || []);
        }),
      ]);

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleRunBackup() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await runBackup(token, 'incremental', 'local');
      const list = await getBackups(token);
      setBackups(list.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run backup.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Admin Token Required</h2>
        <p>Login via legacy app first, then reload this page.</p>
        <p style={{ opacity: 0.8 }}>Expected token key: <code>campusway-token</code></p>
      </section>
    );
  }

  return (
    <section className="grid" style={{ gap: '1rem' }}>
      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: '0.4rem' }}>Admin Dashboard (Next Hybrid)</h1>
        <p style={{ marginTop: 0, opacity: 0.85 }}>Manual subscriptions/payments, finance analytics, support, and backups.</p>
        <div className="grid grid-3">
          {kpis.map((item) => (
            <article className="card" key={item.label}>
              <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.8 }}>{item.label}</p>
              <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.25rem' }}>{item.value}</h2>
            </article>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="btn"
            style={{
              background: tab.id === activeTab
                ? 'linear-gradient(120deg, #2e8ef7, #00b1d9)'
                : 'linear-gradient(120deg, rgba(58,95,165,.6), rgba(17,40,91,.6))',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="card" style={{ borderColor: 'rgba(255,102,102,.5)' }}>{error}</div>}
      {loading && <div className="card">Loading...</div>}

      {!loading && activeTab === 'students' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Students</h3>
          <div className="grid">
            {students.slice(0, 20).map((row) => (
              <article key={row._id} className="card">
                <strong>{row.full_name || row.username || 'Unnamed student'}</strong>
                <p style={{ margin: '0.35rem 0', opacity: 0.82 }}>{row.email || 'No email'}</p>
                <span className="pill">{row.subscription?.planCode || 'No plan'}</span>
                <span className="pill" style={{ marginLeft: '0.5rem' }}>{row.status || 'active'}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'plans' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Subscription Plans</h3>
          <div className="grid grid-2">
            {plans.map((plan) => (
              <article key={plan._id} className="card">
                <strong>{plan.name}</strong>
                <p style={{ margin: '0.4rem 0', opacity: 0.82 }}>{plan.code.toUpperCase()}</p>
                <p style={{ margin: 0 }}>Price: {plan.price ?? 0}</p>
                <p style={{ margin: '0.35rem 0 0' }}>
                  Duration: {plan.durationValue || plan.durationDays} {plan.durationUnit || 'days'}
                </p>
                <span className="pill" style={{ marginTop: '0.5rem' }}>{plan.isActive ? 'Active' : 'Inactive'}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'finance' && finance && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Accounts & Finance Summary</h3>
          <div className="grid grid-2">
            <article className="card">
              <p>Total Income</p>
              <h2>{finance.totalIncome.toFixed(2)}</h2>
            </article>
            <article className="card">
              <p>Total Expenses</p>
              <h2>{finance.totalExpenses.toFixed(2)}</h2>
            </article>
            <article className="card">
              <p>Direct Expenses</p>
              <h2>{finance.directExpenses.toFixed(2)}</h2>
            </article>
            <article className="card">
              <p>Salary Payouts</p>
              <h2>{finance.salaryPayouts.toFixed(2)}</h2>
            </article>
          </div>
        </section>
      )}

      {!loading && activeTab === 'expenses' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Expense Ledger</h3>
          <div className="grid">
            {expenses.map((row) => (
              <article key={row._id} className="card">
                <strong>{row.category}</strong>
                <p style={{ margin: '0.35rem 0' }}>Amount: {row.amount}</p>
                <p style={{ margin: 0, opacity: 0.8 }}>Date: {formatDate(row.date)}</p>
                <p style={{ margin: '0.35rem 0 0', opacity: 0.8 }}>Vendor: {row.vendor || 'N/A'}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'payouts' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Staff Payouts</h3>
          <div className="grid">
            {payouts.map((row) => (
              <article key={row._id} className="card">
                <strong>{row.role}</strong>
                <p style={{ margin: '0.35rem 0' }}>Amount: {row.amount}</p>
                <p style={{ margin: 0, opacity: 0.8 }}>Period: {row.periodMonth}</p>
                <p style={{ margin: '0.35rem 0 0', opacity: 0.8 }}>Paid At: {formatDate(row.paidAt)}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'dues' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Dues & Alerts</h3>
          <div className="grid">
            {dues.map((row) => (
              <article key={row._id} className="card">
                <strong>{row.studentId?.username || row.studentId?.email || 'Student'}</strong>
                <p style={{ margin: '0.35rem 0' }}>Net Due: {row.netDue}</p>
                <p style={{ margin: 0, opacity: 0.8 }}>Computed: {row.computedDue}</p>
                <p style={{ margin: '0.35rem 0 0', opacity: 0.8 }}>
                  Adjustment: {row.manualAdjustment} | Waiver: {row.waiverAmount}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'notices' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Notices</h3>
          <div className="grid">
            {notices.map((row) => (
              <article key={row._id} className="card">
                <strong>{row.title}</strong>
                <p style={{ margin: '0.35rem 0' }}>{row.message}</p>
                <span className="pill">{row.isActive ? 'Active' : 'Inactive'}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'tickets' && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Support Tickets</h3>
          <div className="grid">
            {tickets.map((row) => (
              <article key={row._id} className="card">
                <strong>{row.ticketNo}</strong>
                <p style={{ margin: '0.35rem 0' }}>{row.subject}</p>
                <span className="pill">{row.status}</span>
                <span className="pill" style={{ marginLeft: '0.5rem' }}>{row.priority}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && activeTab === 'backups' && (
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Backups</h3>
            <button className="btn" onClick={handleRunBackup}>Run Incremental Backup</button>
          </div>
          <div className="grid" style={{ marginTop: '0.8rem' }}>
            {backups.map((row) => (
              <article key={row._id} className="card">
                <strong>{row.type.toUpperCase()} / {row.storage}</strong>
                <p style={{ margin: '0.35rem 0' }}>Status: {row.status}</p>
                <p style={{ margin: 0, opacity: 0.8 }}>Created: {formatDate(row.createdAt)}</p>
                <p style={{ margin: '0.35rem 0 0', opacity: 0.8 }}>
                  {row.localPath ? `Local: ${row.localPath}` : row.s3Key ? `S3: ${row.s3Key}` : 'Path pending'}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
