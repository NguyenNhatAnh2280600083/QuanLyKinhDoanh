import api from './api';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: number;
  image_url?: string;
  category: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  order_id?: number;
  type: 'OUT' | 'ADJUST' | 'RETURN';
  quantity: number;
  note?: string;
  created_by: number;
  created_at: string;
  product: {
    name: string;
  };
  user: {
    full_name: string;
    username: string;
  };
  ending_balance?: number;
}

export interface InventoryResponse {
  total: number;
  items: Product[];
  skip: number;
  limit: number;
}

export interface InventoryLogResponse {
  total: number;
  items: InventoryLog[];
  skip: number;
  limit: number;
}

const inventoryService = {
  getInventory: (params: { skip?: number; limit?: number; search?: string; low_stock?: boolean }) =>
    api.get<InventoryResponse>('/inventory/', { params }),

  getProductInventory: (productId: number) =>
    api.get<Product>(`/inventory/${productId}`),

  adjustInventory: (productId: number, data: { quantity: number; note?: string }) =>
    api.patch(`/inventory/${productId}/adjust`, data),

  getInventoryLogs: (params: { skip?: number; limit?: number; type?: string }) =>
    api.get<InventoryLogResponse>('/inventory/logs/', { params }),

  getLowStock: () =>
    api.get<Product[]>('/inventory/low-stock/'),
};

export default inventoryService;
