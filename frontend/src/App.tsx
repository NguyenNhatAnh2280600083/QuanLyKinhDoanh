import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import PermissionManagement from './pages/PermissionManagement';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import InventoryManagement from './pages/InventoryManagement';
import InventoryLogs from './pages/InventoryLogs';
import Reports from './pages/Reports';
import RevenueByChannel from './pages/RevenueByChannel';
import RevenueByCustomer from './pages/RevenueByCustomer';
import RevenueByEmployee from './pages/RevenueByEmployee';
import ProductAnalytics from './pages/reports/ProductAnalytics';
import ProductDetail from './pages/reports/ProductDetail';
import RawMaterials from './pages/RawMaterials';
import RawMaterialLogs from './pages/RawMaterialLogs';
import ProductBOM from './pages/ProductBOM';
import MaterialRequirementCalculator from './pages/MaterialRequirementCalculator';
import MaterialRequests from './pages/MaterialRequests';
import Profile from './pages/Profile';
import WeeklyProductionSuggestion from './pages/production/WeeklyProductionSuggestion';
import WeeklyProductionPlans from './pages/production/WeeklyProductionPlans';
import ProductionPlanDetail from './pages/ProductionPlanDetail';
import ProductionDashboard from './pages/production/ProductionDashboard';
import LastWeekProductionMaterials from './pages/production/LastWeekProductionMaterials';
import CustomerDebts from './pages/CustomerDebts';
import CustomerDebtDetail from './pages/CustomerDebtDetail';
import { useAuthStore } from './store/authStore';
import api from './services/api';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  return user?.role?.name === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const PermissionRoute = ({ permissions, children }: { permissions: string[]; children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  if (user?.role?.name === 'admin') return <>{children}</>;
  const set = new Set(user?.permissions || []);
  return permissions.some((p) => set.has(p)) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  const { setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Failed to fetch user', error);
        }
      }
    };
    fetchUser();
  }, [isAuthenticated, setUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="customers"
            element={
              <PermissionRoute permissions={['CUSTOMER_MANAGEMENT']}>
                <CustomerManagement />
              </PermissionRoute>
            }
          />
          <Route path="users" element={<Navigate to="/admin/users" replace />} />
          <Route
            path="admin/users"
            element={
              <AdminOnlyRoute>
                <UserManagement />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="admin/roles"
            element={
              <AdminOnlyRoute>
                <RoleManagement />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="admin/permissions"
            element={
              <AdminOnlyRoute>
                <PermissionManagement />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="products"
            element={
              <PermissionRoute permissions={['PRODUCT_MANAGEMENT']}>
                <ProductManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <PermissionRoute permissions={['INVENTORY_VIEW', 'WAREHOUSE_MANAGEMENT']}>
                <InventoryManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="inventory-logs"
            element={
              <PermissionRoute permissions={['WAREHOUSE_MANAGEMENT']}>
                <InventoryLogs />
              </PermissionRoute>
            }
          />
          <Route
            path="orders"
            element={
              <PermissionRoute permissions={['ORDER_MANAGEMENT']}>
                <OrderManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="customer-debts"
            element={
              <PermissionRoute permissions={['DEBT_MANAGEMENT']}>
                <CustomerDebts />
              </PermissionRoute>
            }
          />
          <Route
            path="customer-debts/:id"
            element={
              <PermissionRoute permissions={['DEBT_MANAGEMENT']}>
                <CustomerDebtDetail />
              </PermissionRoute>
            }
          />
          <Route
            path="production"
            element={
              <Navigate to="/production/weekly" replace />
            }
          />
          <Route
            path="production/suggestions"
            element={
              <PermissionRoute permissions={['PRODUCTION_MANAGEMENT']}>
                <WeeklyProductionSuggestion />
              </PermissionRoute>
            }
          />
          <Route
            path="production/weekly"
            element={
              <PermissionRoute permissions={['PRODUCTION_MANAGEMENT']}>
                <WeeklyProductionPlans />
              </PermissionRoute>
            }
          />
          <Route
            path="production/weekly/:id"
            element={
              <PermissionRoute permissions={['PRODUCTION_MANAGEMENT']}>
                <ProductionPlanDetail />
              </PermissionRoute>
            }
          />
          <Route
            path="production/dashboard"
            element={
              <PermissionRoute permissions={['PRODUCTION_MANAGEMENT']}>
                <ProductionDashboard />
              </PermissionRoute>
            }
          />
          <Route
            path="production/last-week-materials"
            element={
              <PermissionRoute permissions={['PRODUCTION_MANAGEMENT']}>
                <LastWeekProductionMaterials />
              </PermissionRoute>
            }
          />
          <Route
            path="raw-materials"
            element={
              <PermissionRoute permissions={['RAW_MATERIAL_MANAGEMENT']}>
                <RawMaterials />
              </PermissionRoute>
            }
          />
          <Route
            path="raw-material-logs"
            element={
              <PermissionRoute permissions={['RAW_MATERIAL_MANAGEMENT']}>
                <RawMaterialLogs />
              </PermissionRoute>
            }
          />
          <Route
            path="material-requests"
            element={
              <PermissionRoute permissions={['RAW_MATERIAL_MANAGEMENT']}>
                <MaterialRequests />
              </PermissionRoute>
            }
          />
          <Route
            path="bom"
            element={
              <PermissionRoute permissions={['BOM_MANAGEMENT']}>
                <ProductBOM />
              </PermissionRoute>
            }
          />
          <Route
            path="bom/calculate"
            element={
              <PermissionRoute permissions={['BOM_MANAGEMENT']}>
                <MaterialRequirementCalculator />
              </PermissionRoute>
            }
          />
          <Route
            path="reports"
            element={
              <PermissionRoute permissions={['REPORT_VIEW']}>
                <Reports />
              </PermissionRoute>
            }
          />
          <Route
            path="reports/revenue-channel"
            element={
              <PermissionRoute permissions={['REPORT_VIEW']}>
                <RevenueByChannel />
              </PermissionRoute>
            }
          />
          <Route
            path="reports/revenue-customer"
            element={
              <PermissionRoute permissions={['REPORT_VIEW']}>
                <RevenueByCustomer />
              </PermissionRoute>
            }
          />
          <Route
            path="reports/revenue-employee"
            element={
              <PermissionRoute permissions={['REPORT_VIEW']}>
                <RevenueByEmployee />
              </PermissionRoute>
            }
          />
          <Route
            path="reports/product-analytics"
            element={
              <PermissionRoute permissions={['PRODUCT_ANALYTICS_VIEW']}>
                <ProductAnalytics />
              </PermissionRoute>
            }
          />
          <Route
            path="reports/products/:id"
            element={
              <PermissionRoute permissions={['PRODUCT_ANALYTICS_VIEW']}>
                <ProductDetail />
              </PermissionRoute>
            }
          />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
