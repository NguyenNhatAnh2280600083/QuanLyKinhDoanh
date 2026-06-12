import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space, Button, DatePicker, Tag, Breadcrumb, Empty, message } from 'antd';
import { 
  ShoppingOutlined, 
  StockOutlined, 
  WarningOutlined, 
  TrophyOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import productAnalyticsService, { 
    ProductAnalyticsDashboard, ProductTopSelling, ProductTopRevenue, 
    ProductLowStock, ProductSlowMoving 
} from '../../services/productAnalyticsService';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ProductAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ProductAnalyticsDashboard | null>(null);
  const [topSelling, setTopSelling] = useState<ProductTopSelling[]>([]);
  const [topRevenue, setTopRevenue] = useState<ProductTopRevenue[]>([]);
  const [lowStock, setLowStock] = useState<ProductLowStock[]>([]);
  const [slowMoving, setSlowMoving] = useState<ProductSlowMoving[]>([]);
  const [dateRange, setDateRange] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange ? dateRange[0].startOf('day').toISOString() : undefined;
      const endDate = dateRange ? dateRange[1].endOf('day').toISOString() : undefined;

      const [dash, selling, revenue, low, slow] = await Promise.all([
        productAnalyticsService.getDashboard(),
        productAnalyticsService.getTopSelling(startDate, endDate),
        productAnalyticsService.getTopRevenue(startDate, endDate),
        productAnalyticsService.getLowStock(),
        productAnalyticsService.getSlowMoving()
      ]);

      setDashboard(dash);
      setTopSelling(selling);
      setTopRevenue(revenue);
      setLowStock(low);
      setSlowMoving(slow);
    } catch (error) {
      message.error('Không thể tải dữ liệu phân tích sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lowStockColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: #{record.product_id}</Text>
        </Space>
      )
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (val: number) => <Text strong type="danger">{val}</Text>
    },
    {
      title: 'Ngưỡng tối thiểu',
      dataIndex: 'low_stock_threshold',
      key: 'low_stock_threshold',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: ProductLowStock) => (
        <Tag color={record.stock_quantity === 0 ? 'red' : 'orange'} className="rounded-full border-none px-3">
          {record.stock_quantity === 0 ? 'Hết hàng' : 'Sắp hết'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => navigate(`/reports/products/${record.product_id}`)}
        >
          Chi tiết
        </Button>
      )
    }
  ];

  const slowMovingColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
    },
    {
      title: 'Đã bán (90 ngày)',
      dataIndex: 'sold_quantity',
      key: 'sold_quantity',
    },
    {
        title: 'Tỷ lệ bán',
        key: 'rate',
        render: (_: any, record: ProductSlowMoving) => {
            const rate = record.stock_quantity > 0 ? (record.sold_quantity / record.stock_quantity * 100).toFixed(1) : 0;
            return <Tag color="blue">{rate}%</Tag>;
        }
    }
  ];

  return (
    <div className="animate-in fade-in duration-1000">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] rounded-[2.5rem] p-8 mb-8 shadow-2xl">
        <div className="relative z-10">
          <Breadcrumb 
            items={[
              { title: <span className="text-white/40 hover:text-white transition-colors cursor-pointer text-[11px] font-medium uppercase tracking-wider">Trang chủ</span> },
              { title: <span className="text-white/40 hover:text-white transition-colors cursor-pointer text-[11px] font-medium uppercase tracking-wider">Báo cáo</span> },
              { title: <span className="text-white/90 text-[11px] font-bold uppercase tracking-wider">Product Analytics</span> },
            ]} 
          />
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-8 gap-8">
            <div className="max-w-2xl">
              <Title level={1} style={{ color: 'white', margin: 0, fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em' }}>
                Phân Tích Hiệu Suất Sản Phẩm
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', marginTop: '8px', display: 'block' }}>
                Theo dõi sức khỏe danh mục hàng hóa, tối ưu tồn kho và thúc đẩy doanh số LIXCO.
              </Text>
            </div>
            
            <div className="flex items-center bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner">
              <RangePicker 
                value={dateRange} 
                onChange={(vals) => setDateRange(vals)}
                className="bg-transparent border-none text-white placeholder-white/30 w-[280px]"
                suffixIcon={<SearchOutlined className="text-blue-400/60" />}
              />
              <Button 
                type="primary" 
                onClick={fetchData}
                loading={loading}
                className="bg-blue-600 border-none rounded-xl px-6 h-10 font-bold"
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-5%] w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <Statistic
              title={<Text style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: 400 }}>TỔNG SẢN PHẨM</Text>}
              value={dashboard?.total_products || 0}
              prefix={<ShoppingOutlined style={{ color: '#3b82f6', fontSize: '20px', marginRight: '8px' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <Statistic
              title={<Text style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: 400 }}>TỔNG TỒN KHO</Text>}
              value={dashboard?.total_stock || 0}
              prefix={<StockOutlined style={{ color: '#10b981', fontSize: '20px', marginRight: '8px' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <Statistic
              title={<Text style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: 400 }}>SẢN PHẨM SẮP HẾT</Text>}
              value={dashboard?.low_stock_products || 0}
              prefix={<WarningOutlined style={{ color: '#ef4444', fontSize: '20px', marginRight: '8px' }} />}
              valueStyle={{ color: '#ef4444', fontWeight: 800, fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <Statistic
              title={<Text style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: 400 }}>BÁN CHẠY NHẤT</Text>}
              value={dashboard?.best_selling_product || 'N/A'}
              prefix={<TrophyOutlined style={{ color: '#f59e0b', fontSize: '20px', marginRight: '8px' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mb-8">
        {/* Top Selling Chart */}
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            title={<div className="flex items-center gap-2"><ArrowUpOutlined className="text-blue-500" /> <span className="font-bold">Top 10 Sản phẩm bán chạy nhất</span></div>}
            extra={<Button icon={<DownloadOutlined />} type="text">Xuất Excel</Button>}
            className="rounded-2xl shadow-sm h-full"
          >
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSelling.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="product_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sold_quantity" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Revenue Contribution */}
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            title={<div className="flex items-center gap-2"><TrophyOutlined className="text-amber-500" /> <span className="font-bold">Tỷ lệ đóng góp doanh thu</span></div>}
            className="rounded-2xl shadow-sm h-full"
          >
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topRevenue.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="product_name"
                  >
                    {topRevenue.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Low Stock Table */}
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            title={<div className="flex items-center gap-2"><WarningOutlined className="text-red-500" /> <span className="font-bold">Sản phẩm sắp hết hàng</span></div>}
            className="rounded-2xl shadow-sm"
          >
            <Table 
              columns={lowStockColumns} 
              dataSource={lowStock} 
              pagination={{ pageSize: 5 }}
              size="small"
              rowKey="product_id"
              locale={{ emptyText: <Empty description="Không có sản phẩm nào sắp hết hàng" /> }}
            />
          </Card>
        </Col>

        {/* Slow Moving Table */}
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            title={<div className="flex items-center gap-2"><HistoryOutlined className="text-indigo-500" /> <span className="font-bold">Sản phẩm bán chậm (Tồn lâu)</span></div>}
            className="rounded-2xl shadow-sm"
          >
            <Table 
              columns={slowMovingColumns} 
              dataSource={slowMoving} 
              pagination={{ pageSize: 5 }}
              size="small"
              rowKey="product_id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductAnalytics;
