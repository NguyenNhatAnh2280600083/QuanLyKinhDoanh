import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space, Tag, Avatar, Button, Breadcrumb, Progress } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  BoxPlotOutlined,
  ArrowUpOutlined,
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/dashboard');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-black text-indigo-600">LIXCO</div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-900 rounded-[2.5rem] p-10 mb-8 shadow-2xl shadow-indigo-200/50">
        <div className="relative z-10">
          <Breadcrumb 
            items={[
              { title: <span className="text-white/50 hover:text-white transition-colors cursor-pointer font-medium text-xs uppercase tracking-widest">Hệ thống</span> },
              { title: <span className="text-white font-bold text-xs uppercase tracking-widest">Dashboard</span> },
            ]} 
          />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
                  <DashboardOutlined className="text-indigo-400 text-xl" />
                </div>
                <Text className="text-indigo-400 font-black tracking-[0.3em] text-[10px] uppercase">Business Overview</Text>
              </div>
              <Title level={1} style={{ color: 'white', margin: 0, fontWeight: 900, letterSpacing: '-0.025em' }}>
                Tổng Quan Kinh Doanh
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 500 }}>
                Chào mừng trở lại! Theo dõi hiệu suất kinh doanh của LIXCO.
              </Text>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/10 flex items-center gap-4 shadow-inner">
              <div className="flex flex-col">
                <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Ngày hiện tại</Text>
                <Text className="text-white font-black text-lg">{dayjs().format('DD MMMM, YYYY')}</Text>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <Button 
                type="primary" 
                icon={<CalendarOutlined />}
                className="bg-indigo-500 hover:bg-indigo-400 border-none rounded-xl h-12 font-black shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
              >
                LỊCH TRÌNH
              </Button>
            </div>
          </div>
        </div>
        
        {/* Modern decorative elements */}
        <div className="absolute top-[-30%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[15rem] h-[15rem] bg-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative cursor-pointer" onClick={() => navigate('/reports')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <WalletOutlined style={{ fontSize: '80px' }} className="text-indigo-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-indigo-900/40">TỔNG DOANH THU</span>}
              value={stats?.total_revenue}
              valueStyle={{ color: '#1e1b4b', fontWeight: 900, fontSize: '32px' }}
              formatter={(val) => `$${val.toLocaleString()}`}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                <ArrowUpOutlined /> 12.5% VS THÁNG TRƯỚC
              </div>
            </div>
            <Progress percent={75} showInfo={false} strokeColor="#4f46e5" size="small" className="mt-4" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative cursor-pointer" onClick={() => navigate('/orders')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShoppingCartOutlined style={{ fontSize: '80px' }} className="text-emerald-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-emerald-900/40">ĐƠN HÀNG MỚI</span>}
              value={stats?.total_orders}
              valueStyle={{ color: '#1e1b4b', fontWeight: 900, fontSize: '32px' }}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                {stats?.pending_orders_count} ĐƠN CHỜ DUYỆT
              </div>
            </div>
            <Progress percent={stats?.total_orders > 0 ? (1 - stats?.pending_orders_count/stats?.total_orders) * 100 : 100} showInfo={false} strokeColor="#10b981" size="small" className="mt-4" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative cursor-pointer" onClick={() => navigate('/customers')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TeamOutlined style={{ fontSize: '80px' }} className="text-blue-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-blue-900/40">KHÁCH HÀNG</span>}
              value={stats?.total_customers}
              valueStyle={{ color: '#1e1b4b', fontWeight: 900, fontSize: '32px' }}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                +{stats?.new_customers_this_week} MỚI TRONG TUẦN
              </div>
            </div>
            <Progress percent={60} showInfo={false} strokeColor="#3b82f6" size="small" className="mt-4" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative cursor-pointer" onClick={() => navigate('/inventory')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BoxPlotOutlined style={{ fontSize: '80px' }} className="text-amber-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-amber-900/40">SẢN PHẨM LIX</span>}
              value={stats?.total_products}
              valueStyle={{ color: '#1e1b4b', fontWeight: 900, fontSize: '32px' }}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className={`${stats?.out_of_stock_count > 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'} px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase`}>
                {stats?.out_of_stock_count > 0 ? `${stats.out_of_stock_count} HẾT HÀNG` : 'VẬN HÀNH TỐT'}
              </div>
            </div>
            <Progress percent={90} showInfo={false} strokeColor="#f59e0b" size="small" className="mt-4" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            title={
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Xu Hướng Doanh Thu</span>
              </div>
            } 
            className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] bg-white border-none p-4"
          >
            <div className="h-[400px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenue_by_month} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '15px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Doanh thu']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            title={
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
                <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Khu Vực Trọng Điểm</span>
              </div>
            } 
            className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] bg-white border-none p-4"
          >
            <div className="h-[400px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={stats?.revenue_by_region}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="revenue"
                    nameKey="region"
                  >
                    {stats?.revenue_by_region?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '15px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full mt-4 space-y-3">
                {stats?.revenue_by_region?.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-bold text-gray-700">{item.region}</span>
                    </div>
                    <span className="font-black text-indigo-600">${item.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8 mb-12">
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            title={
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-amber-600 rounded-full"></div>
                <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Sản Phẩm Chiến Lược</span>
              </div>
            } 
            className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] bg-white border-none overflow-hidden"
          >
            <Table 
              dataSource={stats?.top_products} 
              columns={[
                { 
                  title: 'Sản phẩm', 
                  dataIndex: 'name', 
                  key: 'name',
                  render: (text) => <span className="font-bold text-gray-700">{text}</span>
                },
                { 
                  title: 'Đã bán', 
                  dataIndex: 'value', 
                  key: 'value',
                  align: 'right',
                  render: (val) => <Tag color="blue" className="rounded-lg border-none font-black bg-blue-50 text-blue-600 px-3">{val}</Tag>
                }
              ]} 
              pagination={false}
              size="large"
              className="modern-table"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            title={
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-rose-600 rounded-full"></div>
                <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Đội Ngũ Xuất Sắc</span>
              </div>
            } 
            className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] bg-white border-none overflow-hidden"
          >
            <Table 
              dataSource={stats?.top_sales_staff} 
              columns={[
                { 
                  title: 'Nhân viên', 
                  dataIndex: 'name', 
                  key: 'name',
                  render: (text) => (
                    <Space>
                      <Avatar size="large" style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 900 }}>{text[0]}</Avatar>
                      <span className="font-bold text-gray-700">{text}</span>
                    </Space>
                  )
                },
                { 
                  title: 'Doanh số', 
                  dataIndex: 'value', 
                  key: 'value', 
                  align: 'right',
                  render: (val: number) => <span className="font-black text-emerald-600">${val.toLocaleString()}</span>
                }
              ]} 
              pagination={false}
              size="large"
              className="modern-table"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;