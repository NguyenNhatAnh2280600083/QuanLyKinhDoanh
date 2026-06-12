import api from './api';

export interface WeeklySuggestion {
  product_id: number;
  product_name: string;
  sold_last_week: number;
  avg_daily_sales: number;
  forecast_next_week: number;
  current_stock: number;
  safety_stock: number;
  suggested_production: number;
  status: 'NEED_PRODUCTION' | 'NO_NEED' | 'LOW_STOCK';
}

export interface WeeklyPlanItem {
  product_id: number;
  planned_quantity: number;
}

export interface CreateWeeklyPlanPayload {
  week_number: number;
  year: number;
  plans: WeeklyPlanItem[];
}

export interface BOMRequirement {
  material_id: number;
  material_name: string;
  material_unit?: string;
  required_quantity: number;
  current_stock: number;
  enough: boolean;
  missing_quantity: number;
}

export interface LastWeekProductionProduct {
  week_number: number;
  year: number;
  plan_id: number;
  plan_code: string;
  product_id: number;
  product_name: string;
  planned_quantity: number;
  completed_quantity: number;
  status: string;
  progress_percent: number;
  bom_materials: BOMRequirement[];
}

export interface WeeklyProductionDashboardData {
  total_products_need_production: number;
  total_planned_quantity: number;
  low_stock_products: number;
  completion_rate: number;
  
  top_products_need_production: {
    product_id: number;
    product_name: string;
    suggested_production: number;
    current_stock: number;
  }[];

  total_plans: number;
  planned: number;
  in_progress: number;
  completed: number;
  completion_rate_overall: number;
  weekly_volume: { name: string; planned: number; completed: number }[];
  weekly_progress: { name: string; progress: number }[];
  status_distribution: { name: string; value: number; label: string }[];
}

const weeklyProductionService = {
  getWeeklySuggestions: async () => {
    const res = await api.get<WeeklySuggestion[]>('/production-plans/weekly-suggestions');
    return res.data;
  },

  createWeekPlan: async (data: CreateWeeklyPlanPayload) => {
    const res = await api.post('/production-plans/create-week-plan', data);
    return res.data;
  },

  getWeekPlans: async (year: number, weekNumber: number) => {
    const res = await api.get(`/production-plans/week/${year}/${weekNumber}`);
    return res.data;
  },

  getLastWeekProductMaterials: async () => {
    const res = await api.get<LastWeekProductionProduct[]>('/production-plans/last-week-materials');
    return res.data;
  },

  getProductionDashboard: async () => {
    const res = await api.get<WeeklyProductionDashboardData>('/production-plans/dashboard');
    return res.data;
  }
};

export default weeklyProductionService;
