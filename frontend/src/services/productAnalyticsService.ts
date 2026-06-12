import api from './api';

export interface ProductTopSelling {
    product_id: number;
    product_name: string;
    sold_quantity: number;
    revenue: number;
}

export interface ProductTopRevenue {
    product_id: number;
    product_name: string;
    revenue: number;
}

export interface ProductLowStock {
    product_id: number;
    product_name: string;
    stock_quantity: number;
    low_stock_threshold: number;
}

export interface ProductHighStock {
    product_id: number;
    product_name: string;
    stock_quantity: number;
}

export interface ProductSlowMoving {
    product_id: number;
    product_name: string;
    sold_quantity: number;
    stock_quantity: number;
}

export interface ProductAnalyticsDashboard {
    total_products: number;
    total_stock: number;
    low_stock_products: number;
    best_selling_product: string | null;
}

export interface MonthlySales {
    month: string;
    revenue: number;
    quantity: number;
}

export interface TopCustomer {
    customer_id: number;
    customer_name: string;
    revenue: number;
    quantity: number;
}

export interface ProductDetailAnalytics {
    product_info: {
        id: number;
        name: string;
        sku: string;
        stock_quantity: number;
        price: number;
    };
    total_revenue: number;
    sold_quantity: number;
    average_monthly_sales: number;
    monthly_sales: MonthlySales[];
    top_customers: TopCustomer[];
}

const productAnalyticsService = {
    getDashboard: async () => {
        const res = await api.get<ProductAnalyticsDashboard>('/reports/products/dashboard');
        return res.data;
    },
    getTopSelling: async (startDate?: string, endDate?: string) => {
        const res = await api.get<ProductTopSelling[]>('/reports/products/top-selling', {
            params: { start_date: startDate, end_date: endDate }
        });
        return res.data;
    },
    getTopRevenue: async (startDate?: string, endDate?: string) => {
        const res = await api.get<ProductTopRevenue[]>('/reports/products/top-revenue', {
            params: { start_date: startDate, end_date: endDate }
        });
        return res.data;
    },
    getLowStock: async () => {
        const res = await api.get<ProductLowStock[]>('/reports/products/low-stock');
        return res.data;
    },
    getHighStock: async () => {
        const res = await api.get<ProductHighStock[]>('/reports/products/high-stock');
        return res.data;
    },
    getSlowMoving: async () => {
        const res = await api.get<ProductSlowMoving[]>('/reports/products/slow-moving');
        return res.data;
    },
    getProductDetail: async (productId: number) => {
        const res = await api.get<ProductDetailAnalytics>(`/reports/products/${productId}`);
        return res.data;
    }
};

export default productAnalyticsService;
