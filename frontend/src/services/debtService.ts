import api from './api';
import { CustomerDebt, CustomerDebtListItem, DebtPaymentCreate, DebtSummary, CustomerDebtUpdate } from '../types/debt';

const debtService = {
  getDebts: async (params?: {
    customer_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get<CustomerDebtListItem[]>('/customer-debts/', { params });
    return response.data;
  },

  getDebtDetail: async (id: number) => {
    const response = await api.get<CustomerDebt>(`/customer-debts/${id}`);
    return response.data;
  },

  updateDebt: async (id: number, data: CustomerDebtUpdate) => {
    const response = await api.patch<CustomerDebt>(`/customer-debts/${id}`, data);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get<DebtSummary>('/customer-debts/dashboard/summary');
    return response.data;
  },

  recordPayment: async (debtId: number, data: DebtPaymentCreate) => {
    const response = await api.post<CustomerDebt>(`/customer-debts/${debtId}/payment`, data);
    return response.data;
  },

  createFromOrder: async (orderId: number) => {
    const response = await api.post<CustomerDebt>(`/customer-debts/create-from-order/${orderId}`);
    return response.data;
  },

  getDebtsByCustomer: async (customerId: number) => {
    const response = await api.get<CustomerDebtListItem[]>(`/customer-debts/customer/${customerId}`);
    return response.data;
  },
};

export default debtService;
