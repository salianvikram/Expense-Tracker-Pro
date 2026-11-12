import { useMemo, useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  Car,
  ShoppingBag,
  House,
  HeartPulse,
  GraduationCap,
  Ellipsis,
  Download,
  Menu,
  X,
  Trash2,
  Pencil,
  LogOut,
  PiggyBank,
  Loader2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ArcElement,
  BarElement,
  Legend,
} from "chart.js";

import { Line, Doughnut, Bar } from "react-chartjs-2";
import { useAuth } from "./context/AuthContext.jsx";
import api from "./api/axios.js";
import "./index.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ArcElement,
  BarElement,
  Legend
);

// ── Constants ──────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Shopping", "Housing",
  "Health", "Education", "Entertainment", "Utilities", "Other",
];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Other"];

const CATEGORY_ICONS = {
  Food: Utensils, Transport: Car, Shopping: ShoppingBag,
  Housing: House, Health: HeartPulse, Education: GraduationCap,
};

const CATEGORY_COLORS = [
  "#635bff", "#25b99a", "#f4ad54", "#e779a7",
  "#5b9de8", "#9b7be8", "#a3acbb", "#e74c3c", "#1abc9c",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

// ── Empty form state ───────────────────────────────────────────────────────
function emptyForm() {
  return {
    title: "",
    category: "Food",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
    notes: "",
  };
}

export default function App() {
  const { user, logout } = useAuth();

  // ── UI State ──────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [toast, setToast] = useState(null);

  // ── Data State ────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, savings: 0, categoryBreakdown: [], monthlyTrend: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Filters ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  // ── Toast helper ──────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Fetch data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { month: filterMonth, year: filterYear };

      const [txRes, sumRes] = await Promise.all([
        api.get("/api/transactions", { params }),
        api.get("/api/transactions/summary", { params }),
      ]);

      setTransactions(txRes.data.transactions || []);
      setSummary(sumRes.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load data. Check your connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered transactions (client-side search + type filter) ──────────
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) =>
        `${t.title} ${t.category}`.toLowerCase().includes(search.toLowerCase())
      );
  }, [transactions, filter, search]);

  // ── Chart data ────────────────────────────────────────────────────────
  const monthlyTrendChartData = useMemo(() => {
    const trend = summary.monthlyTrend || [];
    // Build last 6 months labels
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(filterYear, filterMonth - 1 - i, 1);
      months.push({ label: MONTHS[d.getMonth()].slice(0, 3), year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const incomeData = months.map(({ year, month }) => {
      const entry = trend.find((t) => t._id.year === year && t._id.month === month && t._id.type === "income");
      return entry?.total || 0;
    });
    const expenseData = months.map(({ year, month }) => {
      const entry = trend.find((t) => t._id.year === year && t._id.month === month && t._id.type === "expense");
      return entry?.total || 0;
    });

    return {
      labels: months.map((m) => m.label),
      incomeData,
      expenseData,
    };
  }, [summary.monthlyTrend, filterMonth, filterYear]);

  const lineData = {
    labels: monthlyTrendChartData.labels,
    datasets: [
      {
        label: "Income",
        data: monthlyTrendChartData.incomeData,
        fill: false,
        borderColor: "#25b99a",
        backgroundColor: "rgba(37, 185, 154, 0.1)",
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#25b99a",
      },
      {
        label: "Expenses",
        data: monthlyTrendChartData.expenseData,
        fill: true,
        borderColor: "#635bff",
        backgroundColor: "rgba(99, 91, 255, 0.08)",
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#635bff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (item) => ` ${item.dataset.label}: ${currency(item.raw)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8991a5" } },
      y: {
        beginAtZero: true,
        grid: { color: "#edf0f5" },
        border: { display: false },
        ticks: { color: "#8991a5", callback: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
      },
    },
  };

  const categoryBreakdown = summary.categoryBreakdown || [];
  const doughnutData = {
    labels: categoryBreakdown.map((c) => c._id),
    datasets: [{
      data: categoryBreakdown.map((c) => c.total),
      backgroundColor: CATEGORY_COLORS,
      borderWidth: 0,
      hoverOffset: 5,
    }],
  };

  // ── Bar chart (income vs expense by month) ────────────────────────────
  const barData = {
    labels: monthlyTrendChartData.labels,
    datasets: [
      {
        label: "Income",
        data: monthlyTrendChartData.incomeData,
        backgroundColor: "rgba(37, 185, 154, 0.75)",
        borderRadius: 5,
      },
      {
        label: "Expenses",
        data: monthlyTrendChartData.expenseData,
        backgroundColor: "rgba(99, 91, 255, 0.75)",
        borderRadius: 5,
      },
    ],
  };

  // ── Form helpers ──────────────────────────────────────────────────────
  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEditModal(t) {
    setEditingId(t._id);
    setForm({
      title: t.title,
      category: t.category,
      amount: String(t.amount),
      date: new Date(t.date).toISOString().slice(0, 10),
      type: t.type,
      notes: t.notes || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !isFinite(amount) || amount <= 0) {
      showToast("Enter a description and an amount greater than zero.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, amount };
      if (editingId) {
        const { data } = await api.put(`/api/transactions/${editingId}`, payload);
        setTransactions((prev) =>
          prev.map((t) => (t._id === editingId ? data.transaction : t))
        );
        showToast("Transaction updated successfully!");
      } else {
        const { data } = await api.post("/api/transactions", payload);
        setTransactions((prev) => [data.transaction, ...prev]);
        showToast("Transaction added successfully!");
      }
      // Refresh summary
      const params = { month: filterMonth, year: filterYear };
      const sumRes = await api.get("/api/transactions/summary", { params });
      setSummary(sumRes.data);
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save transaction.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTransaction(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      const params = { month: filterMonth, year: filterYear };
      const sumRes = await api.get("/api/transactions/summary", { params });
      setSummary(sumRes.data);
      showToast("Transaction deleted.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete transaction.", "error");
    }
  }

  function exportCSV() {
    const rows = [
      ["Description", "Category", "Date", "Type", "Amount"],
      ...filteredTransactions.map((t) => [
        t.title, t.category,
        new Date(t.date).toLocaleDateString("en-IN"),
        t.type, t.amount,
      ]),
    ];
    const csv = rows.map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-tracker-${filterYear}-${filterMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const userInitials = initials(user?.name || "U");
  const currentMonthLabel = `${MONTHS[filterMonth - 1]} ${filterYear}`;

  // ── Years available for filter ─────────────────────────────────────────
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="app-shell">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "error" ? <AlertTriangle size={15} /> : <TrendingUp size={15} />}
          {toast.message}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Wallet size={23} /></div>
          <span>expense<span className="brand-accent">pro</span></span>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav-links">
          <a
            className={`nav-link ${activeNav === "dashboard" ? "active" : ""}`}
            href="#dashboard"
            onClick={() => { setActiveNav("dashboard"); setSidebarOpen(false); }}
          >
            <LayoutDashboard size={19} /> Dashboard
          </a>
          <a
            className={`nav-link ${activeNav === "transactions" ? "active" : ""}`}
            href="#transactions"
            onClick={() => { setActiveNav("transactions"); setSidebarOpen(false); }}
          >
            <ArrowLeftRight size={19} /> Transactions
          </a>
          <a
            className={`nav-link ${activeNav === "analytics" ? "active" : ""}`}
            href="#analytics"
            onClick={() => { setActiveNav("analytics"); setSidebarOpen(false); }}
          >
            <ChartNoAxesCombined size={19} /> Analytics
          </a>
          <a className="nav-link" href="#budgets">
            <Wallet size={19} /> Budgets
            <span className="nav-soon">Soon</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><ChartNoAxesCombined size={20} /></div>
            <strong>Take control of your money.</strong>
            <p>Small steps today. Better finances tomorrow.</p>
          </div>

          <a className="nav-link" href="#settings">
            <Settings size={19} /> Settings
          </a>

          <div className="profile">
            <div className="avatar">{userInitials}</div>
            <div className="profile-info">
              <strong>{user?.name || "Your account"}</strong>
              <span>{user?.email || "Personal workspace"}</span>
            </div>
            <button className="logout-button" onClick={logout} aria-label="Logout" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <main className="main-area" id="dashboard">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>Dashboard</strong>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Month / Year filter */}
            <div className="period-filter">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                aria-label="Filter month"
                className="period-select"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m.slice(0, 3)}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                aria-label="Filter year"
                className="period-select"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>

            <div className="avatar top-avatar">{userInitials}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Error banner */}
          {error && (
            <div className="error-banner">
              <AlertTriangle size={16} />
              {error}
              <button onClick={fetchData} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Welcome row */}
          <section className="welcome-row">
            <div>
              <div className="eyebrow">YOUR FINANCIAL OVERVIEW</div>
              <h1>Good things start with <span>clarity.</span></h1>
              <p className="subtitle">Here's how your money looks for <strong>{currentMonthLabel}</strong>.</p>
            </div>
            <button className="primary-button" onClick={openAddModal}>
              <Plus size={18} /> Add transaction
            </button>
          </section>

          {/* Summary cards */}
          <section className="summary-grid">
            {/* Balance */}
            <article className="summary-card balance-card">
              <div className="card-top">
                <span>Total balance</span>
                <span className="metric-icon purple"><Wallet size={19} /></span>
              </div>
              {loading
                ? <div className="skeleton skeleton-value" />
                : <div className="metric-value">{currency(summary.balance)}</div>
              }
              <div className="metric-foot">
                <span className={`trend ${summary.balance >= 0 ? "positive" : "negative"}`}>
                  <ArrowUpRight size={15} /> {summary.balance >= 0 ? "Surplus" : "Deficit"}
                </span>
                <span>Income − expenses</span>
              </div>
              <div className="balance-decoration" />
            </article>

            {/* Income */}
            <article className="summary-card">
              <div className="card-top">
                <span>Total income</span>
                <span className="metric-icon green"><ArrowDownRight size={19} /></span>
              </div>
              {loading
                ? <div className="skeleton skeleton-value" />
                : <div className="metric-value">{currency(summary.income)}</div>
              }
              <div className="metric-foot">
                <span className="trend positive">↗ Money in</span>
                <span>All recorded income</span>
              </div>
            </article>

            {/* Expenses */}
            <article className="summary-card">
              <div className="card-top">
                <span>Total expenses</span>
                <span className="metric-icon orange"><ArrowUpRight size={19} /></span>
              </div>
              {loading
                ? <div className="skeleton skeleton-value" />
                : <div className="metric-value">{currency(summary.expenses)}</div>
              }
              <div className="metric-foot">
                <span className="trend negative">↗ Money out</span>
                <span>All recorded expenses</span>
              </div>
            </article>

            {/* Savings */}
            <article className="summary-card savings-card">
              <div className="card-top">
                <span>Net savings</span>
                <span className="metric-icon teal"><PiggyBank size={19} /></span>
              </div>
              {loading
                ? <div className="skeleton skeleton-value" />
                : <div className="metric-value">{currency(Math.max(0, summary.savings))}</div>
              }
              <div className="metric-foot">
                <span className="trend positive">
                  {summary.income > 0
                    ? `${Math.round((Math.max(0, summary.savings) / summary.income) * 100)}% saved`
                    : "No income yet"}
                </span>
                <span>This period</span>
              </div>
            </article>
          </section>

          {/* Charts */}
          <section className="charts-grid" id="analytics">
            {/* Line chart */}
            <article className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h2>Income vs Expenses</h2>
                  <p>6-month trend overview</p>
                </div>
                <div className="chart-legend-row">
                  <span><i className="legend-dot" style={{ background: "#25b99a" }} /> Income</span>
                  <span><i className="legend-dot purple-dot" /> Expenses</span>
                </div>
              </div>
              <div className="line-chart-wrap">
                {loading
                  ? <div className="chart-skeleton" />
                  : <Line data={lineData} options={chartOptions} />
                }
              </div>
            </article>

            {/* Doughnut chart */}
            <article className="panel category-panel">
              <div className="panel-heading">
                <div>
                  <h2>Spending by category</h2>
                  <p>Where your money goes</p>
                </div>
              </div>
              <div className="donut-wrap">
                {loading
                  ? <div className="chart-skeleton donut-skeleton" />
                  : (
                    <>
                      <Doughnut
                        data={doughnutData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: "74%",
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: { label: (item) => ` ${item.label}: ${currency(item.raw)}` },
                            },
                          },
                        }}
                      />
                      <div className="donut-center">
                        <strong>{currency(summary.expenses)}</strong>
                        <span>Total spent</span>
                      </div>
                    </>
                  )
                }
              </div>
              <div className="category-legend">
                {categoryBreakdown.slice(0, 5).map((cat, i) => (
                  <div className="legend-row" key={cat._id}>
                    <span className="legend-name">
                      <i className="legend-dot" style={{ background: CATEGORY_COLORS[i] }} />
                      {cat._id}
                    </span>
                    <strong>{currency(cat.total)}</strong>
                  </div>
                ))}
                {categoryBreakdown.length === 0 && !loading && (
                  <p className="empty-note">Add expenses to see your breakdown.</p>
                )}
              </div>
            </article>
          </section>

          {/* Bar chart — full width */}
          <section className="panel bar-panel" id="analytics-bar">
            <div className="panel-heading">
              <div>
                <h2>Monthly comparison</h2>
                <p>Income vs expenses — last 6 months</p>
              </div>
              <div className="chart-legend-row">
                <span><i className="legend-dot" style={{ background: "rgba(37,185,154,0.75)" }} /> Income</span>
                <span><i className="legend-dot purple-dot" style={{ background: "rgba(99,91,255,0.75)" }} /> Expenses</span>
              </div>
            </div>
            <div className="bar-chart-wrap">
              {loading
                ? <div className="chart-skeleton" />
                : <Bar data={barData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
              }
            </div>
          </section>

          {/* Transactions panel */}
          <section className="panel transactions-panel" id="transactions">
            <div className="panel-heading transactions-heading">
              <div>
                <h2>Transactions — {currentMonthLabel}</h2>
                <p>Keep an eye on where your money goes</p>
              </div>
              <button className="text-button" onClick={openAddModal}>
                <Plus size={16} /> Add new
              </button>
            </div>

            <div className="transaction-tools">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  aria-label="Search transactions"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter transactions"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>

              <button className="export-button" onClick={exportCSV}>
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="table-wrap">
              {loading ? (
                <div className="table-loading">
                  <Loader2 size={22} className="spin" />
                  <span>Loading transactions…</span>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>TRANSACTION</th>
                      <th>CATEGORY</th>
                      <th>DATE</th>
                      <th>AMOUNT</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => {
                      const Icon = CATEGORY_ICONS[t.category] || Wallet;
                      return (
                        <tr key={t._id}>
                          <td>
                            <div className="transaction-name">
                              <span className={`transaction-icon ${t.type}`}>
                                <Icon size={17} />
                              </span>
                              <div>
                                <strong>{t.title}</strong>
                                {t.notes && <div className="tx-notes">{t.notes}</div>}
                              </div>
                            </div>
                          </td>
                          <td><span className="category-pill">{t.category}</span></td>
                          <td className="date-cell">
                            {new Date(t.date).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </td>
                          <td className={t.type === "income" ? "amount-income" : "amount-expense"}>
                            {t.type === "income" ? "+" : "−"}{currency(t.amount)}
                          </td>
                          <td>
                            <div className="tx-actions">
                              <button
                                className="edit-button"
                                onClick={() => openEditModal(t)}
                                aria-label={`Edit ${t.title}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => deleteTransaction(t._id, t.title)}
                                aria-label={`Delete ${t.title}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="empty-table">
                          {search
                            ? `No results for "${search}"`
                            : `No transactions for ${currentMonthLabel}. Add your first one!`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-footer">
              <span>Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}</span>
              <span>✅ Connected to MongoDB Atlas</span>
            </div>
          </section>

          <footer className="page-footer">
            <span>© 2026 Expense Tracker Pro</span>
            <span>Built for better financial habits.</span>
          </footer>
        </div>
      </main>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal">
            <div className="modal-heading">
              <div>
                <h2>{editingId ? "Edit transaction" : "Add transaction"}</h2>
                <p>{editingId ? "Update the details below." : "Record income or an expense."}</p>
              </div>
              <button className="icon-button" onClick={closeModal} aria-label="Close">
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Transaction type
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? "Salary" : "Food" })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label>
                Description
                <input
                  required
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Grocery shopping"
                />
              </label>

              <label>
                Amount (INR)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <label>
                Notes (optional)
                <input
                  maxLength={200}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional details…"
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting
                    ? <Loader2 size={16} className="spin" />
                    : <><Plus size={17} /> {editingId ? "Update" : "Save transaction"}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
