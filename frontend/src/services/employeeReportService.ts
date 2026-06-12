import api from './api';

export interface EmployeeRevenue {
  employee_id: number;
  employee_name: string;
  revenue: number;
  total_orders: number;
  total_customers: number;
  avg_order_value: number;
}

export interface EmployeeDashboard {
  total_revenue: number;
  total_orders: number;
  total_sales_employees: number;
  best_employee: EmployeeRevenue | null;
}

export interface EmployeeMonthlyRevenue {
  month: string;
  revenue: number;
}

export interface TopCustomer {
  customer_name: string;
  revenue: number;
}

export interface EmployeeRevenueDetail {
  employee_id: number;
  employee_name: string;
  email: string;
  revenue: number;
  total_orders: number;
  total_customers: number;
  avg_order_value: number;
  monthly_revenue: EmployeeMonthlyRevenue[];
  top_customers: TopCustomer[];
}

const employeeReportService = {
  getRevenueByEmployee: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get<EmployeeRevenue[]>('/reports/revenue/employee/', { params });
    return response.data;
  },

  getTopSales: async (limit: number = 10) => {
    const response = await api.get<EmployeeRevenue[]>('/reports/revenue/employee/top-sales', { params: { limit } });
    return response.data;
  },

  getEmployeeDashboard: async () => {
    const response = await api.get<EmployeeDashboard>('/reports/revenue/employee/dashboard');
    return response.data;
  },

  getEmployeeRevenueDetail: async (employeeId: number) => {
    const response = await api.get<EmployeeRevenueDetail>(`/reports/revenue/employee/${employeeId}`);
    return response.data;
  }
};

export default employeeReportService;
