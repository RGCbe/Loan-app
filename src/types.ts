export interface Borrower {
  id: number;
  name: string;
  phone: string;
  address: string;
  notes: string;
  created_at: string;
}

export interface Loan {
  id: number;
  borrower_id: number;
  borrower_name?: string;
  amount: number;
  given_amount: number;
  loan_type: 'Interest Only' | 'Installment';
  direction: 'Lent' | 'Borrowed';
  interest_type: 'Daily' | 'Weekly' | 'Monthly';
  interest_rate: number;
  installment_amount?: number;
  start_date: string;
  duration?: number;
  status: 'Active' | 'Closed';
  created_at: string;
  paid_amount?: number; // Total amount paid
  accruedInterest?: number; // Current accrued interest
  balance?: number; // Total outstanding balance (Principal + Interest)
  currentPrincipal?: number; // Current remaining principal
}

export interface Payment {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  notes: string;
  created_at: string;
}

export interface Stats {
  totalGiven: number;
  totalBorrowed: number;
  totalCollected: number;
  activeBorrowers: number;
  investedCapital: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  is_premium: number;
  backup_enabled: number;
  currency: string;
  pin_enabled: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
}
