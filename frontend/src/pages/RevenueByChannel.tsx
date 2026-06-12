import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space, Tag, DatePicker, Button, Breadcrumb, Divider } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  PieChartOutlined,
  SearchOutlined,
  CalendarOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { getRevenueByChannel, RevenueByChannel as RevenueByChannelType } from '../services/reportService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const RevenueByChannel: React.FC = () => {
  const [data, setData] = useState<RevenueByChannelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dates ? dates[0].format('YYYY-MM-DD') : undefined;
      const endDate = dates ? dates[1].format('YYYY-MM-DD') : undefined;
      const res = await getRevenueByChannel(startDate, endDate);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalStats = useMemo(() => {
    return data.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      orders: acc.orders + curr.total_orders,
      customers: acc.customers + curr.total_customers
    }), { revenue: 0, orders: 0, customers: 0 });
  }, [data]);

  const topChannel = useMemo(() => {
    if (data.length === 0) return null;
    return [...data].sort((a, b) => b.revenue - a.revenue)[0];
  }, [data]);

  const columns = [
    {
      title: 'Kênh phân phối',
      dataIndex: 'channel_name',
      key: 'channel_name',
      render: (text: string, record: any) => (
        <Space>
          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: COLORS[data.indexOf(record) % COLORS.length] }}></div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">{text}</span>
            <Tag className="w-fit text-[9px] py-0 px-1.5 border-none mt-0.5 rounded-full font-bold bg-gray-100 text-gray-500 uppercase">{record.channel}</Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (val: number) => (
        <span className="font-extrabold text-blue-600">
          ${val.toLocaleString()}
        </span>
      ),
      sorter: (a: any, b: any) => a.revenue - b.revenue
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'total_orders',
      key: 'total_orders',
      align: 'right' as const,
      render: (val: number) => <Tag className="rounded-lg font-bold border-none bg-gray-50 text-gray-600 px-3">{val.toLocaleString()}</Tag>,
      sorter: (a: any, b: any) => a.total_orders - b.total_orders
    },
    {
      title: 'Số khách hàng',
      dataIndex: 'total_customers',
      key: 'total_customers',
      align: 'right' as const,
      render: (val: number) => <span className="text-gray-600 font-medium">{val.toLocaleString()}</span>,
      sorter: (a: any, b: any) => a.total_customers - b.total_customers
    },
    {
      title: 'Tỷ trọng %',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right' as const,
      render: (val: number) => (
        <div className="flex items-center justify-end">
          <span className="font-bold mr-3 text-xs text-gray-700">{val}%</span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val}%` }}></div>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.percentage - b.percentage
    }
  ];

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Premium Header Section - Channel Focus */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-[2.5rem] p-10 mb-8 shadow-2xl shadow-blue-200/50">
        <div className="relative z-10">
          <Breadcrumb 
            items={[
              { title: <span className="text-white/50 hover:text-white transition-colors cursor-pointer font-medium text-xs uppercase tracking-widest">Trang chủ</span> },
              { title: <span className="text-white/50 hover:text-white transition-colors cursor-pointer font-medium text-xs uppercase tracking-widest">Báo cáo doanh thu</span> },
              { title: <span className="text-white font-bold text-xs uppercase tracking-widest">Hiệu quả Kênh</span> },
            ]} 
          />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
                  <PieChartOutlined className="text-blue-400 text-xl" />
                </div>
                <Text className="text-blue-400 font-black tracking-[0.3em] text-[10px] uppercase">Market Segmentation</Text>
              </div>
              <Title level={1} style={{ color: 'white', margin: 0, fontWeight: 900, letterSpacing: '-0.025em' }}>
                Phân Tích Kênh Phân Phối
              </Title>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-3 rounded-[1.5rem] border border-white/10 flex flex-wrap items-center gap-4 shadow-inner">
              <RangePicker 
                value={dates} 
                onChange={(vals) => setDates(vals as any)}
                className="bg-transparent border-none text-white placeholder-white/40 font-bold"
                suffixIcon={<CalendarOutlined className="text-blue-400" />}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={fetchData}
                loading={loading}
                className="bg-blue-500 hover:bg-blue-400 border-none rounded-2xl px-8 h-12 font-black shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
              >
                CẬP NHẬT
              </Button>
            </div>
          </div>
        </div>
        
        {/* Modern decorative elements */}
        <div className="absolute top-[-30%] right-[-10%] w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[15rem] h-[15rem] bg-indigo-500/10 rounded-full blur-[80px]"></div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarOutlined style={{ fontSize: '80px' }} className="text-blue-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-blue-900/40">TỔNG DOANH THU</span>}
              value={totalStats.revenue}
              valueStyle={{ color: '#1e1b4bff', fontWeight: 800, fontSize: '32px' }}
              formatter={(val) => `$${val.toLocaleString()}`}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                <ArrowUpOutlined /> 12.5% TĂNG TRƯỞNG
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShoppingCartOutlined style={{ fontSize: '80px' }} className="text-emerald-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-emerald-900/40">SỐ ĐƠN HÀNG</span>}
              value={totalStats.orders}
              valueStyle={{ color: '#1e1b4b', fontWeight: 800, fontSize: '32px' }}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                ỔN ĐỊNH
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <PieChartOutlined style={{ fontSize: '80px' }} className="text-purple-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-purple-900/40">KÊNH DẪN ĐẦU</span>}
              value={topChannel?.channel_name || 'N/A'}
              valueStyle={{ color: '#1e1b4b', fontWeight: 900, fontSize: '20px' }}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                {topChannel?.percentage || 0}% THỊ PHẦN
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 rounded-[2rem] border-none bg-white p-4 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <UserOutlined style={{ fontSize: '80px' }} className="text-amber-900" />
            </div>
            <Statistic 
              title={<span className="text-gray-400 font-black text-[10px] tracking-[0.2em] uppercase text-amber-900/40">KHÁCH HÀNG</span>}
              value={totalStats.customers}
              valueStyle={{ color: '#1e1b4b', fontWeight: 900, fontSize: '32px' }}
            />
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 uppercase">
                TIỀM NĂNG
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            title={
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Tỷ Trọng Doanh Thu</span>
              </div>
            } 
            className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] bg-white border-none p-4"
          >
            <div className="h-[400px] w-full mt-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={130}
                    paddingAngle={10}
                    dataKey="revenue"
                    nameKey="channel_name"
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '15px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Doanh thu']}
                  />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            title={
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <span className="font-black text-gray-800 tracking-tight text-lg uppercase">So Sánh Giữa Các Kênh</span>
              </div>
            } 
            className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] bg-white border-none p-4"
          >
            <div className="h-[400px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="channel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '15px' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[12, 12, 12, 12]} barSize={50}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        bordered={false} 
        title={
          <div className="flex justify-between items-center w-full pr-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Bảng Dữ Liệu Chi Tiết</span>
            </div>
            <Button type="link" className="text-blue-600 font-black p-0 uppercase tracking-widest text-xs">XUẤT BÁO CÁO</Button>
          </div>
        } 
        className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] mt-8 mb-12 overflow-hidden bg-white border-none"
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          pagination={{ pageSize: 5, showSizeChanger: true, className: "px-6 py-4" }}
          rowKey="channel"
          className="modern-table"
        />
      </Card>
    </div>
  );
};

export default RevenueByChannel;