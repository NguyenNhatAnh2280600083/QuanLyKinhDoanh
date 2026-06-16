import api from './api';

export interface ProductionPlan {
  id: number;
  plan_code: string;
  product_id: number;
  planned_quantity: number;
  completed_quantity: number;
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
  started_at?: string | null;
  completed_at?: string | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress_percent: number;
  note: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
    stock_quantity: number;
    price: number;
  };
  creator?: {
    id: number;
    username: string;
    full_name: string;
  };
  order_id?: number | null;
}

export interface ProductionPlanCreate {
  product_id: number;
  planned_quantity: number;
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
  note?: string;
}

export interface MaterialRequirement {
  name: string;
  material: string;
  required: number;
  stock: number;
  enough: boolean;
  missing: number;
}

export interface UpdateProgressData {
  completed_quantity: number;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface MaterialRequirementsResponse {
  materials: MaterialRequirement[];
}

export interface DashboardData {
  total_plans: number;
  planned: number;
  in_progress: number;
  completed: number;
  completion_rate: number;
  weekly_volume: { name: string; planned: number; completed: number }[];
  weekly_progress: { name: string; progress: number }[];
  status_distribution: { name: string; value: number; label: string }[];
}

const productionPlanService = {
  getPlans: async (params?: {
    week_number?: number;
    year?: number;
    status?: string;
    product_id?: number;
  }) => {
    const res = await api.get<{ items: ProductionPlan[]; total: number }>('/production-plans/', { params });
    return res.data;
  },
  createPlan: async (data: ProductionPlanCreate) => {
    const res = await api.post<ProductionPlan>('/production-plans/', data);
    return res.data;
  },
  getPlanDetail: async (id: number) => {
    const res = await api.get<ProductionPlan>(`/production-plans/${id}`);
    return res.data;
  },
  updateProgress: async (id: number, data: UpdateProgressData) => {
    const res = await api.put<{
      plan_code: string;
      planned_quantity: number;
      completed_quantity: number;
      progress_percent: number;
      status: string;
    }>(`/production-plans/${id}/progress`, data);
    return res.data;
  },
  completePlan: async (id: number, data?: UpdateProgressData) => {
    const res = await api.put<{
      message: string;
      plan_code: string;
      status: string;
    }>(`/production-plans/${id}/complete`, data);
    return res.data;
  },
  cancelPlan: async (id: number) => {
    const res = await api.put<{
      message: string;
      plan_code: string;
      status: string;
    }>(`/production-plans/${id}/cancel`);
    return res.data;
  },
  deletePlan: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/production-plans/${id}`);
    return res.data;
  },
  getMaterialRequirements: async (id: number) => {
    const res = await api.get<MaterialRequirementsResponse>(`/production-plans/${id}/material-requirements`, {
      params: { t: Date.now() }
    });
    return res.data;
  },
  getDashboard: async () => {
    const res = await api.get<DashboardData>('/production-plans/dashboard');
    return res.data;
  }
};

export default productionPlanService;
