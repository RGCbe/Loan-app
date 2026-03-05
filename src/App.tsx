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
    primary: 'bg-gradient-to-r from-[#00e5ff]/80 to-[#ff0055]/80 text-white border border-white/20 shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,85,0.5)]',
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
    {label && <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.3)] ml-1">{label}</label>}
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#00e5ff]/50 focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 transition-all bg-black/40 backdrop-blur-md text-white shadow-inner placeholder:text-white/20"
    />
  </div>
);

const Select = ({ label, options, ...props }: { label?: string, options: { value: string, label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.3)] ml-1">{label}</label>}
    <select
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-white/10 focus:border-[#00e5ff]/50 focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 transition-all bg-black/40 backdrop-blur-md text-white shadow-inner appearance-none cursor-pointer"
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">{opt.label}</option>)}
    </select>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'borrowers' | 'loans' | 'reports'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalGiven: 0, totalBorrowed: 0, totalCollected: 0, activeBorrowers: 0, investedCapital: 0 });
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.style.setProperty('color-scheme', 'dark');
  }, []);

  // Modal states
  const [showBorrowerModal, setShowBorrowerModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showEditLoanModal, setShowEditLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [viewingBorrowerProfile, setViewingBorrowerProfile] = useState<Borrower | null>(null);

  useEffect(() => {
    fetchStats();
    fetchBorrowers();
    fetchLoans();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchBorrowers = async () => {
    const res = await fetch('/api/borrowers');
    const data = await res.json();
    setBorrowers(data);
  };

  const fetchLoans = async () => {
    const res = await fetch('/api/loans');
    const data = await res.json();
    setLoans(data);
  };

  const fetchBorrowerLoans = async (borrowerId: number) => {
    const response = await fetch(`/api/borrowers/${borrowerId}/loans`);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    setShowBorrowerModal(false);
    fetchBorrowers();
  };

  const handleCreateLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    setShowCapitalModal(false);
    fetchStats();
  };

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00e5ff] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-[#00e5ff]/50 focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 bg-black/40 backdrop-blur-md text-white shadow-inner transition-all"
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
                <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Edit2 size={16} /></button>
                <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2.5 text-sm text-white/50">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Phone size={10} className="text-[#00e5ff]" />
                </div>
                {borrower.phone}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-white/50">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <MapPin size={10} className="text-[#00e5ff]" />
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00e5ff] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by borrower or ID..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-[#00e5ff]/50 focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 bg-black/40 backdrop-blur-md text-white shadow-inner transition-all"
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
                <td className="px-4 py-4 font-mono text-sm text-white/40">#{loan.id}</td>
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
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="text-xs p-2" onClick={() => { setSelectedLoan(loan); setShowEditLoanModal(true); }}>
                      <Edit2 size={14} />
                    </Button>
                    {loan.status === 'Active' && (
                      <Button variant="ghost" className="text-xs p-2" onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); }}>
                        Payment
                      </Button>
                    )}
                    {loan.status === 'Active' && (
                      <Button variant="ghost" className="text-xs p-2" onClick={() => handleCloseLoan(loan.id)}>
                        Close
                      </Button>
                    )}
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
            <Button variant="secondary">
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </FadeIn>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Principal", value: reportData.totalAmount, color: "#d4af37", icon: "₹", glow: "rgba(212,175,55,0.3)" },
            { label: "Interest Earned", value: reportData.totalInterest, color: "#10b981", icon: "+", glow: "rgba(16,185,129,0.3)" },
            { label: "Total Received", value: reportData.totalPaid, color: "#60a5fa", icon: "↓", glow: "rgba(96,165,250,0.3)" },
            { label: "Outstanding", value: reportData.outstanding, color: "#e11d48", icon: "!", glow: "rgba(225,29,72,0.3)" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", bounce: 0.4 } } }}
            >
              <Card className={`p-5 relative overflow-hidden`} noHover>
                {/* Ambient glow */}
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
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}>
                            {loan.direction}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/70">₹{(loan.currentPrincipal || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-emerald-400 font-medium">+₹{interest.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold text-white">₹{totalDue.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-blue-400 font-medium">-₹{paid.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`font-black text-sm ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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

  return (
    <div className="min-h-screen">
      {/* Sidebar / Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 glass-nav z-40 flex md:flex-col">
        <div className="hidden md:flex p-6 mb-4 items-center">
          <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-[#00e5ff] to-[#ff0055] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(0,229,255,0.5)]">L</div>
          <span className="ml-3 font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">LendTrack</span>
        </div>

        <div className="flex flex-1 justify-around md:flex-col md:justify-start md:px-3 gap-1 py-2 md:py-0">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'borrowers', icon: Users, label: 'Borrowers' },
            { id: 'loans', icon: HandCoins, label: 'Loans' },
            { id: 'reports', icon: FileText, label: 'Reports' }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 p-3 md:px-4 md:py-3 rounded-xl transition-all w-full overflow-hidden relative group ${activeTab === tab.id
                ? 'text-white'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border-l-2 border-[#00e5ff] shadow-[inset_10px_0_20px_rgba(0,229,255,0.1)] rounded-xl -z-10"
                />
              )}
              <tab.icon size={20} className="shrink-0" />
              <span className="text-[10px] md:text-sm font-bold uppercase md:capitalize tracking-wider md:tracking-normal truncate">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 md:pb-8 md:pl-64 min-h-screen relative z-10">
        <header className="sticky top-0 bg-black/20 backdrop-blur-xl border-b border-white/5 z-30 p-6 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-black capitalize tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-white">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold shadow-inner backdrop-blur-md">
              <Calendar size={14} className="text-[#00e5ff]" /> {new Date().toLocaleDateString()}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(255,0,85,0.2)]">
              JD
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
      <Modal
        isOpen={showBorrowerModal}
        onClose={() => setShowBorrowerModal(false)}
        title="Add New Borrower"
      >
        <form onSubmit={handleAddBorrower} className="space-y-4">
          <Input label="Full Name" name="name" required placeholder="John Doe" />
          <Input label="Phone Number" name="phone" required placeholder="+1 234 567 890" />
          <Input label="Address" name="address" placeholder="123 Street, City" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">Notes</label>
            <textarea
              name="notes"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all bg-white dark:bg-zinc-800 text-black dark:text-white min-h-[100px]"
            />
          </div>
          <Button type="submit" className="w-full py-3">Save Borrower</Button>
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

      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedLoan(null); }}
        title={`Add Payment for Loan #${selectedLoan?.id}`}
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          <input type="hidden" name="loan_id" value={selectedLoan?.id} />
          <div className="p-4 bg-black/5 rounded-2xl mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-black/50">Remaining Principal:</span>
              <span className="font-bold">₹{(selectedLoan?.currentPrincipal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-black/50">Interest Accrued:</span>
              <span className="font-bold text-emerald-600">+₹{(selectedLoan?.accruedInterest || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-black/5">
              <span className="text-black/50">Total Balance:</span>
              <span className="font-bold">₹{(selectedLoan?.balance || 0).toLocaleString()}</span>
            </div>
          </div>
          <Input label="Payment Amount (₹)" name="amount" type="number" required placeholder="200" />
          <Input label="Payment Date" name="payment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          <Input label="Notes" name="notes" placeholder="Cash payment" />
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
          <p className="text-xs text-black/40">This is the total amount of money you have available for lending.</p>
          <Button type="submit" className="w-full py-3">Update Capital</Button>
        </form>
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
              className="relative bg-[#F8F9FA] dark:bg-zinc-950 w-full max-w-2xl h-full shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#F8F9FA]/80 dark:bg-zinc-950/80 backdrop-blur-md z-10 p-6 border-b border-black/5 dark:border-white/5 flex items-center gap-4">
                <button onClick={() => setViewingBorrowerProfile(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-xl font-bold">Borrower Profile</h3>
              </div>

              <div className="p-8 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-6"
                >
                  <div className="w-24 h-24 rounded-3xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-4xl font-black">
                    {viewingBorrowerProfile.name[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black">{viewingBorrowerProfile.name}</h2>
                    <p className="text-black/40 dark:text-white/30 font-mono">Borrower ID: #{viewingBorrowerProfile.id}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="secondary" className="text-xs py-1.5"><Edit2 size={14} /> Edit</Button>
                      <Button variant="danger" className="text-xs py-1.5"><Trash2 size={14} /> Delete</Button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <Card className="p-4">
                    <p className="text-[10px] font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Phone</p>
                    <p className="font-semibold">{viewingBorrowerProfile.phone}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-[10px] font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Address</p>
                    <p className="font-semibold">{viewingBorrowerProfile.address}</p>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <HandCoins size={20} /> Loan History
                  </h4>
                  <div className="space-y-4">
                    {loans.filter(l => l.borrower_id === viewingBorrowerProfile.id).map(loan => (
                      <Card key={loan.id} className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase">Loan #{loan.id} • {loan.loan_type}</p>
                            <h5 className="text-xl font-bold">₹{(loan.amount || 0).toLocaleString()}</h5>
                            <p className="text-[10px] text-black/40 dark:text-white/30">Given: ₹{(loan.given_amount || 0).toLocaleString()}</p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${loan.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/40'}`}>
                            {loan.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                          <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <p className="text-black/40 dark:text-white/30 mb-0.5">{loan.loan_type === 'Installment' ? 'Installment' : 'Rate'}</p>
                            <p className="font-bold">{loan.loan_type === 'Installment' ? `₹${loan.installment_amount}` : `${loan.interest_rate}%`}</p>
                          </div>
                          <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <p className="text-black/40 dark:text-white/30 mb-0.5">Type</p>
                            <p className="font-bold">{loan.interest_type}</p>
                          </div>
                          <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <p className="text-black/40 dark:text-white/30 mb-0.5">Start</p>
                            <p className="font-bold">{new Date(loan.start_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="secondary" className="flex-1 text-xs" onClick={() => { setSelectedLoan(loan); setShowEditLoanModal(true); }}>
                            <Edit2 size={14} /> Edit
                          </Button>
                          {loan.status === 'Active' && (
                            <Button className="flex-1 text-xs" onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); }}>
                              Add Payment
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
