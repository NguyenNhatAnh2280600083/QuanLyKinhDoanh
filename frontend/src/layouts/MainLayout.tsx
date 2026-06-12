import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space, MenuProps, Badge, Popover, List, Typography, Empty } from 'antd';
import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  ToolOutlined,
  PayCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AdminNotification {
  id: number;
  order_id?: number | null;
  product_id?: number | null;
  type: 'production_request' | 'low_stock';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary },
  } = theme.useToken();
  const isAdmin = user?.role.name === 'admin';
  const permissionSet = new Set(user?.permissions || []);
  const hasPermission = (code: string) => isAdmin || permissionSet.has(code);
  const canViewReports = hasPermission('REPORT_VIEW');

  const fetchNotifications = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.items);
      setUnreadCount(res.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (!isAdmin) return;

    const interval = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [isAdmin]);

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await api.patch(`/notifications/${notification.id}/read`);
      fetchNotifications();
    }
    
    if (notification.type === 'low_stock') {
      navigate('/inventory');
    } else {
      navigate('/production/weekly');
    }
  };

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all/');
    fetchNotifications();
  };

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div className="flex items-center justify-between mb-3">
        <Text strong>Thông báo hệ thống</Text>
        <Button type="link" size="small" onClick={handleMarkAllRead} disabled={!unreadCount}>
          Đánh dấu đã đọc
        </Button>
      </div>
      {notifications.length ? (
        <List
          dataSource={notifications}
          rowKey="id"
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{ cursor: 'pointer', background: item.is_read ? '#fff' : '#f6ffed', padding: '10px 8px' }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {!item.is_read && <Badge status="processing" />}
                    <Text strong={!item.is_read}>{item.title}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary">{item.message}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
      )}
    </div>
  );

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
      label: 'Dashboard',
    },
    {
      key: '/admin-group',
      icon: <ToolOutlined style={{ fontSize: '18px' }} />,
      label: 'Quản trị hệ thống',
      hidden: !isAdmin,
      children: [
        { key: '/admin/users', label: 'Người dùng' },
        { key: '/admin/roles', label: 'Nhóm quyền' },
        { key: '/admin/permissions', label: 'Phân quyền' },
      ],
    },
    {
      key: '/customers-group',
      icon: <UserOutlined style={{ fontSize: '18px' }} />,
      label: 'Khách hàng',
      children: [
        { key: '/customers', label: 'Danh sách khách hàng' },
        { key: '/customer-debts', label: 'Công nợ khách hàng', hidden: !hasPermission('DEBT_MANAGEMENT') },
      ]
    },
    {
      key: '/products',
      icon: <ShoppingOutlined style={{ fontSize: '18px' }} />,
      label: 'Sản phẩm',
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined style={{ fontSize: '18px' }} />,
      label: 'Quản lý kho',
      hidden: !(hasPermission('INVENTORY_VIEW') || hasPermission('WAREHOUSE_MANAGEMENT')),
    },
    {
      key: '/orders',
      icon: <FileTextOutlined style={{ fontSize: '18px' }} />,
      label: 'Đơn hàng',
    },
    {
      key: '/production-group',
      icon: <ToolOutlined style={{ fontSize: '18px' }} />,
      label: 'Kế hoạch sản xuất',
      hidden: !hasPermission('PRODUCTION_MANAGEMENT'),
      children: [
        { key: '/production/suggestions', label: 'Đề xuất kế hoạch' },
        { key: '/production/weekly', label: 'Kế hoạch tuần' },
        { key: '/production/weekly#progress', label: 'Tiến độ sản xuất' },
        { key: '/production/last-week-materials', label: 'Tuần trước & NVL' },
        { key: '/production/dashboard', label: 'Dashboard sản xuất' },
      ]
    },
    {
      key: '/raw-materials-group',
      icon: <DatabaseOutlined style={{ fontSize: '18px' }} />,
      label: 'Nguyên vật liệu',
      hidden: !hasPermission('RAW_MATERIAL_MANAGEMENT'),
      children: [
        { key: '/raw-materials', label: 'Danh sách NVL' },
        { key: '/raw-material-logs', label: 'Lịch sử nhập xuất' },
      ]
    },
    {
      key: '/bom-group',
      icon: <ToolOutlined style={{ fontSize: '18px' }} />,
      label: 'Định mức & BOM',
      hidden: !hasPermission('BOM_MANAGEMENT'),
      children: [
        { key: '/bom', label: 'Định mức sản phẩm' },
        { key: '/bom/calculate', label: 'Tính nhu cầu NVL' },
      ]
    },
    {
      key: '/reports-group',
      icon: <BarChartOutlined style={{ fontSize: '18px' }} />,
      label: 'Báo cáo doanh thu',
      hidden: !canViewReports,
      children: [
        { key: '/reports', label: 'Tổng quan' },
        { key: '/reports/revenue-channel', label: 'Theo kênh' },
        { key: '/reports/revenue-customer', label: 'Theo khách hàng' },
        { key: '/reports/revenue-employee', label: 'Theo nhân viên' },
      ]
    },
    {
      key: '/reports/product-analytics',
      icon: <BarChartOutlined style={{ fontSize: '18px', color: '#3b82f6' }} />,
      label: 'Product Analytics',
      hidden: !hasPermission('PRODUCT_ANALYTICS_VIEW'),
    },
    {
      key: '/inventory-logs',
      icon: <HistoryOutlined style={{ fontSize: '18px' }} />,
      label: 'Nhật ký hoạt động',
      hidden: !hasPermission('WAREHOUSE_MANAGEMENT'),
    },
  ]
    .map((item: any) => {
      if (!item.children) return item;
      const children = (item.children as any[]).filter((c) => !c.hidden);
      return { ...item, children };
    })
    .filter((item: any) => !item.hidden);

  const userMenuItems: MenuProps['items'] = [
    {
      key: '/profile',
      label: 'Thông tin cá nhân',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span className="text-red-500">Đăng xuất</span>,
      icon: <LogoutOutlined className="text-red-500" />,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="light" 
        className="shadow-lg border-r border-gray-100 sticky top-0 h-screen z-[1001]"
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-blue-200 shadow-lg">
            <ShoppingOutlined className="text-white text-lg" />
          </div>
          {!collapsed && (
            <span className="font-bold text-gray-800 text-base tracking-tight truncate">
              LIXCO SALES
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={location.pathname.startsWith('/reports') ? ['/reports'] : []}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) {
              navigate(key);
            }
          }}
          className="border-none px-2"
          style={{ background: 'transparent' }}
        />
      </Sider>
      <Layout className="bg-gray-50 flex flex-col min-h-screen">
        <Header 
          style={{ 
            padding: '0 24px', 
            background: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: '64px',
          }} 
          className="flex justify-between items-center shadow-sm border-b border-gray-100 w-full"
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-gray-100 rounded-lg transition-colors"
            style={{ fontSize: '18px' }}
          />
          <div className="flex items-center gap-6">
            {isAdmin && (
              <Popover content={notificationContent} trigger="click" placement="bottomRight">
                <Badge count={unreadCount} size="small">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<BellOutlined />}
                    className="hover:bg-gray-100"
                    style={{ fontSize: '18px' }}
                  />
                </Badge>
              </Popover>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space className="cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-gray-100">
                <div className="relative">
                  <Avatar 
                    style={{ backgroundColor: colorPrimary }} 
                    icon={<UserOutlined />} 
                    className="shadow-sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="font-semibold text-gray-800 text-sm">{user?.full_name}</span>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">{user?.role.name}</span>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            padding: '24px',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'initial',
            background: '#f8fafc'
          }}
        >
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
