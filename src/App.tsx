/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  HandCoins,
  History,
  Plus,
  Search,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
  FileText,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Borrower, Loan, Payment, Stats } from './types';
import { FinancialVisualizer } from './components/ThreeVisuals';

// --- Components ---

const Card = ({ children, className = "", onClick, noHover = false }: { children: React.ReactNode, className?: string, key?: React.Key, onClick?: () => void, noHover?: boolean }) => {
  const hasCustomBg = className.includes('bg-');

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (noHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Smooth boundaries and calculate percentage from center (-0.5 to 0.5)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (noHover) return;
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: "1500px", transformStyle: "preserve-3d" }} className="h-full w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: noHover ? 0 : rotateX,
          rotateY: noHover ? 0 : rotateY,
          transformStyle: "preserve-3d"
        }}
        onClick={onClick}
        className={`relative rounded-2xl transition-shadow duration-300 ${!hasCustomBg ? 'glass-panel' : ''} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div
          style={{ transform: noHover ? "none" : "translateZ(40px)" }}
          className="h-full w-full flex flex-col justify-between"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const FadeIn = ({ children, delay = 0, direction = 'up' }: { children: React.ReactNode, delay?: number, direction?: 'up' | 'down' | 'left' | 'right' }) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = "",
  type = "button",
  disabled = false
}: {
  children: React.ReactNode,
  onClick?: () => void,
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  type?: "button" | "submit" | "reset",
  disabled?: boolean
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black border border-[#d4af37]/50 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]',
    secondary: 'glass-panel text-white hover:bg-white/10 hover:border-white/20',
    danger: 'bg-red-500/80 text-white backdrop-blur-md border border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-500',
    ghost: 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="label-gold ml-1">{label}</label>}
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none transition-all bg-black/40 backdrop-blur-md text-white shadow-inner placeholder:text-white/20"
    />
  </div>
);

const Select = ({ label, options, ...props }: { label?: string, options: { value: string, label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="label-gold ml-1">{label}</label>}
    <select
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none transition-all bg-black/40 backdrop-blur-md text-white shadow-inner appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">{opt.label}</option>)}
    </select>
  </div>
);

const ThreeBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[150px] animate-pulse" />
    <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-white/5 rounded-full blur-[180px]" />
  </div>
);

const AuthView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gold_token', data.token);
        window.location.reload();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#040404] relative overflow-hidden">
      <ThreeBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-gold tracking-tighter mb-2">GOLD</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Ledger Ecosystem</p>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
          <h2 className="text-2xl font-black text-white mb-6 text-center">
            {isLogin ? 'Access Vault' : 'Initialize Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Identifier" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input label="Security Key" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-white/30 hover:text-[#d4af37] transition-colors uppercase tracking-widest">
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'borrowers' | 'loans' | 'reports'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalGiven: 0, totalBorrowed: 0, totalCollected: 0, activeBorrowers: 0, investedCapital: 0 });
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Auth state
  const [user, setUser] = useState<{ id: number, username: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gold_token'));
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.style.setProperty('color-scheme', 'dark');

    if (token) {
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gold_token');
  };

  useEffect(() => {
    if (token && user) {
      fetchStats();
      fetchBorrowers();
      fetchLoans();
    }
  }, [token, user]);

  const fetchStats = async () => {
    const res = await fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setStats(data);
  };

  const fetchBorrowers = async () => {
    const res = await fetch('/api/borrowers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setBorrowers(data);
  };

  const fetchLoans = async () => {
    const res = await fetch('/api/loans', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setLoans(data);
  };

  // Modal states
  const [showBorrowerModal, setShowBorrowerModal] = useState(false);
  const [showEditBorrowerModal, setShowEditBorrowerModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showEditLoanModal, setShowEditLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [viewingBorrowerProfile, setViewingBorrowerProfile] = useState<Borrower | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loanPayments, setLoanPayments] = useState<{ [key: number]: Payment[] }>({}); // cache per loan id

  useEffect(() => {
    // This useEffect is now redundant as fetch calls are conditional on token/user
    // and triggered by the new useEffect above.
    // Keeping it for now, but it could be removed if the above useEffect covers all cases.
    // fetchStats();
    // fetchBorrowers();
    // fetchLoans();
  }, []);

  const fetchBorrowerLoans = async (borrowerId: number) => {
    const response = await fetch(`/api/borrowers/${borrowerId}/loans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setLoans(data);
  };

  const filteredBorrowers = borrowers.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery)
  );

  const filteredLoans = loans.filter(l =>
    l.borrower_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.toString().includes(searchQuery)
  );

  // --- Handlers ---

  const handleAddBorrower = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    await fetch('/api/borrowers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    setShowBorrowerModal(false);
    fetchBorrowers();
  };

  const handleEditBorrower = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBorrower) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await fetch(`/api/borrowers/${selectedBorrower.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    setShowEditBorrowerModal(false);
    setSelectedBorrower(null);
    fetchBorrowers();
    if (viewingBorrowerProfile?.id === selectedBorrower.id) {
      setViewingBorrowerProfile({ ...viewingBorrowerProfile, ...data as any });
    }
  };

  const handleDeleteBorrower = async (borrowerId: number) => {
    if (!window.confirm('Delete this borrower and ALL their loans? This cannot be undone.')) return;
    await fetch(`/api/borrowers/${borrowerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setViewingBorrowerProfile(null);
    fetchBorrowers();
    fetchLoans();
    fetchStats();
  };

  const handleDeleteLoan = async (loanId: number) => {
    if (!window.confirm('Permanently delete this loan record?')) return;
    await fetch(`/api/loans/${loanId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchLoans();
    fetchStats();
  };

  const fetchPaymentHistory = async (loanId: number) => {
    const res = await fetch(`/api/loans/${loanId}/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPaymentHistory(data);
  };

  const exportCSV = () => {
    const headers = ['Loan ID', 'Borrower', 'Direction', 'Amount', 'Given', 'Type', 'Interest Rate', 'Installment', 'Start Date', 'Status', 'Paid', 'Balance'];
    const rows = loans.map(l => [
      l.id, l.borrower_name, l.direction, l.amount, l.given_amount,
      l.loan_type, l.interest_rate, l.installment_amount || '', l.start_date,
      l.status, l.paid_amount || 0, l.balance || 0
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    await fetch('/api/loans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        amount: Number(data.amount),
        given_amount: Number(data.given_amount),
        interest_rate: Number(data.interest_rate),
        installment_amount: data.installment_amount ? Number(data.installment_amount) : null,
        duration: data.duration ? Number(data.duration) : null
      })
    });

    setShowLoanModal(false);
    fetchLoans();
    fetchStats();
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        amount: Number(data.amount)
      })
    });

    setShowPaymentModal(false);
    setSelectedLoan(null);
    fetchLoans();
    fetchStats();
    if (viewingBorrowerProfile) {
      fetchBorrowerLoans(viewingBorrowerProfile.id);
    }
  };

  const handleEditLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    await fetch(`/api/loans/${selectedLoan.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        amount: Number(data.amount),
        given_amount: Number(data.given_amount),
        interest_rate: Number(data.interest_rate),
        installment_amount: data.installment_amount ? Number(data.installment_amount) : null,
        duration: data.duration ? Number(data.duration) : null,
        status: data.status
      })
    });

    setShowEditLoanModal(false);
    setSelectedLoan(null);
    fetchLoans();
    fetchStats();
  };

  const handleCloseLoan = async (loanId: number) => {
    if (!confirm('Are you sure you want to close this loan?')) return;
    await fetch(`/api/loans/${loanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    fetchLoans();
    fetchStats();
  };

  const handleUpdateCapital = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));

    await fetch('/api/capital', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    setShowCapitalModal(false);
    fetchStats();
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('gold_token', result.token);
      } else {
        setAuthError(result.error);
      }
    } catch (err) {
      setAuthError("Server connection failed.");
    }
  };

  const AuthView = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#d4af37] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 border-white/10 shadow-2xl backdrop-blur-3xl bg-black/40">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gold mb-2">GOLD LEDGER</h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Premium Financial Ecosystem</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <Input label="Username" name="username" required placeholder="Enter username" />
            <Input label="Password" name="password" type="password" required placeholder="••••••••" />

            {authError && (
              <p className="text-rose-400 text-xs font-bold bg-rose-400/10 p-3 rounded-lg border border-rose-400/20">{authError}</p>
            )}

            <Button type="submit" className="w-full py-4 text-lg">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-white/40 hover:text-white text-xs font-bold transition-colors uppercase tracking-widest"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  // --- Views ---

  const DashboardView = () => {
    const utilization = stats.investedCapital > 0 ? (stats.totalGiven / stats.investedCapital) * 100 : 0;
    const remainingCapital = stats.investedCapital - stats.totalGiven;

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
        }}
        className="space-y-10 max-w-6xl mx-auto py-8"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.9, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.4, duration: 0.8 } } }}
          className="relative z-10"
        >
          <FinancialVisualizer lent={stats.totalGiven} borrowed={stats.totalBorrowed} capital={stats.investedCapital} />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8 px-2 sm:px-4"
        >
          {/* Card 1: Capital */}
          <motion.div whileHover={{ scale: 1.03, y: -5, rotate: -1 }} whileTap={{ scale: 0.97 }} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } } }}>
            <Card className="p-5 lg:p-8 bg-gradient-to-br from-black to-zinc-800 dark:from-white dark:to-zinc-200 text-white dark:text-black h-full flex flex-col justify-between shadow-2xl cursor-pointer" onClick={() => setShowCapitalModal(true)} noHover>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-start gap-4">
                <div className="p-3 lg:p-4 bg-white/10 dark:bg-black/10 rounded-2xl backdrop-blur-sm self-start">
                  <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div className="w-full sm:w-auto lg:w-full xl:w-auto sm:text-right lg:text-left xl:text-right">
                  <p className="text-white/60 dark:text-black/60 text-[10px] lg:text-xs font-bold uppercase tracking-widest break-words leading-tight">Total Capital</p>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black mt-1 lg:mt-2 tracking-tight truncate">₹{(stats.investedCapital || 0).toLocaleString()}</h2>
                </div>
              </div>
              <div className="mt-6 lg:mt-10 flex items-center gap-2 lg:gap-4">
                <div className="flex-1 h-3 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(utilization, 100)}%` }}
                    transition={{ duration: 1.5, type: "spring", bounce: 0.2, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold bg-white/20 dark:bg-black/20 px-2 sm:px-3 py-1 rounded-lg backdrop-blur-md whitespace-nowrap">{utilization.toFixed(1)}% Used</span>
              </div>
            </Card>
          </motion.div>

          {/* Card 2: Lent */}
          <motion.div whileHover={{ scale: 1.03, y: -5, rotate: 1 }} whileTap={{ scale: 0.97 }} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } } }}>
            <Card className="p-5 lg:p-8 h-full flex flex-col justify-between bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-indigo-100/50 dark:border-indigo-500/20 shadow-xl" noHover>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-start gap-4">
                <div className="p-3 lg:p-4 bg-white dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm border border-black/5 dark:border-white/5 self-start">
                  <HandCoins className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div className="w-full sm:w-auto lg:w-full xl:w-auto sm:text-right lg:text-left xl:text-right">
                  <p className="text-indigo-600/60 dark:text-indigo-400/60 text-[10px] lg:text-xs font-bold uppercase tracking-widest break-words leading-tight">Currently Lent</p>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black mt-1 lg:mt-2 text-indigo-900 dark:text-indigo-100 tracking-tight truncate">₹{(stats.totalGiven || 0).toLocaleString()}</h2>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 lg:mt-10"
              >
                <p className="text-xs sm:text-sm text-indigo-600/80 dark:text-indigo-400/80 font-bold bg-white/60 dark:bg-indigo-500/10 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl inline-flex items-center gap-1.5 sm:gap-2 shadow-sm border border-white/40 dark:border-indigo-500/20 flex-wrap">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" /> <span className="truncate">Available: ₹{(remainingCapital || 0).toLocaleString()}</span>
                </p>
              </motion.div>
            </Card>
          </motion.div>

          {/* Card 3: Collected */}
          <motion.div whileHover={{ scale: 1.03, y: -5, rotate: -1 }} whileTap={{ scale: 0.97 }} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5 } } }}>
            <Card className="p-5 lg:p-8 h-full flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-100/50 dark:border-emerald-500/20 shadow-xl" noHover>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-start gap-4">
                <div className="p-3 lg:p-4 bg-white dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm border border-black/5 dark:border-white/5 self-start">
                  <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div className="w-full sm:w-auto lg:w-full xl:w-auto sm:text-right lg:text-left xl:text-right">
                  <p className="text-emerald-600/60 dark:text-emerald-400/60 text-[10px] lg:text-xs font-bold uppercase tracking-widest break-words leading-tight">Total Collected</p>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black mt-1 lg:mt-2 text-emerald-900 dark:text-emerald-100 tracking-tight truncate">₹{(stats.totalCollected || 0).toLocaleString()}</h2>
                </div>
              </div>
              <div className="mt-6 lg:mt-10 flex gap-1.5 sm:gap-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + (i * 0.1), type: "spring" }}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-200/50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-300/30 dark:border-emerald-500/30 shrink-0"
                  >
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Action Buttons as giant, animated floating pills */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.6, staggerChildren: 0.15, type: "spring", bounce: 0.4 } }
          }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-16 px-4 pb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -8, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
            whileTap={{ scale: 0.95 }}
            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            onClick={() => setShowBorrowerModal(true)}
            className="w-full sm:w-auto px-8 py-5 rounded-[2rem] bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 shadow-xl flex items-center gap-5 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center group-hover:rotate-90 transition-transform duration-500 shadow-md">
              <Plus size={28} />
            </div>
            <div className="text-left pr-4">
              <p className="font-black text-xl">Add Borrower</p>
              <p className="text-sm font-medium text-black/40 dark:text-white/30">Register New Client</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
            whileTap={{ scale: 0.95 }}
            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            onClick={() => setShowLoanModal(true)}
            className="w-full sm:w-auto px-8 py-5 rounded-[2rem] bg-black dark:bg-white text-white dark:text-black border border-black/10 dark:border-white/10 shadow-xl flex items-center gap-5 group relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-black/10 to-transparent -skew-x-12"
              initial={{ x: '-100%' }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            <div className="w-14 h-14 rounded-2xl bg-white/20 dark:bg-black/20 flex items-center justify-center group-hover:-rotate-12 transition-transform duration-500 shadow-inner relative z-10">
              <HandCoins size={28} />
            </div>
            <div className="text-left pr-4 relative z-10">
              <p className="font-black text-xl">Create Loan</p>
              <p className="text-sm font-medium text-white/60 dark:text-black/60">Issue New Funds</p>
            </div>
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

  const BorrowersView = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } }
      }}
      className="space-y-6"
    >
      <FadeIn direction="down">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d4af37] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:outline-none bg-black/40 backdrop-blur-md text-white shadow-inner transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowBorrowerModal(true)} className="w-full md:w-auto">
            <Plus size={20} /> Add Borrower
          </Button>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBorrowers.map(borrower => (
          <Card key={borrower.id} className="p-5 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  {borrower.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">{borrower.name}</h4>
                  <p className="text-xs text-white/30 font-mono">ID #{borrower.id}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                  onClick={() => { setSelectedBorrower(borrower); setShowEditBorrowerModal(true); }}
                ><Edit2 size={16} /></button>
                <button
                  className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all"
                  onClick={() => handleDeleteBorrower(borrower.id)}
                ><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2.5 text-sm text-white/50">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Phone size={10} className="text-[#d4af37]" />
                </div>
                {borrower.phone}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-white/50">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <MapPin size={10} className="text-[#d4af37]" />
                </div>
                {borrower.address}
              </div>
            </div>

            <Button variant="secondary" className="w-full text-sm" onClick={() => setViewingBorrowerProfile(borrower)}>
              View Profile <ChevronRight size={16} />
            </Button>
          </Card>
        ))}
      </div>
    </motion.div>
  );

  const LoansView = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } }
      }}
      className="space-y-6"
    >
      <FadeIn direction="down">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d4af37] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by borrower or ID..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:outline-none bg-black/40 backdrop-blur-md text-white shadow-inner transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowLoanModal(true)} className="w-full md:w-auto">
            <Plus size={20} /> Create Loan
          </Button>
        </div>
      </FadeIn>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5">
              <th className="px-4 py-3.5">Loan ID</th>
              <th className="px-4 py-3.5">Borrower</th>
              <th className="px-4 py-3.5">Repay / Given</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Rate / Inst.</th>
              <th className="px-4 py-3.5">Start Date</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLoans.map((loan, idx) => (
              <motion.tr
                key={loan.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                viewport={{ once: true }}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-4 py-4">
                  <div className="font-mono text-sm text-white/40">#{loan.id}</div>
                  {/* Overdue alert */}
                  {loan.status === 'Active' && loan.duration && (() => {
                    const due = new Date(loan.start_date);
                    if (loan.interest_type === 'Monthly') due.setMonth(due.getMonth() + loan.duration);
                    else if (loan.interest_type === 'Weekly') due.setDate(due.getDate() + loan.duration * 7);
                    else due.setDate(due.getDate() + loan.duration);
                    const isOverdue = due < new Date();
                    return isOverdue ? (
                      <span className="flex items-center gap-1 text-[9px] font-black text-rose-400 mt-0.5">
                        <AlertCircle size={9} /> OVERDUE
                      </span>
                    ) : null;
                  })()}
                </td>
                <td className="px-4 py-4 font-semibold text-white">{loan.borrower_name}</td>
                <td className="px-4 py-4">
                  <div className="font-bold text-white">₹{(loan.amount || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-white/30">Given: ₹{(loan.given_amount || 0).toLocaleString()}</div>
                  <div className={`text-[9px] font-black uppercase mt-1 ${loan.direction === 'Borrowed' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {loan.direction === 'Borrowed' ? 'I Borrowed' : 'I Lent'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60">
                    {loan.loan_type}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {loan.loan_type === 'Installment' ? (
                    <div className="text-xs font-medium text-white/70">₹{loan.installment_amount}/ {loan.interest_type.replace('ly', '')}</div>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-lg text-[#d4af37]">
                      {loan.interest_rate}% {loan.interest_type}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-white/40">{new Date(loan.start_date).toLocaleDateString()}</td>
                <td className="px-4 py-4">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${loan.status === 'Active'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/30'
                    }`}>
                    {loan.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" className="text-xs p-2" onClick={() => { setSelectedLoan(loan); setShowEditLoanModal(true); }}>
                      <Edit2 size={14} />
                    </Button>
                    {loan.status === 'Active' && (
                      <Button variant="ghost" className="text-xs p-2" onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); }}>
                        Pay
                      </Button>
                    )}
                    <Button variant="ghost" className="text-xs p-2 text-blue-400 hover:text-blue-300" onClick={async () => { setSelectedLoan(loan); await fetchPaymentHistory(loan.id); setShowPaymentHistory(true); }}>
                      <History size={14} />
                    </Button>
                    {loan.status === 'Active' && (
                      <Button variant="ghost" className="text-xs p-2" onClick={() => handleCloseLoan(loan.id)}>
                        Close
                      </Button>
                    )}
                    <Button variant="ghost" className="text-xs p-2 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteLoan(loan.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const ReportsView = () => {
    const reportData = useMemo(() => {
      const lentLoans = loans.filter(l => l.direction === 'Lent');
      const totalLoans = lentLoans.length;
      const totalAmount = lentLoans.reduce((sum, l) => sum + (l.currentPrincipal || 0), 0);
      const totalPaid = lentLoans.reduce((sum, l) => sum + (l.paid_amount || 0), 0);
      const totalInterest = lentLoans.reduce((sum, l) => sum + (l.accruedInterest || 0), 0);
      const outstanding = lentLoans.reduce((sum, l) => sum + (l.balance || 0), 0);

      return { totalLoans, totalAmount, totalPaid, totalInterest, outstanding };
    }, [loans]);

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white">Financial Summary</h2>
              <p className="text-sm text-white/40 mt-1">Lent portfolio performance overview</p>
            </div>
            <Button variant="secondary" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </FadeIn>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Principal", value: reportData.totalAmount, color: "#d4af37", glow: "rgba(212,175,55,0.15)" },
            { label: "Interest Earned", value: reportData.totalInterest, color: "#f5c469", glow: "rgba(245,196,105,0.15)" },
            { label: "Total Received", value: reportData.totalPaid, color: "#e5e7eb", glow: "rgba(229,231,235,0.15)" },
            { label: "Outstanding", value: reportData.outstanding, color: "#8a8a8a", glow: "rgba(138,138,138,0.15)" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", bounce: 0.4 } } }}
            >
              <Card className={`p-5 relative overflow-hidden`} noHover>
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30 pointer-events-none" style={{ backgroundColor: stat.color }} />
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: stat.color }}>{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-white truncate">₹{(stat.value || 0).toLocaleString('en-IN')}</p>
                <div className="mt-3 h-0.5 w-full rounded-full" style={{ background: `linear-gradient(to right, ${stat.color}40, transparent)` }} />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Loan Performance Table */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="font-black text-white tracking-tight">Loan Performance Report</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full">{loans.length} Loans</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 bg-black/20">
                    <th className="px-6 py-3.5">Borrower</th>
                    <th className="px-6 py-3.5">Direction</th>
                    <th className="px-6 py-3.5">Principal (Rem.)</th>
                    <th className="px-6 py-3.5">Interest Accrued</th>
                    <th className="px-6 py-3.5">Total Due</th>
                    <th className="px-6 py-3.5">Total Paid</th>
                    <th className="px-6 py-3.5">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loans.map((loan, idx) => {
                    const interest = loan.accruedInterest || 0;
                    const totalDue = (loan.currentPrincipal || 0) + interest;
                    const paid = loan.paid_amount || 0;
                    const balance = loan.balance || 0;

                    return (
                      <motion.tr
                        key={loan.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        viewport={{ once: true }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-white">{loan.borrower_name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${loan.direction === 'Borrowed'
                            ? 'bg-black/20 border-white/10 text-white/40'
                            : 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]'
                            }`}>
                            {loan.direction === 'Borrowed' ? 'Borrowed' : 'Lent'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/70">₹{(loan.currentPrincipal || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-[#d4af37] font-medium">+₹{interest.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold text-white">₹{totalDue.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-white/40 font-medium">-₹{paid.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`font-black text-sm ${balance > 0 ? 'text-[#d4af37]' : 'text-white/30'}`}>
                            ₹{balance.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {loans.length === 0 && (
                <div className="text-center py-16 text-white/20 font-medium">No loan data available yet.</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // --- Modals ---

  const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30, rotateX: -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Modal Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00e5ff] rounded-full mix-blend-screen filter blur-[80px] opacity-40 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#ff0055] rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none" />

            <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10 bg-black/20">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 relative z-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const Layout = () => {
    const tabs = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'borrowers', icon: Users, label: 'Borrowers' },
      { id: 'loans', icon: HandCoins, label: 'Loans' },
      { id: 'reports', icon: FileText, label: 'Reports' }
    ];

    return (
      <div className="min-h-screen">
        {/* Top Navbar */}
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto md:w-64 md:h-screen glass-nav z-40 p-4 md:flex md:flex-col border-t md:border-t-0 md:border-r border-white/5">
          <div className="hidden md:block mb-10 px-4 py-8 text-center border-b border-white/5">
            <h1 className="text-3xl font-black text-gold tracking-tighter">GOLD</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Ledger Ecosystem</p>
          </div>

          <div className="flex md:flex-col gap-2 h-full">
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none relative flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-bold ${activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/10 to-transparent border-l-2 border-[#d4af37] shadow-[inset_10px_0_20px_rgba(212,175,55,0.1)] rounded-xl -z-10"
                  />
                )}
                <tab.icon size={20} className="shrink-0" />
                <span className="text-[10px] md:text-sm font-bold uppercase md:capitalize tracking-wider md:tracking-normal truncate">{tab.label}</span>
              </motion.button>
            ))}

            <div className="mt-auto hidden md:block px-4 pb-4">
              <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/30 flex items-center justify-center font-black text-[#d4af37] text-xs">
                    {user?.username?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black text-white truncate">{user?.username}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase">Enterprise Mode</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-all text-xs font-bold"
                >
                  <ChevronRight size={14} className="rotate-180" /> Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pb-24 md:pb-8 md:pl-64 min-h-screen relative z-10">
          <header className="sticky top-0 bg-black/20 backdrop-blur-xl border-b border-white/5 z-30 p-6 flex justify-between items-center shadow-lg">
            <h1 className="text-2xl font-black capitalize tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white text-gold">{activeTab}</h1>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold shadow-inner backdrop-blur-md">
                <Calendar size={14} className="text-[#d4af37]" /> {new Date().toLocaleDateString()}
              </div>
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center font-white text-gold font-black shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                {user?.username?.[0].toUpperCase() || 'U'}
              </div>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'borrowers' && <BorrowersView />}
                {activeTab === 'loans' && <LoansView />}
                {activeTab === 'reports' && <ReportsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Modals */}
        <Modal isOpen={showBorrowerModal} onClose={() => setShowBorrowerModal(false)} title="Add New Borrower">
          <form onSubmit={handleAddBorrower} className="space-y-4">
            <Input label="Full Name" name="name" required placeholder="John Doe" />
            <Input label="Phone Number" name="phone" required placeholder="+91 9876543210" />
            <Input label="Address" name="address" placeholder="123 Street, City" />
            <div className="flex flex-col gap-1.5">
              <label className="label-gold ml-1">Notes</label>
              <textarea name="notes" className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition-all bg-black/40 backdrop-blur-md text-white shadow-inner placeholder:text-white/20 min-h-[80px]" />
            </div>
            <Button type="submit" className="w-full py-3">Save Borrower</Button>
          </form>
        </Modal>

        <Modal isOpen={showEditBorrowerModal} onClose={() => { setShowEditBorrowerModal(false); setSelectedBorrower(null); }} title={`Edit — ${selectedBorrower?.name}`}>
          <form onSubmit={handleEditBorrower} className="space-y-4">
            <Input label="Full Name" name="name" required defaultValue={selectedBorrower?.name} />
            <Input label="Phone Number" name="phone" required defaultValue={selectedBorrower?.phone} />
            <Input label="Address" name="address" defaultValue={selectedBorrower?.address} />
            <div className="flex flex-col gap-1.5">
              <label className="label-gold ml-1">Notes</label>
              <textarea name="notes" defaultValue={selectedBorrower?.notes} className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition-all bg-black/40 backdrop-blur-md text-white shadow-inner placeholder:text-white/20 min-h-[80px]" />
            </div>
            <Button type="submit" className="w-full py-3">Update Borrower</Button>
          </form>
        </Modal>

        <Modal
          isOpen={showLoanModal}
          onClose={() => setShowLoanModal(false)}
          title="Create New Loan"
        >
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <Select
              label="Select Borrower"
              name="borrower_id"
              required
              options={[
                { value: '', label: 'Choose a borrower...' },
                ...borrowers.map(b => ({ value: b.id.toString(), label: b.name }))
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Loan Direction"
                name="direction"
                required
                defaultValue="Lent"
                options={[
                  { value: 'Lent', label: 'I am Lending' },
                  { value: 'Borrowed', label: 'I am Borrowing' }
                ]}
              />
              <Select
                label="Loan Type"
                name="loan_type"
                required
                defaultValue="Interest Only"
                options={[
                  { value: 'Interest Only', label: 'Interest Only' },
                  { value: 'Installment', label: 'Installment Plan' }
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Period Type"
                name="interest_type"
                required
                options={[
                  { value: 'Daily', label: 'Daily' },
                  { value: 'Weekly', label: 'Weekly' },
                  { value: 'Monthly', label: 'Monthly' }
                ]}
              />
              <Input label="Start Date" name="start_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Repayment Amount (₹)" name="amount" type="number" required placeholder="10000" />
              <Input label="Given Amount (₹)" name="given_amount" type="number" required placeholder="8000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Interest Rate (%)" name="interest_rate" type="number" step="0.1" placeholder="5.0" />
              <Input label="Installment (₹)" name="installment_amount" type="number" placeholder="100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Duration (Optional)" name="duration" type="number" placeholder="12" />
            </div>
            <p className="text-[10px] text-black/40 italic">* For Installment plans, set the fixed amount per day/week. For Interest Only, set the rate.</p>
            <Button type="submit" className="w-full py-3">Create Loan</Button>
          </form>
        </Modal>

        <Modal
          isOpen={showEditLoanModal}
          onClose={() => { setShowEditLoanModal(false); setSelectedLoan(null); }}
          title={`Edit Loan #${selectedLoan?.id}`}
        >
          <form onSubmit={handleEditLoan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Loan Direction"
                name="direction"
                required
                defaultValue={selectedLoan?.direction}
                options={[
                  { value: 'Lent', label: 'I am Lending' },
                  { value: 'Borrowed', label: 'I am Borrowing' }
                ]}
              />
              <Select
                label="Loan Type"
                name="loan_type"
                required
                defaultValue={selectedLoan?.loan_type}
                options={[
                  { value: 'Interest Only', label: 'Interest Only' },
                  { value: 'Installment', label: 'Installment Plan' }
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Period Type"
                name="interest_type"
                required
                defaultValue={selectedLoan?.interest_type}
                options={[
                  { value: 'Daily', label: 'Daily' },
                  { value: 'Weekly', label: 'Weekly' },
                  { value: 'Monthly', label: 'Monthly' }
                ]}
              />
              <Input label="Start Date" name="start_date" type="date" required defaultValue={selectedLoan?.start_date} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Repayment Amount (₹)" name="amount" type="number" required defaultValue={selectedLoan?.amount} />
              <Input label="Given Amount (₹)" name="given_amount" type="number" required defaultValue={selectedLoan?.given_amount} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Interest Rate (%)" name="interest_rate" type="number" step="0.1" defaultValue={selectedLoan?.interest_rate} />
              <Input label="Installment (₹)" name="installment_amount" type="number" defaultValue={selectedLoan?.installment_amount || ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Duration" name="duration" type="number" defaultValue={selectedLoan?.duration || ''} />
              <Select
                label="Status"
                name="status"
                required
                defaultValue={selectedLoan?.status}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Closed', label: 'Closed' }
                ]}
              />
            </div>
            <Button type="submit" className="w-full py-3">Update Loan</Button>
          </form>
        </Modal>

        {/* Payment Summary in Payment Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setSelectedLoan(null); }}
          title={`Record Payment — Loan #${selectedLoan?.id}`}
        >
          <form onSubmit={handleAddPayment} className="space-y-4">
            <input type="hidden" name="loan_id" value={selectedLoan?.id} />
            <div className="p-4 rounded-2xl border border-white/10 bg-black/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Remaining Principal:</span>
                <span className="font-bold text-white">₹{(selectedLoan?.currentPrincipal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Interest Accrued:</span>
                <span className="font-bold text-emerald-400">+₹{(selectedLoan?.accruedInterest || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-white/40">Total Balance:</span>
                <span className="font-black text-white">₹{(selectedLoan?.balance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Input label="Payment Amount (₹)" name="amount" type="number" required placeholder="500" />
            <Input label="Payment Date" name="payment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            <Input label="Notes (Optional)" name="notes" placeholder="Cash payment, transfer ref etc." />
            <Button type="submit" className="w-full py-3">Record Payment</Button>
          </form>
        </Modal>

        <Modal
          isOpen={showCapitalModal}
          onClose={() => setShowCapitalModal(false)}
          title="Update Total Capital"
        >
          <form onSubmit={handleUpdateCapital} className="space-y-4">
            <Input
              label="Total Invested Capital (₹)"
              name="amount"
              type="number"
              required
              defaultValue={stats.investedCapital}
              placeholder="500000"
            />
            <p className="text-xs text-white/30">This is the total amount of money you have available for lending.</p>
            <Button type="submit" className="w-full py-3">Update Capital</Button>
          </form>
        </Modal>

        {/* Payment History Modal */}
        <Modal
          isOpen={showPaymentHistory}
          onClose={() => { setShowPaymentHistory(false); setPaymentHistory([]); setSelectedLoan(null); }}
          title={`Payment History — Loan #${selectedLoan?.id} (${selectedLoan?.borrower_name})`}
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {paymentHistory.length === 0 ? (
              <div className="text-center py-10 text-white/30">No payments recorded yet.</div>
            ) : (
              paymentHistory.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex justify-between items-start p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div>
                    <p className="font-black text-white text-lg">₹{(p.amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-white/40 mt-0.5">{new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {p.notes && <p className="text-xs text-white/30 mt-1 italic">{p.notes}</p>}
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">Paid</span>
                </motion.div>
              ))
            )}
          </div>
          {paymentHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
              <span className="text-white/40 text-sm">Total Paid:</span>
              <span className="font-black text-white">₹{paymentHistory.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}</span>
            </div>
          )}
        </Modal>

        {/* Borrower Profile View */}
        <AnimatePresence>
          {viewingBorrowerProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingBorrowerProfile(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-black/80 backdrop-blur-2xl w-full max-w-2xl h-full shadow-2xl overflow-y-auto border-l border-white/10"
              >
                <div className="sticky top-0 bg-black/60 backdrop-blur-xl z-10 p-6 border-b border-white/10 flex items-center gap-4">
                  <button onClick={() => setViewingBorrowerProfile(null)} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                  </button>

                  {/* Quick stats */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    {(() => {
                      const bl = loans.filter(l => l.borrower_id === viewingBorrowerProfile.id);
                      const activeCount = bl.filter(l => l.status === 'Active').length;
                      const totalLent = bl.filter(l => l.direction === 'Lent').reduce((s, l) => s + (l.amount || 0), 0);
                      const totalPaid = bl.reduce((s, l) => s + (l.paid_amount || 0), 0);
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          {[{ label: 'Active Loans', val: activeCount, color: '#10b981' }, { label: 'Total Lent', val: `₹${totalLent.toLocaleString('en-IN')}`, color: '#d4af37' }, { label: 'Total Paid', val: `₹${totalPaid.toLocaleString('en-IN')}`, color: '#60a5fa' }].map(s => (
                            <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                              <p style={{ color: s.color }} className="text-xl font-black">{s.val}</p>
                              <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="font-black text-lg mb-4 flex items-center gap-2 text-white">
                      <HandCoins size={20} className="text-[#d4af37]" /> Loan History
                    </h4>
                    <div className="space-y-4">
                      {loans.filter(l => l.borrower_id === viewingBorrowerProfile.id).map(loan => (
                        <Card key={loan.id} className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-black text-white/30 uppercase tracking-widest">Loan #{loan.id} • {loan.loan_type}</p>
                              <h5 className="text-xl font-black text-white mt-1">₹{(loan.amount || 0).toLocaleString('en-IN')}</h5>
                              <p className="text-[10px] text-white/30">Given: ₹{(loan.given_amount || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${loan.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30'
                              }`}>{loan.status}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                            {[{ l: loan.loan_type === 'Installment' ? 'Installment' : 'Rate', v: loan.loan_type === 'Installment' ? `₹${loan.installment_amount}` : `${loan.interest_rate}%` }, { l: 'Type', v: loan.interest_type }, { l: 'Start', v: new Date(loan.start_date).toLocaleDateString() }].map(item => (
                              <div key={item.l} className="p-2 bg-white/5 border border-white/10 rounded-lg">
                                <p className="text-white/30 mb-0.5">{item.l}</p>
                                <p className="font-bold text-white">{item.v}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1 text-xs" onClick={() => { setSelectedLoan(loan); setShowEditLoanModal(true); }}>
                              <Edit2 size={14} /> Edit
                            </Button>
                            {loan.status === 'Active' && (
                              <Button className="flex-1 text-xs" onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); }}>
                                Add Payment
                              </Button>
                            )}
                            <Button variant="ghost" className="text-xs p-2 text-blue-400" onClick={async () => { setSelectedLoan(loan); await fetchPaymentHistory(loan.id); setShowPaymentHistory(true); }}>
                              <History size={14} />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {loans.filter(l => l.borrower_id === viewingBorrowerProfile.id).length === 0 && (
                        <div className="text-center py-10 text-white/20">No loans found for this borrower.</div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!token || !user) return <AuthView />;

  return (
    <div className="min-h-screen w-full bg-[#040404] text-white selection:bg-[#d4af37]/30">
      <ThreeBackground />
      <Layout />
    </div>
  );
}
