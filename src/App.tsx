/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { offlineFetch, flushQueue, getQueue } from './offline';
import {
  Wifi,
  WifiOff,
  LayoutDashboard,
  Users, 
  HandCoins, 
  History, 
  Plus, 
  Search, 
  ChevronRight,
  ChevronLeft,
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
  Moon,
  Settings,
  ShieldCheck,
  Cloud,
  Sparkles,
  ExternalLink,
  Lock,
  Smartphone,
  UsersRound,
  Gavel,
  Coins,
  CircleDollarSign,
  LogOut,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Borrower, Loan, Payment, Stats, User, ActivityLog, ChitGroup, ChitMember, ChitAuction, ChitPayment } from './types';
const ThreeVisuals = lazy(() => import('./components/ThreeVisuals').then(m => ({ default: m.FinancialVisualizer })));
const LoginBg = lazy(() => import('./components/ThreeVisuals').then(m => ({ default: m.LoginVisualizer })));

const AdComponent = ({ isPremium, onUpgrade }: { isPremium: boolean, onUpgrade: () => void }) => {
  if (isPremium) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 relative overflow-hidden group mb-6">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sponsored</p>
            <h4 className="font-bold text-sm">Upgrade to Premium for No Ads</h4>
            <p className="text-xs text-black/40 dark:text-white/30">Get exclusive features and secure cloud backups.</p>
          </div>
        </div>
        <Button variant="primary" className="text-xs py-1.5 px-3" onClick={onUpgrade}>Upgrade Now</Button>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
    </Card>
  );
};

const PricingModal = ({ isOpen, onClose, onUpgrade }: { isOpen: boolean, onClose: () => void, onUpgrade: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
        >
          <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="text-indigo-500" />
                Upgrade to Premium
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40 mt-1">Unlock all features</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-4">
            <div className="text-center mb-4">
              <span className="text-4xl font-black">$100</span>
              <span className="text-sm text-black/40 dark:text-white/30"> one-time</span>
            </div>
            <ul className="text-sm text-black/70 dark:text-white/60 space-y-3">
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-green-500" /> No Advertisements</li>
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-green-500" /> Cloud Backups</li>
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-green-500" /> Priority Support</li>
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-green-500" /> All Features Unlocked</li>
            </ul>
            <Button onClick={onUpgrade} className="w-full py-3 mt-4">Buy Now</Button>
            <p className="text-[10px] text-center text-black/30 dark:text-white/20">Secure payment via Google Play / App Store</p>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Components ---

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const Card = ({ children, className = "", onClick, noHover = false, glass = false }: { children: React.ReactNode, className?: string, key?: React.Key, onClick?: () => void, noHover?: boolean, glass?: boolean }) => {
  const hasCustomBg = className.includes('bg-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      whileHover={noHover || isTouchDevice ? {} : { y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`rounded-2xl border shadow-sm overflow-hidden ${glass ? 'bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]' : `border-black/5 dark:border-white/5 ${!hasCustomBg ? 'bg-white dark:bg-zinc-900' : ''}`} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </motion.div>
  );
};

// Aurora Background Effect
const AuroraBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] animate-[auroraRotate_20s_linear_infinite] opacity-30 dark:opacity-20"
      style={{
        background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(99,102,241,0.12) 60deg, transparent 120deg, rgba(236,72,153,0.08) 180deg, transparent 240deg, rgba(6,182,212,0.1) 300deg, transparent 360deg)',
        filter: 'blur(80px)',
      }}
    />
    <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] animate-[auroraRotate_15s_linear_infinite_reverse] opacity-20 dark:opacity-15"
      style={{
        background: 'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(139,92,246,0.1) 90deg, transparent 180deg, rgba(16,185,129,0.08) 270deg, transparent 360deg)',
        filter: 'blur(100px)',
      }}
    />
  </div>
);

// Animated Gradient Border Card
const GlowCard = ({ children, className = "", color = 'indigo' }: { children: React.ReactNode, className?: string, color?: string }) => {
  const gradients: Record<string, string> = {
    indigo: 'from-indigo-500 via-purple-500 to-pink-500',
    emerald: 'from-emerald-400 via-teal-500 to-cyan-500',
    red: 'from-red-400 via-rose-500 to-pink-500',
    gold: 'from-amber-400 via-yellow-500 to-orange-500',
  };

  return (
    <div className="relative rounded-2xl p-[1px] overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradients[color] || gradients.indigo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]`}
        style={{ backgroundSize: '200% 200%', animation: 'gradientShift 3s ease infinite' }}
      />
      <div className={`relative rounded-2xl bg-white dark:bg-zinc-900 ${className}`}>
        {children}
      </div>
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

const Input = ({ label, suffix, ...props }: { label?: string, suffix?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">{label}</label>}
    <div className="relative group">
      <input
        {...props}
        className={`w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all bg-white dark:bg-zinc-800 text-black dark:text-white ${suffix ? 'pr-24' : ''}`}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-widest text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const Select = ({ label, options, ...props }: { label?: string, options: { value: string, label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">{label}</label>}
    <select 
      {...props}
      className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all bg-white dark:bg-zinc-800 text-black dark:text-white appearance-none"
    >
      {(options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);


// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'borrowers' | 'loans' | 'chitfunds' | 'reports' | 'settings'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalGiven: 0, totalBorrowed: 0, totalCollected: 0, activeBorrowers: 0, investedCapital: 0 });
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [chitGroups, setChitGroups] = useState<ChitGroup[]>([]);
  const [selectedChitGroup, setSelectedChitGroup] = useState<ChitGroup | null>(null);
  const [chitMembers, setChitMembers] = useState<ChitMember[]>([]);
  const [chitAuctions, setChitAuctions] = useState<ChitAuction[]>([]);
  const [chitPayments, setChitPayments] = useState<ChitPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chit Fund Modals
  const [showChitGroupModal, setShowChitGroupModal] = useState(false);
  const [showChitAuctionModal, setShowChitAuctionModal] = useState(false);
  const [showChitPaymentModal, setShowChitPaymentModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChitMember | null>(null);
  
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');

  const [showUserMenu, setShowUserMenu] = useState(false);
  useEffect(() => {
    if (!showUserMenu) return;
    const close = () => setShowUserMenu(false);
    const timer = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [showUserMenu]);
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showMobileTestModal, setShowMobileTestModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'find' | 'question' | 'reset'>('find');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [viewingBorrowerProfile, setViewingBorrowerProfile] = useState<Borrower | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showEditBorrowerModal, setShowEditBorrowerModal] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);
  const [selectedChitMemberIds, setSelectedChitMemberIds] = useState<number[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getQueue().length);
  const [showBulkChitPaymentModal, setShowBulkChitPaymentModal] = useState(false);
  const [expandedLoanPayments, setExpandedLoanPayments] = useState<Record<number, Payment[]>>({});
  const [expandedLoanId, setExpandedLoanId] = useState<number | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [borrowerPage, setBorrowerPage] = useState(1);
  const [loanPage, setLoanPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      showToast('Payment successful! Your account has been upgraded to Premium.');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      if (token) fetchUser();
    } else if (params.get('payment') === 'cancel') {
      showToast('Payment cancelled.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchStats();
      fetchBorrowers();
      fetchLoans();
      fetchChitGroups();
    }
  }, [token]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Offline detection and auto-sync
  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      // Flush queued mutations when back online
      const q = getQueue();
      if (q.length > 0) {
        const { success } = await flushQueue();
        setPendingCount(getQueue().length);
        if (success > 0) {
          // Refresh data after syncing
          if (token) {
            fetchStats();
            fetchBorrowers();
            fetchLoans();
            fetchChitGroups();
          }
        }
      }
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [token]);

  // Auto-refresh JWT token every 6 days (token expires in 7d)
  useEffect(() => {
    if (!token) return;
    const REFRESH_INTERVAL = 6 * 24 * 60 * 60 * 1000; // 6 days
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('token', data.token);
          setToken(data.token);
        }
      } catch { /* offline — will retry next interval */ }
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [token]);

  // Wrap mutation calls to track queue count
  const trackQueue = useCallback(() => {
    setPendingCount(getQueue().length);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const fetchUser = async () => {
    try {
      const res = await offlineFetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.pin_enabled === 1) {
          setIsLocked(true);
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await offlineFetch('/api/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setActivityLogs(Array.isArray(data) ? data : []);
    } catch { /* offline or network error */ }
  };

  const fetchStats = async () => {
    try {
      const res = await offlineFetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch { /* offline or network error */ }
  };

  const fetchBorrowers = async () => {
    try {
      const res = await offlineFetch('/api/borrowers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setBorrowers(Array.isArray(data) ? data : []);
    } catch { /* offline or network error */ }
  };

  const fetchLoans = async () => {
    try {
      const res = await offlineFetch('/api/loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch { /* offline or network error */ }
  };

  const fetchChitGroups = async () => {
    const res = await offlineFetch('/api/chit-groups', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setChitGroups(Array.isArray(d) ? d : []); }
  };

  const fetchChitMembers = async (groupId: number) => {
    const res = await offlineFetch(`/api/chit-groups/${groupId}/members`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setChitMembers(Array.isArray(d) ? d : []); }
  };

  const fetchChitAuctions = async (groupId: number) => {
    const res = await offlineFetch(`/api/chit-groups/${groupId}/auctions`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setChitAuctions(Array.isArray(d) ? d : []); }
  };

  const fetchChitPayments = async (groupId: number) => {
    const res = await offlineFetch(`/api/chit-groups/${groupId}/payments`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setChitPayments(Array.isArray(d) ? d : []); }
  };

  const fetchBorrowerLoans = async (borrowerId: number) => {
    const response = await offlineFetch(`/api/borrowers/${borrowerId}/loans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setLoans(Array.isArray(data) ? data : []);
  };

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredBorrowers = useMemo(() => borrowers.filter(b =>
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    b.phone.includes(debouncedSearch)
  ), [borrowers, debouncedSearch]);

  const filteredLoans = useMemo(() => loans.filter(l =>
    l.borrower_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    l.id.toString().includes(debouncedSearch)
  ), [loans, debouncedSearch]);

  // Reset pages when search changes
  useEffect(() => { setBorrowerPage(1); }, [debouncedSearch]);
  useEffect(() => { setLoanPage(1); }, [debouncedSearch]);

  const paginatedBorrowers = useMemo(() => {
    const start = (borrowerPage - 1) * ITEMS_PER_PAGE;
    return filteredBorrowers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBorrowers, borrowerPage]);

  const totalBorrowerPages = Math.max(1, Math.ceil(filteredBorrowers.length / ITEMS_PER_PAGE));

  const paginatedLoans = useMemo(() => {
    const start = (loanPage - 1) * ITEMS_PER_PAGE;
    return filteredLoans.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLoans, loanPage]);

  const totalLoanPages = Math.max(1, Math.ceil(filteredLoans.length / ITEMS_PER_PAGE));

  // --- Handlers ---

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? data : { ...data, terms_accepted: termsAccepted };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setUser(result.user);
      } else {
        setAuthError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error. Please try again.');
    }
  };

  const handleRecoveryFind = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    try {
      const res = await offlineFetch('/api/auth/recovery/get-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: recoveryIdentifier })
      });
      const result = await res.json();
      if (res.ok) {
        setRecoveryQuestion(result.question);
        setRecoveryStep('question');
      } else {
        setRecoveryError(result.error);
      }
    } catch (err) {
      setRecoveryError('Network error');
    }
  };

  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    try {
      const res = await offlineFetch('/api/auth/recovery/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: recoveryIdentifier, 
          answer: recoveryAnswer, 
          newPassword: recoveryNewPassword 
        })
      });
      const result = await res.json();
      if (res.ok) {
        setRecoverySuccess('Password reset successfully! You can now login.');
        setTimeout(() => {
          setShowRecoveryModal(false);
          setRecoveryStep('find');
          setRecoveryIdentifier('');
          setRecoveryAnswer('');
          setRecoveryNewPassword('');
          setRecoverySuccess('');
        }, 3000);
      } else {
        setRecoveryError(result.error);
      }
    } catch (err) {
      setRecoveryError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setStats({ totalGiven: 0, totalBorrowed: 0, totalCollected: 0, activeBorrowers: 0, investedCapital: 0 });
    setBorrowers([]);
    setLoans([]);
  };

  const handleAddBorrower = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await offlineFetch('/api/borrowers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    trackQueue();

    if (res.ok) {
      setShowBorrowerModal(false);
      fetchBorrowers();
      showToast('Contact added successfully');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to add contact' }));
      showToast(err.error || 'Failed to add contact', 'error');
    }
    setIsSubmitting(false);
  };

  const handleEditBorrower = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !editingBorrower) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await offlineFetch(`/api/borrowers/${editingBorrower.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    trackQueue();

    if (res.ok) {
      setShowEditBorrowerModal(false);
      setEditingBorrower(null);
      fetchBorrowers();
      if (viewingBorrowerProfile?.id === editingBorrower.id) {
        setViewingBorrowerProfile({ ...viewingBorrowerProfile, ...data } as Borrower);
      }
      showToast('Contact updated successfully');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to update contact' }));
      showToast(err.error || 'Failed to update contact', 'error');
    }
    setIsSubmitting(false);
  };

  const handleDeleteBorrower = async (borrower: Borrower) => {
    if (!confirm(`Delete "${borrower.name}"? This will also delete all their loans and payments. This cannot be undone.`)) return;
    const res = await offlineFetch(`/api/borrowers/${borrower.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    trackQueue();

    if (res.ok) {
      fetchBorrowers();
      fetchLoans();
      if (viewingBorrowerProfile?.id === borrower.id) setViewingBorrowerProfile(null);
      showToast('Contact deleted');
    } else {
      showToast('Failed to delete contact', 'error');
    }
  };

  const openEditBorrower = (borrower: Borrower) => {
    setEditingBorrower(borrower);
    setShowEditBorrowerModal(true);
  };

  const handleCreateLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await offlineFetch('/api/loans', {
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
    trackQueue();

    if (res.ok) {
      const result = await res.json();
      setShowLoanModal(false);
      fetchLoans();
      fetchStats();
      if (result.generatedPayments > 0) {
        showToast(`Loan created with ${result.generatedPayments} auto-generated interest entries`);
      } else {
        showToast('Loan created successfully');
      }
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to create loan' }));
      showToast(err.error || 'Failed to create loan', 'error');
    }
    setIsSubmitting(false);
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await offlineFetch('/api/payments', {
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
    trackQueue();

    if (res.ok) {
      setShowPaymentModal(false);
      setSelectedLoan(null);
      fetchLoans();
      fetchStats();
      if (viewingBorrowerProfile) {
        fetchBorrowerLoans(viewingBorrowerProfile.id);
      }
      showToast('Payment recorded successfully');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to record payment' }));
      showToast(err.error || 'Failed to record payment', 'error');
    }
    setIsSubmitting(false);
  };

  const toggleLoanPayments = async (loanId: number) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
      return;
    }
    const res = await offlineFetch(`/api/loans/${loanId}/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setExpandedLoanPayments(prev => ({ ...prev, [loanId]: Array.isArray(data) ? data : [] }));
      setExpandedLoanId(loanId);
    }
  };

  const handleEditPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPayment || isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await offlineFetch(`/api/payments/${editingPayment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: Number(data.amount), payment_date: data.payment_date, notes: data.notes })
    });
    trackQueue();

    if (res.ok) {
      setShowEditPaymentModal(false);
      setEditingPayment(null);
      fetchLoans();
      fetchStats();
      if (expandedLoanId) {
        const pRes = await offlineFetch(`/api/loans/${expandedLoanId}/payments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          setExpandedLoanPayments(prev => ({ ...prev, [expandedLoanId]: pData }));
        }
      }
      if (viewingBorrowerProfile) fetchBorrowerLoans(viewingBorrowerProfile.id);
      showToast('Payment updated successfully');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      showToast(err.error || 'Failed to update payment', 'error');
    }
    setIsSubmitting(false);
  };

  const handleDeletePayment = async (paymentId: number, loanId: number) => {
    if (!confirm('Delete this payment entry?')) return;
    const res = await offlineFetch(`/api/payments/${paymentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    trackQueue();

    if (res.ok) {
      fetchLoans();
      fetchStats();
      // Refresh expanded payments
      const paymentsRes = await offlineFetch(`/api/loans/${loanId}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setExpandedLoanPayments(prev => ({ ...prev, [loanId]: data }));
      }
      if (viewingBorrowerProfile) fetchBorrowerLoans(viewingBorrowerProfile.id);
      showToast('Payment deleted');
    } else {
      showToast('Failed to delete payment', 'error');
    }
  };

  const handleGenerateInterest = async (loanId: number) => {
    if (!confirm('Auto-generate past interest payment entries? This will create entries for each period from the loan start date to today.')) return;
    const res = await offlineFetch(`/api/loans/${loanId}/generate-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    trackQueue();

    if (res.ok) {
      const data = await res.json();
      showToast(`Generated ${data.generated} interest entries`);
      fetchLoans();
      fetchStats();
      // Refresh expanded payments if this loan is expanded
      if (expandedLoanId === loanId) {
        const paymentsRes = await offlineFetch(`/api/loans/${loanId}/payments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (paymentsRes.ok) {
          const pData = await paymentsRes.json();
          setExpandedLoanPayments(prev => ({ ...prev, [loanId]: pData }));
        }
      }
      if (viewingBorrowerProfile) fetchBorrowerLoans(viewingBorrowerProfile.id);
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      showToast(err.error || 'Failed to generate interest entries', 'error');
    }
  };

  const handleEditLoan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLoan || isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await offlineFetch(`/api/loans/${selectedLoan.id}`, {
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
    trackQueue();

    if (res.ok) {
      setShowEditLoanModal(false);
      setSelectedLoan(null);
      fetchLoans();
      fetchStats();
      showToast('Loan updated successfully');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to update loan' }));
      showToast(err.error || 'Failed to update loan', 'error');
    }
    setIsSubmitting(false);
  };

  const handleCloseLoan = async (loanId: number) => {
    if (!confirm('Are you sure you want to close this loan?')) return;
    const res = await offlineFetch(`/api/loans/${loanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    trackQueue();

    if (res.ok) {
      fetchLoans();
      fetchStats();
      showToast('Loan closed');
    } else {
      showToast('Failed to close loan', 'error');
    }
  };

  const handleUpdateCapital = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));

    const res = await offlineFetch('/api/capital', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    trackQueue();

    if (res.ok) {
      setShowCapitalModal(false);
      fetchStats();
      showToast('Capital updated');
    } else {
      showToast('Failed to update capital', 'error');
    }
  };

  const handleUpdateCurrency = async (currency: string) => {
    const res = await offlineFetch('/api/user/currency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currency })
    });
    trackQueue();

    if (res.ok) {
      fetchUser();
      showToast('Currency updated');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to update currency' }));
      showToast(err.error || 'Failed to update currency', 'error');
    }
  };

  const handlePinSetup = async (pin: string) => {
    const res = await offlineFetch('/api/user/pin/setup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pin })
    });
    if (res.ok) {
      fetchUser();
    }
  };

  const handlePinVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError('');
    const res = await offlineFetch('/api/user/pin/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pin: pinInput })
    });
    if (res.ok) {
      setIsLocked(false);
      setPinInput('');
    } else {
      setPinError('Incorrect PIN');
      setPinInput('');
    }
  };

  const handleTogglePin = async (enabled: boolean) => {
    const res = await offlineFetch('/api/user/pin/toggle', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      fetchUser();
    }
  };

  const handleExportCSV = async () => {
    const res = await offlineFetch('/api/export/loans', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loans_export.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = async () => {
    const res = await offlineFetch('/api/user/export', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrix_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.borrowers || !data.loans) {
          showToast('Invalid backup file format', 'error');
          return;
        }
        if (!confirm(`Import ${data.borrowers.length} contacts, ${data.loans.length} loans, and ${(data.payments || []).length} payments? This will ADD to your existing data.`)) return;
        const res = await offlineFetch('/api/user/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          showToast('Data imported successfully');
          fetchBorrowers(); fetchLoans();
        } else {
          const err = await res.json();
          showToast(err.error || 'Import failed', 'error');
        }
      } catch {
        showToast('Failed to read backup file', 'error');
      }
    };
    input.click();
  };

  const handleDeleteAccount = async () => {
    if (!confirm('CRITICAL: This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?')) return;
    const res = await offlineFetch('/api/user/account', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      handleLogout();
    }
  };

  const sendWhatsAppReminder = (borrower: Borrower, loan: Loan) => {
    const currency = user?.currency || '₹';
    const message = `Hi ${borrower.name}, this is a friendly reminder for your pending payment of ${currency}${loan.balance?.toLocaleString()} for Loan #${loan.id}. Please let me know when you can settle this. Thanks!`;
    const phone = borrower.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleUpgrade = () => {
    setShowPricingModal(true);
  };

  const handleActivatePremium = async () => {
    // In production, this would redirect to a payment gateway (Stripe, Google Play, etc.)
    // For now, show a message that payment integration is pending
    showToast('Payment gateway coming soon. Stay tuned!', 'error');
    setShowPricingModal(false);
  };

  const handleToggleBackup = async (enabled: boolean) => {
    const res = await offlineFetch('/api/user/backup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      fetchUser();
    }
  };

  const handleCreateChitGroup = async (data: any) => {
    const res = await offlineFetch('/api/chit-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    trackQueue();
    if (res.ok) {
      fetchChitGroups();
      setShowChitGroupModal(false);
      showToast('Chit group created');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to create chit group' }));
      showToast(err.error || 'Failed to create chit group', 'error');
    }
  };

  const handleAddChitMember = async (borrowerId: number, slotNumber: number, jointWith?: string, myShare?: number, partnerShare?: number) => {
    if (!selectedChitGroup) return;
    const res = await offlineFetch(`/api/chit-groups/${selectedChitGroup.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ borrower_id: borrowerId, slot_number: slotNumber, joint_with: jointWith, my_share: myShare, partner_share: partnerShare })
    });
    trackQueue();
    if (res.ok) {
      fetchChitMembers(selectedChitGroup.id);
      setShowAddMemberModal(false);
      showToast('Member added');
    } else {
      showToast('Failed to add member', 'error');
    }
  };

  const handleRecordAuction = async (data: any) => {
    if (!selectedChitGroup) return;
    const res = await offlineFetch(`/api/chit-groups/${selectedChitGroup.id}/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    trackQueue();
    if (res.ok) {
      fetchChitAuctions(selectedChitGroup.id);
      fetchChitMembers(selectedChitGroup.id);
      setShowChitAuctionModal(false);
      showToast('Auction recorded');
    } else {
      showToast('Failed to record auction', 'error');
    }
  };

  const handleRecordChitPayment = async (data: any) => {
    if (!selectedChitGroup) return;
    const res = await offlineFetch('/api/chit-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...data, chit_group_id: selectedChitGroup.id })
    });
    trackQueue();
    if (res.ok) {
      fetchChitPayments(selectedChitGroup.id);
      setShowChitPaymentModal(false);
      showToast('Payment recorded');
    } else {
      showToast('Failed to record payment', 'error');
    }
  };

  const handleBulkChitPayment = async (data: { chit_group_id: number, payments: { chit_member_id: number, amount: number }[], month_number: number, payment_date: string }) => {
    const res = await offlineFetch('/api/chit-payments/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    trackQueue();
    if (res.ok) {
      if (selectedChitGroup) fetchChitPayments(selectedChitGroup.id);
      setShowBulkChitPaymentModal(false);
      setSelectedChitMemberIds([]);
    } else {
      const err = await res.json();
      showToast(err.error || "Bulk payment failed", 'error');
    }
  };

  const handleBulkPayment = async (data: { payments: { loan_id: number, amount: number }[], payment_date: string, notes: string }) => {
    const res = await offlineFetch('/api/payments/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    trackQueue();
    if (res.ok) {
      fetchLoans();
      fetchStats();
      setShowBulkPaymentModal(false);
      setSelectedLoanIds([]);
    } else {
      const err = await res.json();
      showToast(err.error || "Bulk payment failed", 'error');
    }
  };

  const handleConsolidateLoans = async (loanIds: number[], newLoanDetails: any) => {
    const res = await offlineFetch('/api/loans/consolidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ loan_ids: loanIds, new_loan_details: newLoanDetails })
    });
    trackQueue();
    if (res.ok) {
      fetchLoans();
      fetchStats();
      setShowConsolidateModal(false);
      setSelectedLoanIds([]);
    } else {
      const err = await res.json();
      showToast(err.error || "Consolidation failed", 'error');
    }
  };

  // --- Views ---

  const closeBorrowerProfile = () => {
    setViewingBorrowerProfile(null);
    setSelectedLoanIds([]);
  };

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
        {isInstallable && (
          <FadeIn direction="down">
            <Card className="p-4 bg-gradient-to-r from-black to-zinc-800 dark:from-white dark:to-zinc-200 border-0 relative overflow-hidden mb-2">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 dark:bg-black/10 rounded-xl">
                    <Download size={20} className="text-white dark:text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white dark:text-black">Install Metrix App</h4>
                    <p className="text-[11px] text-white/60 dark:text-black/50">Add to home screen for the best experience</p>
                  </div>
                </div>
                <button onClick={handleInstallApp} className="px-4 py-2 bg-white dark:bg-black text-black dark:text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform cursor-pointer">
                  Install
                </button>
              </div>
            </Card>
          </FadeIn>
        )}

        <AdComponent isPremium={user?.is_premium === 1} onUpgrade={handleUpgrade} />
        
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onUpgrade={handleActivatePremium}
        />

        <ChitGroupModal 
          isOpen={showChitGroupModal} 
          onClose={() => setShowChitGroupModal(false)} 
          onCreate={handleCreateChitGroup} 
        />

        {selectedChitGroup && (
          <>
            <AddMemberModal 
              isOpen={showAddMemberModal} 
              onClose={() => setShowAddMemberModal(false)} 
              onAdd={handleAddChitMember} 
              borrowers={borrowers}
            />
            <ChitAuctionModal 
              isOpen={showChitAuctionModal} 
              onClose={() => setShowChitAuctionModal(false)} 
              onRecord={handleRecordAuction} 
              members={chitMembers}
              group={selectedChitGroup}
            />
            <ChitPaymentModal 
              isOpen={showChitPaymentModal} 
              onClose={() => setShowChitPaymentModal(false)} 
              onRecord={handleRecordChitPayment} 
              member={selectedMember}
              group={selectedChitGroup}
            />

            <BulkChitPaymentModal 
              isOpen={showBulkChitPaymentModal} 
              onClose={() => setShowBulkChitPaymentModal(false)} 
              onRecord={handleBulkChitPayment} 
              selectedMembers={chitMembers.filter(m => selectedChitMemberIds.includes(m.id))}
              group={selectedChitGroup}
            />

            <BulkPaymentModal 
              isOpen={showBulkPaymentModal} 
              onClose={() => setShowBulkPaymentModal(false)} 
              onRecord={handleBulkPayment} 
              selectedLoans={loans.filter(l => selectedLoanIds.includes(l.id))}
            />

            <ConsolidateModal 
              isOpen={showConsolidateModal} 
              onClose={() => setShowConsolidateModal(false)} 
              onConsolidate={handleConsolidateLoans} 
              selectedLoans={loans.filter(l => selectedLoanIds.includes(l.id))}
            />
          </>
        )}
        
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Suspense fallback={<div className="w-full h-[350px] bg-zinc-950 rounded-3xl animate-pulse" />}>
            <ThreeVisuals lent={stats.totalGiven} borrowed={stats.totalBorrowed} capital={stats.investedCapital} />
          </Suspense>
        </motion.div>
        
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <GlowCard color="gold" className="p-6">
            <div className="relative group cursor-pointer" onClick={() => setShowCapitalModal(true)}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 rounded-2xl" />
              <div className="flex justify-between items-start relative">
                <div>
                  <p className="text-black/50 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">Total Capital</p>
                  <h2 className="text-2xl font-black mt-1 bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{user?.currency || '₹'}{(stats.investedCapital || 0).toLocaleString()}</h2>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <TrendingUp size={20} className="text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 relative">
                <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(utilization, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{utilization.toFixed(1)}%</span>
              </div>
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 size={12} className="text-black/30 dark:text-white/30" />
              </div>
            </div>
          </GlowCard>

          <Card glass className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black/50 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">Currently Lent</p>
                <h2 className="text-2xl font-bold mt-1 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{user?.currency || '₹'}{(stats.totalGiven || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <HandCoins size={20} className="text-emerald-500" />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-black/40 dark:text-white/30 font-medium">Available: {user?.currency || '₹'}{(remainingCapital || 0).toLocaleString()}</p>
          </Card>

          <Card glass className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black/50 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">Total Collected</p>
                <h2 className="text-2xl font-bold mt-1 bg-gradient-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent">{user?.currency || '₹'}{(stats.totalCollected || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <TrendingUp size={20} className="text-cyan-500" />
              </div>
            </div>
          </Card>

          <GlowCard color="red" className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-400 dark:text-red-300 text-[10px] font-bold uppercase tracking-widest">My Borrowings</p>
                <h2 className="text-2xl font-bold mt-1 bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">{user?.currency || '₹'}{(stats.totalBorrowed || 0).toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle size={20} className="text-red-500" />
              </div>
            </div>
          </GlowCard>

          <GlowCard color="indigo" className="p-6">
            <div className="cursor-pointer" onClick={() => setActiveTab('chitfunds')}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-400 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Chit Groups</p>
                  <h2 className="text-2xl font-bold mt-1 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{chitGroups.length} Active</h2>
                </div>
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <UsersRound size={20} className="text-indigo-500" />
                </div>
              </div>
            </div>
          </GlowCard>
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
                    <p className={`font-bold ${loan.direction === 'Borrowed' ? 'text-red-600 dark:text-red-400' : ''}`}>{user?.currency || '₹'}{(loan.amount || 0).toLocaleString()}</p>
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
                  <p className="font-bold">Add Contact</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Add a new contact</p>
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
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowChitGroupModal(true)}
                className="p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex flex-col gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                  <UsersRound size={20} />
                </div>
                <div>
                  <p className="font-bold">New Chit Group</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Start a new chit fund</p>
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
            <Plus size={20} /> Add Contact
          </Button>
        </div>
      </FadeIn>

      {filteredBorrowers.length === 0 ? (
        <Card className="p-12 text-center" noHover>
          <Users size={48} className="mx-auto text-black/10 dark:text-white/10 mb-4" />
          <h3 className="text-lg font-bold mb-1">{borrowers.length === 0 ? 'No contacts yet' : 'No results found'}</h3>
          <p className="text-sm text-black/40 dark:text-white/30 mb-4">{borrowers.length === 0 ? 'Add your first contact to get started.' : 'Try a different search term.'}</p>
          {borrowers.length === 0 && <Button onClick={() => setShowBorrowerModal(true)}><Plus size={16} /> Add Contact</Button>}
        </Card>
      ) : (<>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedBorrowers.map(borrower => (
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
                <button onClick={(e) => { e.stopPropagation(); openEditBorrower(borrower); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-black/50 dark:text-white/40"><Edit2 size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteBorrower(borrower); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 size={16} /></button>
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

      {totalBorrowerPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setBorrowerPage(p => Math.max(1, p - 1))}
            disabled={borrowerPage === 1}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium px-3">
            {borrowerPage} of {totalBorrowerPages}
          </span>
          <button
            onClick={() => setBorrowerPage(p => Math.min(totalBorrowerPages, p + 1))}
            disabled={borrowerPage === totalBorrowerPages}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-xs text-black/40 dark:text-white/30 ml-2">
            ({filteredBorrowers.length} total)
          </span>
        </div>
      )}
      </>)}
    </motion.div>
  );

  const ChitFundsView = () => (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } }
      }}
      className="space-y-6"
    >
      {!selectedChitGroup ? (
        <>
          <FadeIn direction="down">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <h2 className="text-2xl font-black">Chit Fund Groups</h2>
              <Button onClick={() => setShowChitGroupModal(true)} className="w-full md:w-auto">
                <Plus size={20} /> Add Group
              </Button>
            </div>
          </FadeIn>

          {chitGroups.length === 0 ? (
            <Card className="p-12 text-center" noHover>
              <UsersRound size={48} className="mx-auto text-black/10 dark:text-white/10 mb-4" />
              <h3 className="text-lg font-bold mb-1">No chit groups yet</h3>
              <p className="text-sm text-black/40 dark:text-white/30 mb-4">Create a group you organize or add one you've joined.</p>
              <Button onClick={() => setShowChitGroupModal(true)}><Plus size={16} /> Add Group</Button>
            </Card>
          ) : (
          <>
            {chitGroups.filter(g => g.role === 'organizer' || !g.role).length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/30 mb-3">My Groups (Organizer)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chitGroups.filter(g => g.role === 'organizer' || !g.role).map(group => (
                    <Card key={group.id} className="p-6 hover:border-indigo-500/30 transition-all group cursor-pointer" onClick={() => {
                      setSelectedChitGroup(group);
                      setSelectedChitMemberIds([]);
                      fetchChitMembers(group.id);
                      fetchChitAuctions(group.id);
                      fetchChitPayments(group.id);
                    }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                          <UsersRound size={24} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${group.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-black/5 text-black/40'}`}>
                          {group.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                      <p className="text-sm text-black/40 dark:text-white/30 mb-4">Value: {user?.currency || '₹'}{group.total_value.toLocaleString()}</p>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Members</p>
                          <p className="font-bold">{group.members_count}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Monthly</p>
                          <p className="font-bold">{user?.currency || '₹'}{group.monthly_contribution.toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {chitGroups.filter(g => g.role === 'member').length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Joined Groups (Member)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chitGroups.filter(g => g.role === 'member').map(group => (
                    <Card key={group.id} className="p-6 hover:border-indigo-500/30 transition-all group cursor-pointer border-indigo-500/10" onClick={() => {
                      setSelectedChitGroup(group);
                      setSelectedChitMemberIds([]);
                      fetchChitMembers(group.id);
                      fetchChitAuctions(group.id);
                      fetchChitPayments(group.id);
                    }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                          <UsersRound size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-500">Joined</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${group.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-black/5 text-black/40'}`}>
                            {group.status}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                      {group.organizer_name && <p className="text-xs text-indigo-500/60 mb-1">Organized by {group.organizer_name}</p>}
                      <p className="text-sm text-black/40 dark:text-white/30 mb-4">Value: {user?.currency || '₹'}{group.total_value.toLocaleString()}</p>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Members</p>
                          <p className="font-bold">{group.members_count}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Monthly</p>
                          <p className="font-bold">{user?.currency || '₹'}{group.monthly_contribution.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">My Slot</p>
                          <p className="font-bold">#{group.my_slot_number || '-'}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => { setSelectedChitGroup(null); setSelectedChitMemberIds([]); }}
            className="flex items-center gap-2 text-sm font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Groups
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black">{selectedChitGroup.name}</h2>
                    <p className="text-sm text-black/40 dark:text-white/30">Started on {new Date(selectedChitGroup.start_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="text-xs py-1.5" onClick={() => setShowAddMemberModal(true)}>
                      <Plus size={16} /> Add Member
                    </Button>
                    <Button className="text-xs py-1.5" onClick={() => setShowChitAuctionModal(true)}>
                      <Gavel size={16} /> New Auction
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Total Value</p>
                    <p className="text-lg font-bold">{user?.currency || '₹'}{selectedChitGroup.total_value.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Duration</p>
                    <p className="text-lg font-bold">{selectedChitGroup.duration_months} Months</p>
                  </div>
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Monthly Sub</p>
                    <p className="text-lg font-bold">{user?.currency || '₹'}{selectedChitGroup.monthly_contribution.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-black/40 dark:text-white/30">Commission</p>
                    <p className="text-lg font-bold">{selectedChitGroup.commission_percent}%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedChitMemberIds.length === chitMembers.length && chitMembers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedChitMemberIds(chitMembers.map(m => m.id));
                        else setSelectedChitMemberIds([]);
                      }}
                    />
                    <h3 className="font-bold text-lg">Members ({chitMembers.length}/{selectedChitGroup.members_count})</h3>
                  </div>
                  {selectedChitMemberIds.length > 0 && (
                    <Button variant="secondary" className="text-xs py-1.5" onClick={() => setShowBulkChitPaymentModal(true)}>
                      Bulk Pay ({selectedChitMemberIds.length})
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {chitMembers.map(member => (
                    <div key={member.id} className={`flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl transition-all ${selectedChitMemberIds.includes(member.id) ? 'border-indigo-500 bg-indigo-500/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedChitMemberIds.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedChitMemberIds([...selectedChitMemberIds, member.id]);
                            else setSelectedChitMemberIds(selectedChitMemberIds.filter(id => id !== member.id));
                          }}
                        />
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                          {member.slot_number}
                        </div>
                        <div>
                          <p className="font-bold">{member.borrower_name}</p>
                          <p className="text-xs text-black/40 dark:text-white/30">{member.phone}</p>
                          {member.joint_with && (
                            <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                              Joint with {member.joint_with} ({user?.currency || '₹'}{member.my_share?.toLocaleString()} + {user?.currency || '₹'}{member.partner_share?.toLocaleString()})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.joint_with && (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg">
                            Joint
                          </span>
                        )}
                        {member.has_won_auction === 1 ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            Won Month {member.auction_won_month}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 bg-black/5 text-black/40 rounded-lg">
                            Eligible
                          </span>
                        )}
                        <Button variant="ghost" className="text-xs py-1.5" onClick={() => {
                          setSelectedMember(member);
                          setShowChitPaymentModal(true);
                        }}>
                          <Coins size={16} /> Pay
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="w-full lg:w-96 space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Auction History</h3>
                <div className="space-y-4">
                  {chitAuctions.map(auction => (
                    <div key={auction.id} className="p-4 border border-black/5 dark:border-white/5 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase text-indigo-500">Month {auction.month_number}</span>
                        <span className="text-[10px] text-black/40 dark:text-white/30">{new Date(auction.auction_date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold mb-1">{auction.winner_name}</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-black/40 dark:text-white/30">Bid (Discount)</span>
                        <span className="font-bold text-red-500">-{user?.currency || '₹'}{auction.bid_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-black/40 dark:text-white/30">Dividend/Member</span>
                        <span className="font-bold text-emerald-500">+{user?.currency || '₹'}{auction.dividend_per_member.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {chitAuctions.length === 0 && (
                    <p className="text-sm text-black/40 dark:text-white/30 text-center py-8">No auctions recorded yet.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Recent Payments</h3>
                <div className="space-y-4">
                  {chitPayments.slice(0, 10).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                      <div>
                        <p className="text-xs font-bold">{payment.borrower_name}</p>
                        <p className="text-[10px] text-black/40 dark:text-white/30">Month {payment.month_number} • {payment.payment_method}</p>
                      </div>
                      <p className="font-bold text-xs">{user?.currency || '₹'}{payment.amount.toLocaleString()}</p>
                    </div>
                  ))}
                  {chitPayments.length === 0 && (
                    <p className="text-sm text-black/40 dark:text-white/30 text-center py-8">No payments recorded yet.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
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
              placeholder="Search by contact or ID..." 
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

      {filteredLoans.length === 0 ? (
        <Card className="p-12 text-center" noHover>
          <HandCoins size={48} className="mx-auto text-black/10 dark:text-white/10 mb-4" />
          <h3 className="text-lg font-bold mb-1">{loans.length === 0 ? 'No loans yet' : 'No results found'}</h3>
          <p className="text-sm text-black/40 dark:text-white/30 mb-4">{loans.length === 0 ? 'Create your first loan to start tracking.' : 'Try a different search term.'}</p>
          {loans.length === 0 && <Button onClick={() => setShowLoanModal(true)}><Plus size={16} /> Create Loan</Button>}
        </Card>
      ) : (<>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/30">
              <th className="px-4 py-2">Loan ID</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Repay/Given</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Interest/Inst.</th>
              <th className="px-4 py-2">Start Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLoans.map((loan, idx) => (
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
                  <div className="font-bold">{user?.currency || '₹'}{(loan.amount || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-black/40 dark:text-white/30">Given: {user?.currency || '₹'}{(loan.given_amount || 0).toLocaleString()}</div>
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
                    <div className="text-xs font-medium">{user?.currency || '₹'}{loan.installment_amount}/ {loan.interest_type.replace('ly', '')}</div>
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
                        <Button 
                          variant="ghost" 
                          className="text-xs p-2 text-emerald-500" 
                          onClick={() => {
                            const borrower = borrowers.find(b => b.id === loan.borrower_id);
                            if (borrower) sendWhatsAppReminder(borrower, loan);
                          }}
                        >
                          <Phone size={14} />
                        </Button>
                      )}
                      {loan.status === 'Active' && (
                        <Button variant="ghost" className="text-xs p-2" onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); }}>
                          Payment
                        </Button>
                      )}
                      {loan.status === 'Active' && loan.loan_type === 'Interest Only' && new Date(loan.start_date) < new Date() && (
                        <Button variant="ghost" className="text-xs p-2 text-indigo-500" onClick={() => handleGenerateInterest(loan.id)}>
                          <RefreshCw size={14} />
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

      {totalLoanPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setLoanPage(p => Math.max(1, p - 1))}
            disabled={loanPage === 1}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium px-3">
            {loanPage} of {totalLoanPages}
          </span>
          <button
            onClick={() => setLoanPage(p => Math.min(totalLoanPages, p + 1))}
            disabled={loanPage === totalLoanPages}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-xs text-black/40 dark:text-white/30 ml-2">
            ({filteredLoans.length} total)
          </span>
        </div>
      )}
      </>)}
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
            <p className="text-2xl font-bold">{user?.currency || '₹'}{(reportData.totalAmount || 0).toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Total Interest</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{user?.currency || '₹'}{(reportData.totalInterest || 0).toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Total Received</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user?.currency || '₹'}{(reportData.totalPaid || 0).toLocaleString()}</p>
          </Card>
          <Card className="p-5 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20">
            <p className="text-xs font-bold text-red-400 dark:text-red-300 uppercase tracking-widest mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{user?.currency || '₹'}{(reportData.outstanding || 0).toLocaleString()}</p>
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
                  <th className="px-6 py-3">Contact</th>
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
                      <td className="px-6 py-4">{user?.currency || '₹'}{(loan.currentPrincipal || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">+{user?.currency || '₹'}{interest.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold">{user?.currency || '₹'}{totalDue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-600 dark:text-blue-400">-{user?.currency || '₹'}{paid.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">{user?.currency || '₹'}{balance.toLocaleString()}</td>
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

  const SettingsView = () => {
    useEffect(() => {
      fetchActivityLogs();
    }, []);

    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="space-y-6 max-w-3xl"
      >
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-2xl font-black">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user?.username}</h3>
              <p className="text-sm text-black/40 dark:text-white/30">Account ID: #{user?.id}</p>
            </div>
            {user?.is_premium === 1 && (
              <div className="ml-auto px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={12} /> Premium
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="font-bold">Premium Features</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Unlock all premium features.</p>
                </div>
              </div>
              {user?.is_premium === 1 ? (
                <span className="text-xs font-bold text-emerald-500">Active</span>
              ) : (
                <Button onClick={handleUpgrade} className="text-xs py-1.5">Activate</Button>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <Cloud size={20} />
                </div>
                <div>
                  <p className="font-bold">Cloud Backup</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Securely sync your data to our servers.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleBackup(user!.backup_enabled === 0)}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${user?.backup_enabled === 1 ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: user?.backup_enabled === 1 ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 text-white rounded-lg">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="font-bold">Security PIN Lock</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Protect your data with a 4-digit PIN.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user?.pin_enabled === 1 ? (
                  <button 
                    onClick={() => handleTogglePin(false)}
                    className="w-12 h-6 rounded-full bg-emerald-500 transition-all relative cursor-pointer"
                  >
                    <motion.div animate={{ x: 26 }} className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                ) : (
                  <Button onClick={() => {
                    const pin = prompt("Enter a 4-digit PIN:");
                    if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
                      handlePinSetup(pin);
                    } else if (pin) {
                      showToast("Invalid PIN. Please enter 4 digits.", 'error');
                    }
                  }} className="text-xs py-1.5">Setup PIN</Button>
                )}
              </div>
            </div>

            <div className="border-t border-black/5 dark:border-white/5 pt-4 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl"><Lock size={18} /></div>
                <div>
                  <p className="font-bold">Change Password</p>
                  <p className="text-xs text-black/40 dark:text-white/30">Update your account password.</p>
                </div>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (isSubmitting) return;
                setIsSubmitting(true);
                const fd = new FormData(e.currentTarget);
                const current_password = fd.get('current_password') as string;
                const new_password = fd.get('new_password') as string;
                const confirm_password = fd.get('confirm_password') as string;
                if (new_password !== confirm_password) { showToast('Passwords do not match', 'error'); setIsSubmitting(false); return; }
                const res = await offlineFetch('/api/user/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ current_password, new_password })
                });
                if (res.ok) {
                  showToast('Password changed successfully');
                  (e.target as HTMLFormElement).reset();
                } else {
                  const err = await res.json().catch(() => ({ error: 'Failed to change password' }));
                  showToast(err.error || 'Failed to change password', 'error');
                }
                setIsSubmitting(false);
              }} className="space-y-3">
                <input name="current_password" type="password" required placeholder="Current password" className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm" />
                <input name="new_password" type="password" required minLength={8} placeholder="New password (min 8 chars)" className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm" />
                <input name="confirm_password" type="password" required minLength={8} placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm" />
                <Button type="submit" className="w-full py-2.5 text-sm" disabled={isSubmitting}>{isSubmitting ? 'Changing...' : 'Change Password'}</Button>
              </form>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-bold mb-4">Preferences</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">App Currency</label>
              <select 
                value={user?.currency || '₹'}
                onChange={(e) => handleUpdateCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-black dark:text-white appearance-none"
              >
                <option value="₹">Indian Rupee (₹)</option>
                <option value="$">US Dollar ($)</option>
                <option value="€">Euro (€)</option>
                <option value="£">British Pound (£)</option>
                <option value="¥">Japanese Yen (¥)</option>
                <option value="₩">Korean Won (₩)</option>
                <option value="₦">Nigerian Naira (₦)</option>
                <option value="KSh">Kenyan Shilling (KSh)</option>
                <option value="R">South African Rand (R)</option>
                <option value="₱">Philippine Peso (₱)</option>
                <option value="฿">Thai Baht (฿)</option>
                <option value="₫">Vietnamese Dong (₫)</option>
                <option value="RM">Malaysian Ringgit (RM)</option>
                <option value="Rp">Indonesian Rupiah (Rp)</option>
                <option value="₸">Kazakhstani Tenge (₸)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-bold mb-4">Legal & Policies</h4>
          

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={() => setShowTermsModal(true)}
              className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-all text-left flex items-center justify-between"
            >
              Terms of Service
              <ExternalLink size={14} className="opacity-40" />
            </button>
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-all text-left flex items-center justify-between"
            >
              Privacy Policy
              <ExternalLink size={14} className="opacity-40" />
            </button>
            <button 
              onClick={() => setShowRefundModal(true)}
              className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-all text-left flex items-center justify-between"
            >
              Refund Policy
              <ExternalLink size={14} className="opacity-40" />
            </button>
            <button 
              onClick={() => setShowPublishModal(true)}
              className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs font-bold uppercase tracking-wider hover:bg-indigo-500/10 transition-all text-left flex items-center justify-between text-indigo-600 dark:text-indigo-400"
            >
              Publish to Play Store
              <Smartphone size={14} className="opacity-60" />
            </button>
            <button 
              onClick={() => setShowMobileTestModal(true)}
              className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/10 transition-all text-left flex items-center justify-between text-emerald-600 dark:text-emerald-400"
            >
              Test on Mobile
              <Smartphone size={14} className="opacity-60" />
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-bold mb-4 flex items-center justify-between">
            Activity Log
            <button onClick={fetchActivityLogs} className="text-[10px] text-indigo-500 uppercase tracking-widest hover:underline">Refresh</button>
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {activityLogs.length === 0 ? (
              <p className="text-center py-8 text-sm text-black/20">No recent activity.</p>
            ) : (
              activityLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <div className="p-1.5 bg-black/10 dark:bg-white/10 rounded-lg mt-0.5">
                    <History size={14} className="text-black/40 dark:text-white/30" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold">{log.action}</p>
                      <p className="text-[9px] text-black/30 dark:text-white/20">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-black/50 dark:text-white/40 mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-bold mb-4">Data Management</h4>
        <div className="space-y-3">
          <button 
            onClick={handleExportCSV}
            className="w-full p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-black/40 dark:text-white/30" />
              <span className="font-medium">Export Loans to CSV (Excel)</span>
            </div>
            <Download size={16} className="text-black/20 group-hover:translate-y-0.5 transition-transform" />
          </button>
          <button 
            onClick={handleExportJSON}
            className="w-full p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-black/40 dark:text-white/30" />
              <span className="font-medium">Export Data (JSON)</span>
            </div>
            <ChevronRight size={16} className="text-black/20 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleImportJSON}
            className="w-full p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Cloud size={18} className="text-black/40 dark:text-white/30" />
              <span className="font-medium">Import Data (JSON Backup)</span>
            </div>
            <ChevronRight size={16} className="text-black/20 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            className="w-full p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-black/40 dark:text-white/30" />
              <span className="font-medium">View Terms & Conditions</span>
            </div>
            <ExternalLink size={16} className="text-black/20 group-hover:translate-x-1 transition-transform" />
          </button>

          {isInstallable && (
            <button 
              onClick={handleInstallApp}
              className="w-full p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Download size={18} className="text-indigo-500" />
                <span className="font-medium text-indigo-600 dark:text-indigo-400">Install Metrix App</span>
              </div>
              <Plus size={16} className="text-indigo-400 group-hover:rotate-90 transition-transform" />
            </button>
          )}

          <button 
            onClick={handleDeleteAccount}
            className="w-full p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left flex items-center justify-between group text-red-500"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} />
              <span className="font-medium">Delete Account</span>
            </div>
            <AlertCircle size={16} className="opacity-20" />
          </button>
        </div>
      </Card>

      <div className="text-center py-4">
        <p className="text-[10px] font-bold text-black/20 dark:text-white/10 uppercase tracking-[0.2em]">Metrix v2.0.0 • Finance Simplified</p>
      </div>
    </motion.div>
  );
};

  // --- Modals ---

  const ChitGroupModal = ({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      total_value: 100000,
      duration_months: 10,
      monthly_contribution: 10000,
      commission_percent: 5,
      start_date: new Date().toISOString().split('T')[0],
      role: 'organizer' as 'organizer' | 'member',
      organizer_name: '',
      my_slot_number: 1
    });

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={formData.role === 'organizer' ? 'Create Chit Group' : 'Join Chit Group'}>
        <div className="space-y-4">
          <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setFormData({ ...formData, role: 'organizer' })}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${formData.role === 'organizer' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-black/40 dark:text-white/40'}`}
            >
              I Organize
            </button>
            <button
              onClick={() => setFormData({ ...formData, role: 'member' })}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${formData.role === 'member' ? 'bg-indigo-500 text-white shadow-sm' : 'text-black/40 dark:text-white/40'}`}
            >
              I Joined
            </button>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Group Name</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Monthly Savings Group A"
            />
          </div>
          {formData.role === 'member' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Organizer Name</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                  value={formData.organizer_name}
                  onChange={e => setFormData({ ...formData, organizer_name: e.target.value })}
                  placeholder="Who runs it?"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">My Slot #</label>
                <input
                  type="number"
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                  value={formData.my_slot_number}
                  onChange={e => setFormData({ ...formData, my_slot_number: Number(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Total Value</label>
              <input
                type="number"
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.total_value}
                onChange={e => {
                  const val = Number(e.target.value);
                  setFormData({ ...formData, total_value: val, monthly_contribution: val / formData.duration_months });
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Duration (Months)</label>
              <input
                type="number"
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.duration_months}
                onChange={e => {
                  const dur = Number(e.target.value);
                  setFormData({ ...formData, duration_months: dur, monthly_contribution: formData.total_value / dur });
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Monthly Sub</label>
              <input
                type="number"
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 bg-black/5"
                value={formData.monthly_contribution}
                readOnly
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Commission %</label>
              <input
                type="number"
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.commission_percent}
                onChange={e => setFormData({ ...formData, commission_percent: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Start Date</label>
            <input
              type="date"
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <Button className="w-full py-4" onClick={() => onCreate(formData)}>
            {formData.role === 'organizer' ? 'Create Group' : 'Add Joined Group'}
          </Button>
        </div>
      </Modal>
    );
  };

  const AddMemberModal = ({ isOpen, onClose, onAdd, borrowers }: { isOpen: boolean, onClose: () => void, onAdd: (bid: number, slot: number, jointWith?: string, myShare?: number, partnerShare?: number) => void, borrowers: Borrower[] }) => {
    const [selectedBorrowerId, setSelectedBorrowerId] = useState<number>(0);
    const [slotNumber, setSlotNumber] = useState(1);
    const [isJoint, setIsJoint] = useState(false);
    const [jointWith, setJointWith] = useState('');
    const [myShare, setMyShare] = useState(0);
    const [partnerShare, setPartnerShare] = useState(0);

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Member to Group">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Select Contact</label>
            <select
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={selectedBorrowerId}
              onChange={e => setSelectedBorrowerId(Number(e.target.value))}
            >
              <option value={0}>Choose a contact...</option>
              {borrowers.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.phone})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Slot Number</label>
            <input
              type="number"
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={slotNumber}
              onChange={e => setSlotNumber(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5">
            <input
              type="checkbox"
              id="joint-check"
              checked={isJoint}
              onChange={e => setIsJoint(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="joint-check" className="text-sm font-medium">Joint Member (split with partner)</label>
          </div>
          {isJoint && (
            <div className="space-y-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <div>
                <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Partner Name</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                  value={jointWith}
                  onChange={e => setJointWith(e.target.value)}
                  placeholder="Name of joint partner"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">My Share ({user?.currency || '₹'})</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                    value={myShare}
                    onChange={e => setMyShare(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Partner Share ({user?.currency || '₹'})</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                    value={partnerShare}
                    onChange={e => setPartnerShare(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
          <Button className="w-full py-4" onClick={() => onAdd(selectedBorrowerId, slotNumber, isJoint ? jointWith : undefined, isJoint ? myShare : undefined, isJoint ? partnerShare : undefined)} disabled={!selectedBorrowerId}>
            Add Member
          </Button>
        </div>
      </Modal>
    );
  };

  const ChitAuctionModal = ({ isOpen, onClose, onRecord, members, group }: { isOpen: boolean, onClose: () => void, onRecord: (data: any) => void, members: ChitMember[], group: ChitGroup }) => {
    const [formData, setFormData] = useState({
      winner_id: 0,
      bid_amount: 0,
      month_number: 1,
      auction_date: new Date().toISOString().split('T')[0]
    });

    const eligibleMembers = members.filter(m => m.has_won_auction === 0);

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Record Auction">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Auction Month</label>
            <input 
              type="number" 
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.month_number}
              onChange={e => setFormData({ ...formData, month_number: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Auction Winner</label>
            <select 
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.winner_id}
              onChange={e => setFormData({ ...formData, winner_id: Number(e.target.value) })}
            >
              <option value={0}>Select winner...</option>
              {eligibleMembers.map(m => (
                <option key={m.id} value={m.id}>{m.borrower_name} (Slot {m.slot_number})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Bid Amount (Discount)</label>
            <input 
              type="number" 
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.bid_amount}
              onChange={e => setFormData({ ...formData, bid_amount: Number(e.target.value) })}
              placeholder="e.g. 5000"
            />
            <p className="text-[10px] text-indigo-500 mt-1 font-bold italic">This amount will be distributed as dividend.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Auction Date</label>
            <input 
              type="date" 
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.auction_date}
              onChange={e => setFormData({ ...formData, auction_date: e.target.value })}
            />
          </div>
          <Button className="w-full py-4" onClick={() => onRecord(formData)} disabled={!formData.winner_id}>
            Record Auction
          </Button>
        </div>
      </Modal>
    );
  };

  const ChitPaymentModal = ({ isOpen, onClose, onRecord, member, group }: { isOpen: boolean, onClose: () => void, onRecord: (data: any) => void, member: ChitMember | null, group: ChitGroup }) => {
    const [formData, setFormData] = useState({
      amount: group.monthly_contribution,
      payment_date: new Date().toISOString().split('T')[0],
      month_number: 1,
      payment_method: 'Cash',
      notes: ''
    });

    useEffect(() => {
      if (group) {
        setFormData(prev => ({ ...prev, amount: group.monthly_contribution }));
      }
    }, [group]);

    if (!member) return null;

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment: ${member.borrower_name}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Month Number</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.month_number}
                onChange={e => setFormData({ ...formData, month_number: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Amount</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Payment Date</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.payment_date}
                onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Method</label>
              <select 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Notes</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
          <Button className="w-full py-4" onClick={() => onRecord({ ...formData, chit_member_id: member.id })}>
            Record Payment
          </Button>
        </div>
      </Modal>
    );
  };

  const BulkPaymentModal = ({ isOpen, onClose, onRecord, selectedLoans }: { isOpen: boolean, onClose: () => void, onRecord: (data: any) => void, selectedLoans: Loan[] }) => {
    const [totalAmount, setTotalAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [distribution, setDistribution] = useState<{ [key: number]: number }>({});

    useEffect(() => {
      if (isOpen) {
        // Default distribution: split equally
        const equalAmount = totalAmount / selectedLoans.length;
        const newDist: { [key: number]: number } = {};
        selectedLoans.forEach(l => {
          newDist[l.id] = equalAmount;
        });
        setDistribution(newDist);
      }
    }, [isOpen, selectedLoans.length]);

    const handleTotalChange = (val: number) => {
      setTotalAmount(val);
      const equalAmount = val / selectedLoans.length;
      const newDist: { [key: number]: number } = {};
      selectedLoans.forEach(l => {
        newDist[l.id] = equalAmount;
      });
      setDistribution(newDist);
    };

    const handleDistChange = (loanId: number, val: number) => {
      const newDist = { ...distribution, [loanId]: val };
      setDistribution(newDist);
      const newTotal = Object.values(newDist).reduce((sum, v) => sum + v, 0);
      setTotalAmount(newTotal);
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Bulk Payment">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Total Amount</label>
            <input 
              type="number" 
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
              value={totalAmount}
              onChange={e => handleTotalChange(Number(e.target.value))}
            />
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto p-1">
            {selectedLoans.map(loan => (
              <div key={loan.id} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl flex justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold">Loan #{loan.id}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/30">Balance: {user?.currency || '₹'}{(loan.balance || 0).toLocaleString()}</p>
                </div>
                <input 
                  type="number" 
                  className="w-24 p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm"
                  value={distribution[loan.id] || 0}
                  onChange={e => handleDistChange(loan.id, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Payment Date</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Notes</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Bulk payment"
              />
            </div>
          </div>
          <Button className="w-full py-4" onClick={() => onRecord({
            payments: Object.entries(distribution).map(([id, amt]) => ({ loan_id: Number(id), amount: amt })),
            payment_date: paymentDate,
            notes
          })}>
            Record Bulk Payment
          </Button>
        </div>
      </Modal>
    );
  };

  const ConsolidateModal = ({ isOpen, onClose, onConsolidate, selectedLoans }: { isOpen: boolean, onClose: () => void, onConsolidate: (ids: number[], details: any) => void, selectedLoans: Loan[] }) => {
    const totalBalance = selectedLoans.reduce((sum, l) => sum + (l.balance || 0), 0);
    const [formData, setFormData] = useState<{
      loan_type: 'Interest Only' | 'Installment';
      interest_type: 'Daily' | 'Weekly' | 'Monthly';
      interest_rate: number;
      installment_amount: number;
      start_date: string;
      duration: number;
    }>({
      loan_type: 'Interest Only',
      interest_type: 'Monthly',
      interest_rate: 2,
      installment_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      duration: 12
    });

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Consolidate Loans">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Total Outstanding Balance</p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{user?.currency || '₹'}{totalBalance.toLocaleString()}</h3>
            <p className="text-[10px] text-black/40 dark:text-white/30 mt-1">This will be the principal for the new consolidated loan.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Loan Type</label>
              <select 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.loan_type}
                onChange={e => setFormData({ ...formData, loan_type: e.target.value as any })}
              >
                <option value="Interest Only">Interest Only</option>
                <option value="Installment">Installment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Interest Type</label>
              <select 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.interest_type}
                onChange={e => setFormData({ ...formData, interest_type: e.target.value as any })}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Interest Rate (%)</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.interest_rate}
                onChange={e => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
              />
            </div>
            {formData.loan_type === 'Installment' && (
              <div>
                <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Installment Amount</label>
                <input 
                  type="number" 
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                  value={formData.installment_amount}
                  onChange={e => setFormData({ ...formData, installment_amount: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Start Date</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Duration (Months)</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
              />
            </div>
          </div>

          <Button className="w-full py-4" onClick={() => onConsolidate(selectedLoans.map(l => l.id), formData)}>
            Consolidate & Create New Loan
          </Button>
        </div>
      </Modal>
    );
  };

  const BulkChitPaymentModal = ({ isOpen, onClose, onRecord, selectedMembers, group }: { isOpen: boolean, onClose: () => void, onRecord: (data: any) => void, selectedMembers: ChitMember[], group: ChitGroup }) => {
    const [monthNumber, setMonthNumber] = useState(1);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [distribution, setDistribution] = useState<{ [key: number]: number }>({});

    useEffect(() => {
      if (isOpen && group) {
        const newDist: { [key: number]: number } = {};
        selectedMembers.forEach(m => {
          newDist[m.id] = group.monthly_contribution;
        });
        setDistribution(newDist);
      }
    }, [isOpen, selectedMembers.length, group]);

    const handleDistChange = (memberId: number, val: number) => {
      setDistribution({ ...distribution, [memberId]: val });
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Bulk Chit Payment">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Month Number</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={monthNumber}
                onChange={e => setMonthNumber(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/40 dark:text-white/30 mb-1 block">Payment Date</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto p-1">
            {selectedMembers.map(member => (
              <div key={member.id} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl flex justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold">{member.borrower_name}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/30">Slot #{member.slot_number}</p>
                </div>
                <input 
                  type="number" 
                  className="w-24 p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm"
                  value={distribution[member.id] || 0}
                  onChange={e => handleDistChange(member.id, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
          <Button className="w-full py-4" onClick={() => onRecord({
            chit_group_id: group.id,
            payments: Object.entries(distribution).map(([id, amt]) => ({ chit_member_id: Number(id), amount: amt })),
            month_number: monthNumber,
            payment_date: paymentDate
          })}>
            Record Bulk Payments
          </Button>
        </div>
      </Modal>
    );
  };

  const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">{title}</h3>
              <button onClick={onClose} aria-label="Close dialog" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
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

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
        <Suspense fallback={null}>
          <LoginBg />
        </Suspense>
        <Card className="w-full max-w-md p-8 relative z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-white/20 dark:border-white/10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-black text-3xl mb-4 shadow-xl">M</div>
            <h1 className="text-3xl font-black tracking-tighter">Metrix</h1>
            <p className="text-black/40 dark:text-white/30 text-sm font-bold uppercase tracking-widest mt-1">
              {isLogin ? 'Access Vault' : 'Initialize Account'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <Input label="Username or Email" name="username" required placeholder="admin" />
            <Input label="Password" name="password" type="password" required placeholder="••••••••" />
            
            {!isLogin && (
              <>
                <Input label="Email Address (Optional)" name="email" type="email" placeholder="you@example.com" />
                <Select 
                  label="Security Question" 
                  name="recovery_question" 
                  required 
                  options={[
                    { value: '', label: 'Select a question...' },
                    { value: 'What is your mother\'s maiden name?', label: 'What is your mother\'s maiden name?' },
                    { value: 'What was the name of your first pet?', label: 'What was the name of your first pet?' },
                    { value: 'What city were you born in?', label: 'What city were you born in?' },
                    { value: 'What was your first car?', label: 'What was your first car?' },
                    { value: 'What is your favorite book?', label: 'What is your favorite book?' }
                  ]} 
                />
                <Input label="Security Answer" name="recovery_answer" required placeholder="Your answer" />
                <div className="flex items-start gap-3 p-1">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-black/10 dark:border-white/10 text-black focus:ring-black/5"
                    required
                  />
                  <label htmlFor="terms" className="text-[10px] font-medium text-black/50 dark:text-white/40 leading-tight">
                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-black dark:text-white underline font-bold">Terms & Conditions</button> and acknowledge that I am solely responsible for all data entered.
                  </label>
                </div>
              </>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowRecoveryModal(true);
                    setRecoveryStep('find');
                  }}
                  className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold"
              >
                <AlertCircle size={14} /> {authError}
              </motion.div>
            )}

            <Button type="submit" className="w-full py-3 mt-2">
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-overlay css-particles">
      <AuroraBackground />
      {/* Sidebar / Nav */}
      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 lg:w-64 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-black/5 dark:border-white/5 z-40 flex md:flex-col">
        <div className="hidden md:flex p-6 mb-4">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl">M</div>
          <span className="hidden lg:block ml-3 font-black text-xl tracking-tight">Metrix</span>
        </div>
        
        <div className="flex flex-1 justify-around md:flex-col md:justify-start md:px-3 gap-1 py-2 md:py-0">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'borrowers', icon: Users, label: 'Contacts' },
            { id: 'loans', icon: HandCoins, label: 'Loans' },
            { id: 'chitfunds', icon: CircleDollarSign, label: 'Chit Funds' },
            { id: 'reports', icon: FileText, label: 'Reports' },
            { id: 'settings', icon: Settings, label: 'Settings' }
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
        <header className="sticky top-0 bg-[#F8F9FA]/80 dark:bg-zinc-950/80 backdrop-blur-md z-30 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center border-b border-black/5 dark:border-white/5">
          <h1 className="text-xl md:text-2xl font-black tracking-tight capitalize">{activeTab}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5">
              {user?.pin_enabled === 1 && (
                <button 
                  onClick={() => setIsLocked(true)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer mr-1"
                  aria-label="Lock app"
                >
                  <Lock size={18} className="text-black/40 dark:text-white/30" />
                </button>
              )}
              <button 
                type="button"
                onClick={() => setDarkMode(prev => !prev)}
                className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-black/5 dark:border-white/5 hover:scale-105 transition-all cursor-pointer"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-zinc-600" />}
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full border border-black/5 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-white/50 shadow-sm">
              <Calendar size={14} className="text-black/30 dark:text-white/20" /> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowUserMenu(prev => !prev)}
                className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black border border-black/5 dark:border-white/5 flex items-center justify-center font-black text-xs cursor-pointer shadow-lg"
              >
                {user?.username?.[0].toUpperCase() || 'U'}
              </motion.div>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-12 right-0 w-64 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm">
                          {user?.username?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{user?.username}</p>
                          <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-wider">
                            {user?.is_premium === 1 ? 'Premium Account' : 'Free Account'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setShowUserMenu(false); setActiveTab('settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Settings size={16} className="text-black/50 dark:text-white/50" />
                        Account Settings
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 text-black px-8 py-2 flex items-center justify-center gap-2 text-xs font-bold overflow-hidden"
            >
              <WifiOff size={14} />
              You are offline — viewing cached data.
              {pendingCount > 0 && ` ${pendingCount} change${pendingCount > 1 ? 's' : ''} pending sync.`}
            </motion.div>
          )}
          {isOnline && pendingCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-500 text-white px-8 py-2 flex items-center justify-center gap-2 text-xs font-bold overflow-hidden cursor-pointer"
              onClick={async () => {
                await flushQueue();
                setPendingCount(getQueue().length);
                fetchStats(); fetchBorrowers(); fetchLoans(); fetchChitGroups();
              }}
            >
              <Wifi size={14} />
              Back online! {pendingCount} pending change{pendingCount > 1 ? 's' : ''} — tap to sync now.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
              {activeTab === 'chitfunds' && <ChitFundsView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showRecoveryModal && (
          <Modal 
            isOpen={showRecoveryModal} 
            onClose={() => setShowRecoveryModal(false)} 
            title="Account Recovery"
          >
            <div className="space-y-6">
              {recoveryStep === 'find' && (
                <div className="space-y-6">
                  <form onSubmit={handleRecoveryFind} className="space-y-4">
                    <p className="text-sm text-black/40 dark:text-white/30">Enter your username or email address to recover your password.</p>
                    <Input 
                      label="Username or Email" 
                      value={recoveryIdentifier} 
                      onChange={(e) => setRecoveryIdentifier(e.target.value)} 
                      required 
                      placeholder="admin" 
                    />
                    {recoveryError && <p className="text-xs font-bold text-red-500">{recoveryError}</p>}
                    <Button type="submit" className="w-full py-3">Find Account & Reset Password</Button>
                  </form>

                  <div className="pt-6 border-t border-black/5 dark:border-white/5">
                    <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-3">Forgot Username?</p>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setRecoveryError('');
                        const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                        try {
                          const res = await offlineFetch('/api/auth/recovery/find-username', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                          });
                          const result = await res.json();
                          if (res.ok) {
                            showToast(`Your username is: ${result.username}`);
                          } else {
                            setRecoveryError(result.error);
                          }
                        } catch (err) {
                          setRecoveryError('Network error');
                        }
                      }} 
                      className="space-y-3"
                    >
                      <Input label="Registered Email" name="email" type="email" required placeholder="you@example.com" />
                      <Button type="submit" className="w-full py-2 bg-black/5 dark:bg-white/5 text-black dark:text-white border border-black/10 dark:border-white/10">Retrieve Username</Button>
                    </form>
                  </div>
                </div>
              )}

              {recoveryStep === 'question' && (
                <form onSubmit={handleRecoveryReset} className="space-y-4">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Security Question</p>
                    <p className="font-bold text-sm">{recoveryQuestion}</p>
                  </div>
                  <Input 
                    label="Your Answer" 
                    value={recoveryAnswer} 
                    onChange={(e) => setRecoveryAnswer(e.target.value)} 
                    required 
                    placeholder="Type your answer here" 
                  />
                  <Input 
                    label="New Password" 
                    type="password"
                    value={recoveryNewPassword} 
                    onChange={(e) => setRecoveryNewPassword(e.target.value)} 
                    required 
                    placeholder="••••••••" 
                  />
                  {recoveryError && <p className="text-xs font-bold text-red-500">{recoveryError}</p>}
                  {recoverySuccess && <p className="text-xs font-bold text-emerald-500">{recoverySuccess}</p>}
                  <Button type="submit" className="w-full py-3">Reset Password</Button>
                  <button 
                    type="button" 
                    onClick={() => setRecoveryStep('find')}
                    className="w-full text-xs font-bold text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Go Back
                  </button>
                </form>
              )}
            </div>
          </Modal>
        )}

        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#F8F9FA] dark:bg-zinc-950 flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <Card className="w-full max-w-xs p-8 text-center shadow-2xl border-black/5 dark:border-white/5" noHover>
              <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2">App Locked</h2>
              <p className="text-sm text-black/40 dark:text-white/30 mb-8">Enter your 4-digit security PIN to continue.</p>
              
              <form onSubmit={handlePinVerify} className="space-y-6">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${pinInput.length > i ? 'bg-black dark:bg-white border-black dark:border-white scale-110' : 'border-black/10 dark:border-white/10'}`}
                    />
                  ))}
                </div>
                
                <input 
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                    if (val.length === 4) {
                      // Auto-submit could be here but we'll use the form
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none"
                />

                {pinError && <p className="text-xs font-bold text-red-500 animate-shake">{pinError}</p>}
                
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => pinInput.length < 4 && setPinInput(prev => prev + num)}
                      className="h-14 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xl transition-all active:scale-90"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPinInput('')}
                    className="h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 font-bold text-xs uppercase transition-all active:scale-90"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => pinInput.length < 4 && setPinInput(prev => prev + '0')}
                    className="h-14 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xl transition-all active:scale-90"
                  >
                    0
                  </button>
                  <button
                    type="submit"
                    className="h-14 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center transition-all active:scale-90"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </form>
              
              <button 
                onClick={handleLogout}
                className="mt-8 text-xs font-bold text-black/30 dark:text-white/20 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Logout Account
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal 
        isOpen={showBorrowerModal} 
        onClose={() => setShowBorrowerModal(false)} 
        title="Add New Contact"
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
          <Button type="submit" className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Contact'}</Button>
        </form>
      </Modal>

      <Modal
        isOpen={showEditBorrowerModal}
        onClose={() => { setShowEditBorrowerModal(false); setEditingBorrower(null); }}
        title="Edit Contact"
      >
        {editingBorrower && (
          <form onSubmit={handleEditBorrower} className="space-y-4">
            <Input label="Full Name" name="name" required defaultValue={editingBorrower.name} />
            <Input label="Phone Number" name="phone" required defaultValue={editingBorrower.phone} />
            <Input label="Address" name="address" defaultValue={editingBorrower.address} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 ml-1">Notes</label>
              <textarea
                name="notes"
                defaultValue={editingBorrower.notes || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all bg-white dark:bg-zinc-800 text-black dark:text-white min-h-[100px]"
              />
            </div>
            <Button type="submit" className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Update Contact'}</Button>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        title="Create New Loan"
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <Select 
            label="Select Contact" 
            name="borrower_id" 
            required 
            options={[
              { value: '', label: 'Choose a contact...' },
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
            <Input label={`Loan Amount (${user?.currency || '₹'})`} name="amount" type="number" required placeholder="10000" />
            <Input label={`Cash Given (${user?.currency || '₹'})`} name="given_amount" type="number" required placeholder="8000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interest Rate (%)" name="interest_rate" type="number" step="0.1" placeholder="5.0" />
            <Input label={`Installment (${user?.currency || '₹'})`} name="installment_amount" type="number" placeholder="100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (Optional)" name="duration" type="number" placeholder="12" />
          </div>
          <p className="text-[10px] text-black/40 italic">* For Installment plans, set the fixed amount per day/week. For Interest Only, set the rate.</p>
          <Button type="submit" className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Loan'}</Button>
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
            <Input label={`Loan Amount (${user?.currency || '₹'})`} name="amount" type="number" required defaultValue={selectedLoan?.amount} />
            <Input label={`Cash Given (${user?.currency || '₹'})`} name="given_amount" type="number" required defaultValue={selectedLoan?.given_amount} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interest Rate (%)" name="interest_rate" type="number" step="0.1" defaultValue={selectedLoan?.interest_rate} />
            <Input label={`Installment (${user?.currency || '₹'})`} name="installment_amount" type="number" defaultValue={selectedLoan?.installment_amount || ''} />
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
          <Button type="submit" className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Loan'}</Button>
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
              <span className="font-bold">{user?.currency || '₹'}{(selectedLoan?.currentPrincipal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-black/50">Interest Accrued:</span>
              <span className="font-bold text-emerald-600">+{user?.currency || '₹'}{(selectedLoan?.accruedInterest || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-black/5">
              <span className="text-black/50">Total Balance:</span>
              <span className="font-bold">{user?.currency || '₹'}{(selectedLoan?.balance || 0).toLocaleString()}</span>
            </div>
          </div>
          <Input label={`Payment Amount (${user?.currency || '₹'})`} name="amount" type="number" required placeholder="200" />
          <Input label="Payment Date" name="payment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          <Input label="Notes" name="notes" placeholder="Cash payment" />
          <Button type="submit" className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Recording...' : 'Record Payment'}</Button>
        </form>
      </Modal>

      <Modal
        isOpen={showEditPaymentModal}
        onClose={() => { setShowEditPaymentModal(false); setEditingPayment(null); }}
        title={`Edit Payment #${editingPayment?.id}`}
      >
        <form onSubmit={handleEditPayment} className="space-y-4">
          <Input label={`Amount (${user?.currency || '₹'})`} name="amount" type="number" required defaultValue={editingPayment?.amount} />
          <Input label="Payment Date" name="payment_date" type="date" required defaultValue={editingPayment?.payment_date} />
          <Input label="Notes" name="notes" placeholder="Notes" defaultValue={editingPayment?.notes} />
          <Button type="submit" className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Payment'}</Button>
        </form>
      </Modal>

      <Modal
        isOpen={showCapitalModal}
        onClose={() => setShowCapitalModal(false)}
        title="Update Total Capital"
      >
        <form onSubmit={handleUpdateCapital} className="space-y-4">
          <Input 
            label={`Total Invested Capital (${user?.currency || '₹'})`} 
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

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Global Terms of Service"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs text-black/70 dark:text-white/60 leading-relaxed">
          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">1. Acceptance of Terms</h4>
            <p>By creating an account or using this service, you agree to be bound by these Global Terms of Service. This agreement applies to all users regardless of their geographical location.</p>
          </section>
          
          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">2. User Responsibility & Data Ownership</h4>
            <p>Metrix is a record-keeping utility. You retain full ownership and are solely responsible for the accuracy, legality, and validity of all data entered. You must ensure that your use of this tool complies with all local laws and regulations in your jurisdiction.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">3. Not a Financial Institution</h4>
            <p>This application is NOT a bank, lender, or financial service provider. It is a personal productivity tool for tracking private debts. You are responsible for obtaining any necessary licenses or permits required for money lending in your country or state.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">4. Absolute Limitation of Liability</h4>
            <p>To the maximum extent permitted by law, the developer shall NOT be liable for any direct, indirect, incidental, or consequential damages, including financial loss, legal disputes, or data breaches. You use this service entirely at your own risk.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">5. Privacy & Global Data Standards</h4>
            <p>We respect your privacy and aim to comply with global data protection standards. Your data is processed only to provide the service. You have the right to export or delete your data at any time via the Settings menu.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">6. Indemnification</h4>
            <p>You agree to indemnify, defend, and hold harmless the developer from any claims, liabilities, or expenses arising from your use of the application or any breach of these terms.</p>
          </section>
        </div>
        <Button onClick={() => setShowTermsModal(false)} className="w-full mt-6">I Accept & Understand</Button>
      </Modal>

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs text-black/70 dark:text-white/60 leading-relaxed">
          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">1. Information Collection</h4>
            <p>We collect your username and email address for account management. We also store the loan and contact records you enter into the application. This data is stored on our secure servers and is used solely to provide the service to you.</p>
          </section>
          
          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">2. Data Security</h4>
            <p>We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">3. Data Sharing</h4>
            <p>We do not sell or share your personal data with third parties, except as required by law.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">4. Your Rights</h4>
            <p>You have the right to access, export, or delete your data at any time. You can do this directly from the Settings menu within the application.</p>
          </section>
        </div>
        <Button onClick={() => setShowPrivacyModal(false)} className="w-full mt-6">Close</Button>
      </Modal>

      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="Refund & Cancellation Policy"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs text-black/70 dark:text-white/60 leading-relaxed">
          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">1. Subscription Cancellation</h4>
            <p>You can cancel your subscription at any time. However, please note that we do not offer pro-rated refunds for the remaining period of your subscription.</p>
          </section>
          
          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">2. Refund Eligibility</h4>
            <p>Refunds are generally not provided for digital subscriptions. In exceptional cases (e.g., duplicate payments or technical errors), you may contact support within 48 hours of the transaction.</p>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-1 uppercase tracking-wider">3. Processing Refunds</h4>
            <p>Approved refunds will be processed within 5-7 working days and credited back to the original payment method used during the transaction.</p>
          </section>
        </div>
        <Button onClick={() => setShowRefundModal(false)} className="w-full mt-6">Close</Button>
      </Modal>

      <Modal
        isOpen={showMobileTestModal}
        onClose={() => setShowMobileTestModal(false)}
        title="Test on Mobile Device"
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center p-4 bg-white rounded-2xl border border-black/5">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}`}
              alt="QR Code"
              className="w-48 h-48"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-bold">Scan to open on your phone</p>
            <p className="text-xs text-black/50 dark:text-white/40">
              Open your camera and point it at the QR code above.
            </p>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-left">
            <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">How to install:</h5>
            <ol className="text-[10px] space-y-2 text-black/70 dark:text-white/60">
              <li>1. Scan the QR code with your mobile camera.</li>
              <li>2. Open the link in Chrome (Android) or Safari (iOS).</li>
              <li>3. Tap the <b>Menu</b> (three dots) or <b>Share</b> icon.</li>
              <li>4. Select <b>"Add to Home Screen"</b>.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-black/30 uppercase font-bold tracking-tighter">Direct Link:</p>
            <code className="p-2 bg-black/5 dark:bg-white/5 rounded-lg text-[10px] break-all">
              {window.location.origin}
            </code>
          </div>
        </div>
        <Button onClick={() => setShowMobileTestModal(false)} className="w-full mt-6">Close</Button>
      </Modal>

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish to Google Play Store"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 text-xs text-black/70 dark:text-white/60 leading-relaxed">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <p className="text-indigo-600 dark:text-indigo-400 font-bold mb-2 flex items-center gap-2">
              <Smartphone size={16} /> Mobile Ready!
            </p>
            <p>I have already integrated <b>Capacitor</b> and <b>Vite PWA</b> into your project. This means your app is technically ready to be converted into an Android App Bundle (.aab) for the Play Store.</p>
          </div>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-2 uppercase tracking-wider">Step 1: Local Environment Setup</h4>
            <p>Since publishing requires building native code, you need to perform the final build on your local computer:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Download your project code.</li>
              <li>Install <b>Node.js</b> and <b>Android Studio</b>.</li>
              <li>Run <code className="bg-black/5 px-1 rounded">npm install</code>.</li>
            </ul>
          </section>
          
          <section>
            <h4 className="font-bold text-black dark:text-white mb-2 uppercase tracking-wider">Step 2: Generate Android Project</h4>
            <p>Run these commands in your terminal:</p>
            <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl font-mono mt-2 space-y-1">
              <p>npm run build</p>
              <p>npx cap add android</p>
              <p>npx cap sync</p>
              <p>npx cap open android</p>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-black dark:text-white mb-2 uppercase tracking-wider">Step 3: Play Console Requirements</h4>
            <ul className="list-disc ml-4 mt-2 space-y-2">
              <li><b>Developer Account:</b> Create one at <a href="https://play.google.com/console" target="_blank" className="text-indigo-500 underline">play.google.com/console</a> ($25 one-time fee).</li>
              <li><b>App Icons:</b> You'll need a 512x512 icon and a 1024x500 feature graphic.</li>
              <li><b>Privacy Policy:</b> Use the one I've already built into the app!</li>
            </ul>
          </section>

          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <p className="text-amber-600 dark:text-amber-400 font-bold mb-1">💡 Pro Tip</p>
            <p>Before the Play Store, you can test it as a <b>PWA</b>. Just open this URL on your Android phone and select "Add to Home Screen" from the browser menu.</p>
          </div>
        </div>
        <Button onClick={() => setShowPublishModal(false)} className="w-full mt-6">Got it, Let's Go!</Button>
      </Modal>

      {/* Contact Profile View */}
      <AnimatePresence>
        {viewingBorrowerProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBorrowerProfile}
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
                <button onClick={closeBorrowerProfile} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-xl font-bold">Contact Profile</h3>
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
                    <p className="text-black/40 dark:text-white/30 font-mono">Contact ID: #{viewingBorrowerProfile.id}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="secondary" className="text-xs py-1.5" onClick={() => openEditBorrower(viewingBorrowerProfile)}><Edit2 size={14} /> Edit</Button>
                      <Button variant="danger" className="text-xs py-1.5" onClick={() => handleDeleteBorrower(viewingBorrowerProfile)}><Trash2 size={14} /> Delete</Button>
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
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500"
                        checked={loans.filter(l => l.borrower_id === viewingBorrowerProfile.id && l.status === 'Active').length > 0 && loans.filter(l => l.borrower_id === viewingBorrowerProfile.id && l.status === 'Active').every(l => selectedLoanIds.includes(l.id))}
                        onChange={(e) => {
                          const activeLoans = loans.filter(l => l.borrower_id === viewingBorrowerProfile.id && l.status === 'Active');
                          if (e.target.checked) setSelectedLoanIds([...new Set([...selectedLoanIds, ...activeLoans.map(l => l.id)])]);
                          else setSelectedLoanIds(selectedLoanIds.filter(id => !activeLoans.map(l => l.id).includes(id)));
                        }}
                      />
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <HandCoins size={20} /> Loan History
                      </h4>
                    </div>
                    {selectedLoanIds.length > 0 && (
                      <div className="flex gap-2">
                        <Button variant="secondary" className="text-xs py-1.5" onClick={() => setShowBulkPaymentModal(true)}>
                          Bulk Pay ({selectedLoanIds.length})
                        </Button>
                        <Button variant="secondary" className="text-xs py-1.5" onClick={() => setShowConsolidateModal(true)}>
                          Consolidate ({selectedLoanIds.length})
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {loans.filter(l => l.borrower_id === viewingBorrowerProfile.id).map(loan => (
                      <Card key={loan.id} className={`p-5 transition-all ${selectedLoanIds.includes(loan.id) ? 'border-indigo-500 bg-indigo-500/5' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-3">
                            {loan.status === 'Active' && (
                              <input 
                                type="checkbox" 
                                className="mt-1 w-4 h-4 rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500"
                                checked={selectedLoanIds.includes(loan.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedLoanIds([...selectedLoanIds, loan.id]);
                                  else setSelectedLoanIds(selectedLoanIds.filter(id => id !== loan.id));
                                }}
                              />
                            )}
                            <div>
                              <p className="text-xs font-bold text-black/40 dark:text-white/30 uppercase">Loan #{loan.id} • {loan.loan_type}</p>
                              <h5 className="text-xl font-bold">{user?.currency || '₹'}{(loan.balance || 0).toLocaleString()}</h5>
                              <p className="text-[10px] text-black/40 dark:text-white/30">Principal: {user?.currency || '₹'}{(loan.amount || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${loan.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/40'}`}>
                            {loan.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                          <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <p className="text-black/40 dark:text-white/30 mb-0.5">{loan.loan_type === 'Installment' ? 'Installment' : 'Rate'}</p>
                            <p className="font-bold">{loan.loan_type === 'Installment' ? `${user?.currency || '₹'}${loan.installment_amount}` : `${loan.interest_rate}%`}</p>
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
                        {loan.status === 'Active' && loan.loan_type === 'Interest Only' && new Date(loan.start_date) < new Date() && (
                          <button
                            onClick={() => handleGenerateInterest(loan.id)}
                            className="w-full mt-2 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                          >
                            <RefreshCw size={12} /> Auto-Generate Past Interest Entries
                          </button>
                        )}
                        <button
                          onClick={() => toggleLoanPayments(loan.id)}
                          className="w-full mt-2 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          <Clock size={12} /> Payment History {expandedLoanId === loan.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <AnimatePresence>
                          {expandedLoanId === loan.id && expandedLoanPayments[loan.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-2">
                                {expandedLoanPayments[loan.id].length === 0 ? (
                                  <p className="text-xs text-black/40 dark:text-white/30 text-center py-3">No payments recorded yet</p>
                                ) : (
                                  expandedLoanPayments[loan.id].map(payment => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl text-xs">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{user?.currency || '₹'}{payment.amount.toLocaleString()}</span>
                                          <span className="text-black/30 dark:text-white/20">•</span>
                                          <span className="text-black/50 dark:text-white/40">{new Date(payment.payment_date).toLocaleDateString()}</span>
                                        </div>
                                        {payment.notes && <p className="text-[10px] text-black/40 dark:text-white/30 mt-0.5">{payment.notes}</p>}
                                      </div>
                                      <div className="flex gap-1 ml-2">
                                        <button
                                          onClick={() => { setEditingPayment(payment); setShowEditPaymentModal(true); }}
                                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDeletePayment(payment.id, loan.id)}
                                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {loan.status === 'Active' && (
                          <button
                            onClick={() => sendWhatsAppReminder(viewingBorrowerProfile, loan)}
                            className="w-full mt-2 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                          >
                            <Phone size={12} /> Send WhatsApp Reminder
                          </button>
                        )}
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
