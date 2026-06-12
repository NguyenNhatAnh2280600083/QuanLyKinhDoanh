import api from './api';

export interface RawMaterial {
    id: number;
    code: string;
    name: string;
    unit: string;
    stock_quantity: number;
    minimum_stock: number;
    description: string | null;
    created_at: string;
}

export interface RawMaterialCreate {
    code: string;
    name: string;
    unit: string;
    stock_quantity: number;
    minimum_stock: number;
    description?: string;
}

export interface RawMaterialLog {
    id: number;
    material_id: number;
    type: 'IMPORT' | 'EXPORT';
    quantity: number;
    note: string | null;
    created_by: number;
    created_at: string;
    material_name: string;
    user_full_name: string;
}

const rawMaterialService = {
    getAll: async () => {
        const res = await api.get<RawMaterial[]>('/raw-materials/');
        return res.data;
    },
    getLogs: async () => {
        const res = await api.get<RawMaterialLog[]>('/raw-materials/logs');
        return res.data;
    },
    create: async (data: RawMaterialCreate) => {
        const res = await api.post<RawMaterial>('/raw-materials/', data);
        return res.data;
    },
    update: async (id: number, data: Partial<RawMaterialCreate>) => {
        const res = await api.put<RawMaterial>(`/raw-materials/${id}`, data);
        return res.data;
    },
    delete: async (id: number) => {
        await api.delete(`/raw-materials/${id}`);
    },
    importMaterial: async (id: number, quantity: number, note: string) => {
        const res = await api.post<RawMaterial>(`/raw-materials/${id}/import`, { quantity, note });
        return res.data;
    },
    exportMaterial: async (id: number, quantity: number, note: string) => {
        const res = await api.post<RawMaterial>(`/raw-materials/${id}/export`, { quantity, note });
        return res.data;
    }
};

export default rawMaterialService;
