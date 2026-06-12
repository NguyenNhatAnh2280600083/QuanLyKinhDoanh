import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space, Tag, DatePicker, Button, Breadcrumb, Avatar, Progress } from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  ShoppingCartOutlined, 
  SearchOutlined,
  CalendarOutlined,
  RiseOutlined,
  CrownOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell 
} from 'recharts';
import { getRevenueByCustomer, RevenueByCustomer as RevenueByCustomerType } from '../services/reportService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const RevenueByCustomer: React.FC = () => {
  const [data, setData] = useState<RevenueByCustomerType[]>([]);
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
      const res = await getRevenueByCustomer(startDate, endDate);
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
      customers: data.length
    }), { revenue: 0, orders: 0, customers: 0 });
  }, [data]);

  const topCustomer = useMemo(() => {
    if (data.length === 0) return null;
    return data[0]; // Data is already sorted by revenue from API
  }, [data]);

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 700 }}>{text[0]}</Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">{text}</span>
            <Tag color="blue" className="w-fit text-[9px] py-0 px-1.5 border-none mt-0.5 rounded-full font-bold">{record.customer_type}</Tag>
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
      render: (val: number) => <Tag className="rounded-lg font-bold border-none bg-gray-50 text-gray-600 px-3">{val}</Tag>,
      sorter: (a: any, b: any) => a.total_orders - b.total_orders
    },
    {
      title: 'Đơn cuối',
      dataIndex: 'last_order_date',
      key: 'last_order_date',
      render: (date: string) => <Text type="secondary" className="text-[11px] font-medium">{dayjs(date).format('DD/MM/YYYY')}</Text>,
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
      {/* Dynamic Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-8 mb-8 shadow-2xl">
        <div className="relative z-10">
          <Breadcrumb 
            items={[
              { title: <span className="text-white/60">Trang chủ</span> },
              { title: <span className="text-white/60">Báo cáo doanh thu</span> },
              { title: <span className="text-white">Doanh thu theo khách hàng</span> },
            ]} 
          />
          <div className="flex justify-between items-center mt-6">
            <div>
              <Title level={1} style={{ color: 'white', margin: 0, fontWeight: 800, letterSpacing: '-0.025em' }}>
                Phân tích giá trị khách hàng
              </Title>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-3">
              <RangePicker 
                value={dates} 
                onChange={(vals) => setDates(vals as any)}
                className="bg-transparent border-none text-white placeholder-white/50"
                suffixIcon={<CalendarOutlined className="text-blue-400" />}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={fetchData}
                loading={loading}
                className="bg-blue-600 border-none rounded-xl px-6 h-10 font-bold"
              >
                Lọc dữ liệu
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-xl transition-all rounded-2xl border-none bg-white p-2">
            <Statistic 
              title={<span className="text-gray-400 font-bold text-[10px] tracking-widest uppercase">Doanh thu kỳ này</span>}
              value={totalStats.revenue}
              prefix={<DollarOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '26px' }}
              formatter={(val) => `$${val.toLocaleString()}`}
            />
            <div className="mt-2 flex items-center text-[11px] text-blue-600 font-bold">
              <span className="bg-blue-50 px-2 py-0.5 rounded-lg mr-2"><ArrowUpOutlined /> 14%</span>
              <span className="text-gray-400 font-medium">Tăng trưởng</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-xl transition-all rounded-2xl border-none bg-white p-2">
            <Statistic 
              title={<span className="text-gray-400 font-bold text-[10px] tracking-widest uppercase">Khách phát sinh đơn</span>}
              value={totalStats.customers}
              prefix={<UserOutlined className="text-green-500 mr-2" />}
              valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '26px' }}
            />
            <div className="mt-2 text-[11px] text-green-600 font-bold">
               <span className="bg-green-50 px-2 py-0.5 rounded-lg mr-2">Ổn định</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-xl transition-all rounded-2xl border-none bg-white p-2">
            <Statistic 
              title={<span className="text-gray-400 font-bold text-[10px] tracking-widest uppercase">Khách hàng Top 1</span>}
              value={topCustomer?.customer_name || 'N/A'}
              prefix={<CrownOutlined className="text-yellow-500 mr-2" />}
              valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '18px' }}
            />
            {topCustomer && <div className="mt-2 text-[10px] text-yellow-600 font-extrabold bg-yellow-50 px-2 py-0.5 rounded-full w-fit">{topCustomer.percentage}% thị phần</div>}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-xl transition-all rounded-2xl border-none bg-white p-2">
            <Statistic 
              title={<span className="text-gray-400 font-bold text-[10px] tracking-widest uppercase">Tổng số đơn hàng</span>}
              value={totalStats.orders}
              prefix={<ShoppingCartOutlined className="text-orange-500 mr-2" />}
              valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '26px' }}
            />
            <div className="mt-2 text-[11px] text-orange-600 font-bold">
               <span className="bg-orange-50 px-2 py-0.5 rounded-lg mr-2">Vận hành tốt</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24}>
          <Card 
            bordered={false} 
            title={<Space><RiseOutlined className="text-blue-600" /> <span className="font-extrabold text-gray-800">Top 10 Khách Hàng Chiến Lược</span></Space>} 
            className="shadow-sm rounded-3xl bg-white p-2"
          >
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `$${val/1000}k`} />
                  <YAxis dataKey="customer_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 700 }} width={140} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={24}>
                    {data.slice(0, 10).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1e40af' : index < 3 ? '#3b82f6' : '#93c5fd'} />
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
        title={<span className="font-extrabold text-gray-800">Chi tiết doanh thu đối tác</span>} 
        className="shadow-sm rounded-3xl mt-8 mb-8 overflow-hidden bg-white border-none"
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, className: "px-6" }}
          rowKey="customer_id"
          className="custom-table"
        />
      </Card>
    </div>
  );
};

export default RevenueByCustomer;
