import api from './api';

export type MaterialRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface MaterialRequest {
  id: number;
  request_code: string;
  material_id: number;
  requested_quantity: number;
  current_stock: number;
  missing_quantity: number;
  reason?: string | null;
  status: MaterialRequestStatus;
  production_plan_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  material_name?: string | null;
  material_unit?: string | null;
  creator_full_name?: string | null;
  approver_full_name?: string | null;
}

export interface MaterialRequestCreate {
  material_id: number;
  requested_quantity: number;
  current_stock: number;
  missing_quantity: number;
  reason?: string;
  production_plan_id?: number;
}

export interface MaterialRequestUpdate {
  requested_quantity?: number;
  reason?: string;
  status?: MaterialRequestStatus;
}

export interface MaterialRequestListResponse {
  total: number;
  items: MaterialRequest[];
}

const materialRequestService = {
  getRequests: async (params?: {
    status?: MaterialRequestStatus;
    skip?: number;
    limit?: number;
  }) => {
    const res = await api.get<MaterialRequestListResponse>('/material-requests', { params });
    return res.data;
  },

  getRequest: async (id: number) => {
    const res = await api.get<MaterialRequest>(`/material-requests/${id}`);
    return res.data;
  },

  createRequest: async (data: MaterialRequestCreate) => {
    const res = await api.post<MaterialRequest>('/material-requests', data);
    return res.data;
  },

  updateRequest: async (id: number, data: MaterialRequestUpdate) => {
    const res = await api.put<MaterialRequest>(`/material-requests/${id}`, data);
    return res.data;
  },

  approveRequest: async (id: number) => {
    const res = await api.post<MaterialRequest>(`/material-requests/${id}/approve`);
    return res.data;
  },

  rejectRequest: async (id: number, reason?: string) => {
    const res = await api.post<MaterialRequest>(`/material-requests/${id}/reject`, null, {
      params: reason ? { reason } : undefined
    });
    return res.data;
  },

  completeRequest: async (id: number) => {
    const res = await api.post<MaterialRequest>(`/material-requests/${id}/complete`);
    return res.data;
  },

  deleteRequest: async (id: number) => {
    const res = await api.delete(`/material-requests/${id}`);
    return res.data;
  }
};

export default materialRequestService;
