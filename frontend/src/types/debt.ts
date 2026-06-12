export enum DebtStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export interface DebtPayment {
  id: number;
  debt_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  note: string;
  created_by: number;
  created_at: string;
  user: {
    username: string;
    full_name: string;
  };
}

export interface CustomerDebt {
  id: number;
  customer_id: number;
  order_id: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
  customer: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
  };
  order: {
    id: number;
    total_amount: number;
    created_at: string;
  };
  payments: DebtPayment[];
}

export interface CustomerDebtListItem {
  id: number;
  customer_id: number;
  order_id: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  status: DebtStatus;
  created_at: string;
  customer_name: string;
  order_code: string;
}

export interface DebtSummary {
  total_debt: number;
  total_paid: number;
  total_remaining: number;
  overdue_amount: number;
  overdue_count: number;
  top_debt_customers: {
    name: string;
    amount: number;
  }[];
}

export interface DebtPaymentCreate {
  amount: number;
  payment_method: string;
  payment_date?: string;
  note?: string;
}

export interface CustomerDebtUpdate {
  due_date?: string;
  status?: DebtStatus;
}
