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
import { motion, AnimatePresence } from 'motion/react';
import { Borrower, Loan, Payment, Stats } from './types';
import { FinancialVisualizer } from './components/ThreeVisuals';

// --- Components ---

const Card = ({ children, className = "", onClick, noHover = false }: { children: React.ReactNode, className?: string, key?: React.Key, onClick?: () => void, noHover?: boolean }) => {
  const hasCustomBg = className.includes('bg-');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      whileHover={noHover ? {} : { y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden ${!hasCustomBg ? 'bg-white dark:bg-zinc-900' : ''} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </motion.div>
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
    primary: 'bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90',
    secondary: 'bg-white dark:bg-zinc-800 text-black dark:text-white border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">{label}</label>}
    <input 
      {...props}
      className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all bg-white dark:bg-zinc-800 text-black dark:text-white"
    />
  </div>
);

const Select = ({ label, options, ...props }: { label?: string, options: { value: string, label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">{label}</label>}
    <select 
      {...props}
      className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all bg-white dark:bg-zinc-800 text-black dark:text-white appearance-none"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.setProperty('color-scheme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('color-scheme', 'light');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);
  
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
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="space-y-6"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <FinancialVisualizer lent={stats.totalGiven} borrowed={stats.totalBorrowed} capital={stats.investedCapital} />
        </motion.div>
        
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="p-6 bg-black dark:bg-white text-white dark:text-black relative group cursor-pointer" onClick={() => setShowCapitalModal(true)}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/60 dark:text-black/60 text-[10px] font-bold uppercase tracking-widest">Total Capital</p>
                <h2 className="text-2xl font-black mt-1">₹{(stats.investedCapital || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-white/10 dark:bg-black/10 rounded-lg group-hover:bg-white/20 dark:group-hover:bg-black/20 transition-colors">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(utilization, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-emerald-400" 
                />
              </div>
              <span className="text-[10px] font-bold">{utilization.toFixed(1)}% Used</span>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={12} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black/50 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">Currently Lent</p>
                <h2 className="text-2xl font-bold mt-1">₹{(stats.totalGiven || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                <HandCoins size={20} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-black/40 dark:text-white/30 font-medium">Available: ₹{(remainingCapital || 0).toLocaleString()}</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black/50 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">Total Collected</p>
                <h2 className="text-2xl font-bold mt-1">₹{(stats.totalCollected || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-400 dark:text-red-300 text-[10px] font-bold uppercase tracking-widest">My Borrowings</p>
                <h2 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">₹{(stats.totalBorrowed || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                <AlertCircle size={20} className="text-red-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Recent Transactions</h3>
              <Button variant="ghost" className="text-sm" onClick={() => setActiveTab('loans')}>View All</Button>
            </div>
            <div className="space-y-4">
              {loans.slice(0, 5).map((loan, idx) => (
                <motion.div 
                  key={loan.id} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer" 
                  onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${loan.direction === 'Borrowed' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40'}`}>
                      {loan.borrower_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{loan.borrower_name}</p>
                      <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">
                        {loan.direction === 'Borrowed' ? 'I Borrowed' : 'I Lent'} • {loan.interest_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${loan.direction === 'Borrowed' ? 'text-red-600 dark:text-red-400' : ''}`}>₹{(loan.amount || 0).toLocaleString()}</p>
                    <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${loan.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/40'}`}>
                      {loan.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBorrowerModal(true)}
                className="p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex flex-col gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="font-bold">Add Borrower</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Register a new client</p>
                </div>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLoanModal(true)}
                className="p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex flex-col gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <HandCoins size={20} />
                </div>
                <div>
                  <p className="font-bold">Create Loan</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Issue a new loan</p>
                </div>
              </motion.button>
            </div>
          </Card>
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
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-900 text-black dark:text-white"
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
          <Card key={borrower.id} className="p-5 hover:border-black/20 dark:hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-xl font-bold text-black/30 dark:text-white/20">
                  {borrower.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{borrower.name}</h4>
                  <p className="text-xs text-black/40 dark:text-white/30">ID: #{borrower.id}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-black/50 dark:text-white/40"><Edit2 size={16} /></button>
                <button className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/50">
                <Phone size={14} /> {borrower.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/50">
                <MapPin size={14} /> {borrower.address}
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
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Search by borrower or ID..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-900 text-black dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowLoanModal(true)} className="w-full md:w-auto">
            <Plus size={20} /> Create Loan
          </Button>
        </div>
      </FadeIn>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/30">
              <th className="px-4 py-2">Loan ID</th>
              <th className="px-4 py-2">Borrower</th>
              <th className="px-4 py-2">Repay/Given</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Interest/Inst.</th>
              <th className="px-4 py-2">Start Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map((loan, idx) => (
              <motion.tr 
                key={loan.id} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-zinc-900 group"
              >
                <td className="px-4 py-4 rounded-l-2xl border-y border-l border-black/5 dark:border-white/5 font-mono text-sm">#{loan.id}</td>
                <td className="px-4 py-4 border-y border-black/5 dark:border-white/5 font-semibold">{loan.borrower_name}</td>
                <td className="px-4 py-4 border-y border-black/5 dark:border-white/5">
                  <div className="font-bold">₹{(loan.amount || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-black/40 dark:text-white/30">Given: ₹{(loan.given_amount || 0).toLocaleString()}</div>
                  <div className={`text-[9px] font-black uppercase mt-1 ${loan.direction === 'Borrowed' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                    {loan.direction === 'Borrowed' ? 'I Borrowed' : 'I Lent'}
                  </div>
                </td>
                <td className="px-4 py-4 border-y border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg">
                    {loan.loan_type}
                  </span>
                </td>
                <td className="px-4 py-4 border-y border-black/5 dark:border-white/5">
                  {loan.loan_type === 'Installment' ? (
                    <div className="text-xs font-medium">₹{loan.installment_amount}/ {loan.interest_type.replace('ly', '')}</div>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg">
                      {loan.interest_rate}% {loan.interest_type}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 border-y border-black/5 dark:border-white/5 text-sm text-black/50 dark:text-white/40">{new Date(loan.start_date).toLocaleDateString()}</td>
                <td className="px-4 py-4 border-y border-black/5 dark:border-white/5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${loan.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/40'}`}>
                    {loan.status}
                  </span>
                </td>
                <td className="px-4 py-4 rounded-r-2xl border-y border-r border-black/5 dark:border-white/5 text-right">
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
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="space-y-6"
      >
        <FadeIn direction="down">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Financial Summary (Lent)</h2>
            <Button variant="secondary">
              <Download size={18} /> Export CSV
            </Button>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Total Principal</p>
            <p className="text-2xl font-bold">₹{(reportData.totalAmount || 0).toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Total Interest</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{(reportData.totalInterest || 0).toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Total Received</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{(reportData.totalPaid || 0).toLocaleString()}</p>
          </Card>
          <Card className="p-5 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20">
            <p className="text-xs font-bold text-red-400 dark:text-red-300 uppercase tracking-widest mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{(reportData.outstanding || 0).toLocaleString()}</p>
          </Card>
        </div>

        <Card className="overflow-hidden" noHover>
          <div className="p-6 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
            <h3 className="font-bold">Loan Performance Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/30">
                <tr>
                  <th className="px-6 py-3">Borrower</th>
                  <th className="px-6 py-3">Direction</th>
                  <th className="px-6 py-3">Principal (Rem.)</th>
                  <th className="px-6 py-3">Interest Accrued</th>
                  <th className="px-6 py-3">Total Due</th>
                  <th className="px-6 py-3">Total Paid</th>
                  <th className="px-6 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
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
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold">{loan.borrower_name}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${loan.direction === 'Borrowed' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/40'}`}>
                          {loan.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4">₹{(loan.currentPrincipal || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">+₹{interest.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold">₹{totalDue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-600 dark:text-blue-400">-₹{paid.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">₹{balance.toLocaleString()}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
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
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 lg:w-64 bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-r border-black/5 dark:border-white/5 z-40 flex md:flex-col">
        <div className="hidden md:flex p-6 mb-4">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl">L</div>
          <span className="hidden lg:block ml-3 font-black text-xl tracking-tight">LendTrack</span>
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
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-3 md:px-4 md:py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] md:text-sm font-bold uppercase md:capitalize tracking-wider md:tracking-normal">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 md:pb-8 md:pl-20 lg:pl-64 min-h-screen">
        <header className="sticky top-0 bg-[#F8F9FA]/80 dark:bg-zinc-950/80 backdrop-blur-md z-30 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-black capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2.5 rounded-full bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer z-50"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-zinc-600" />}
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full border border-black/5 dark:border-white/5 text-xs font-bold">
              <Calendar size={14} /> {new Date().toLocaleDateString()}
            </div>
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center font-bold">
              JD
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
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
