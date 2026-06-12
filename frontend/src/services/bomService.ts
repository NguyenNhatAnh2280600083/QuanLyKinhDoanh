import api from './api';

export interface BOM {
    id: number;
    product_id: number;
    material_id: number;
    quantity_required: number;
    material_name?: string;
    material_unit?: string;
}

export interface BOMCreate {
    product_id: number;
    material_id: number;
    quantity_required: number;
}

export interface MaterialCalculationResponse {
    product_name: string;
    required_materials: {
        material_id: number;
        material_name: string;
        required_quantity: number;
        current_stock: number;
        enough: boolean;
    }[];
    status: 'ENOUGH' | 'NOT_ENOUGH';
    missing_any: boolean;
}

const bomService = {
    getByProduct: async (productId: number) => {
        const res = await api.get<BOM[]>(`/bom/product/${productId}`);
        return res.data;
    },
    create: async (data: BOMCreate) => {
        const res = await api.post<BOM>('/bom/', data);
        return res.data;
    },
    update: async (id: number, quantityRequired: number) => {
        const res = await api.put<BOM>(`/bom/${id}`, { quantity_required: quantityRequired });
        return res.data;
    },
    delete: async (id: number) => {
        await api.delete(`/bom/${id}`);
    },
    calculateRequirements: async (productId: number, quantity: number) => {
        const res = await api.post<MaterialCalculationResponse>('/bom/calculate-materials', {
            product_id: productId,
            production_quantity: quantity
        });
        return res.data;
    }
};

export default bomService;
