import api from './api';

export interface RevenueByChannel {
  channel: string;
  channel_name: string;
  revenue: number;
  total_orders: number;
  total_customers: number;
  percentage: number;
}

export interface RevenueByCustomer {
  customer_id: number;
  customer_name: string;
  customer_type: string;
  revenue: number;
  total_orders: number;
  last_order_date: string;
  percentage: number;
}

export interface RevenueByStaff {
  staff_id: number;
  staff_name: string;
  revenue: number;
  total_orders: number;
  total_customers: number;
  percentage: number;
}

export const getRevenueByChannel = async (startDate?: string, endDate?: string): Promise<RevenueByChannel[]> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await api.get<RevenueByChannel[]>('/reports/revenue/channel', { params });
  return response.data;
};

export const getRevenueByCustomer = async (startDate?: string, endDate?: string, limit: number = 50): Promise<RevenueByCustomer[]> => {
  const params: any = { limit };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await api.get<RevenueByCustomer[]>('/reports/revenue/customer', { params });
  return response.data;
};

export const getRevenueByStaff = async (startDate?: string, endDate?: string): Promise<RevenueByStaff[]> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await api.get<RevenueByStaff[]>('/reports/revenue/staff', { params });
  return response.data;
};
