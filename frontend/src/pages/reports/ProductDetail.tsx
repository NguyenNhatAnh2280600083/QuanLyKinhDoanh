import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space, Breadcrumb, message, Avatar, List, Skeleton, Tag, Divider, Button } from 'antd';
import { 
  ShoppingOutlined, 
  DollarOutlined, 
  RiseOutlined, 
  TeamOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  BarcodeOutlined
} from '@ant-design/icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import productAnalyticsService, { ProductDetailAnalytics } from '../../services/productAnalyticsService';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ProductDetailAnalytics | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await productAnalyticsService.getProductDetail(parseInt(id));
        setDetail(data);
      } catch (error) {
        message.error('Không thể tải chi tiết sản phẩm');
        navigate('/reports/product-analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (loading) return <div className="p-8"><Skeleton active avatar paragraph={{ rows: 10 }} /></div>;
  if (!detail) return null;

  const customerColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => (
        <Space>
          <Avatar style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>{text[0]}</Avatar>
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Số lượng mua',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => <Text strong>{val.toLocaleString()}</Text>
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val: number) => <Text type="success" strong>{val.toLocaleString()} đ</Text>
    }
  ];

  return (
    <div className="animate-in fade-in duration-1000">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-100">
        <Breadcrumb 
          items={[
            { title: <span onClick={() => navigate('/')} className="cursor-pointer">Trang chủ</span> },
            { title: <span onClick={() => navigate('/reports/product-analytics')} className="cursor-pointer">Phân tích sản phẩm</span> },
            { title: <span className="font-bold">{detail.product_info.name}</span> },
          ]} 
          className="mb-4"
        />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Space size={20}>
            <div className="p-4 bg-blue-50 rounded-2xl">
              <ShoppingOutlined style={{ fontSize: '32px', color: '#3b82f6' }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0 }}>{detail.product_info.name}</Title>
              <Space split={<Divider type="vertical" />}>
                <Text type="secondary"><BarcodeOutlined /> {detail.product_info.sku}</Text>
                <Text type="secondary"><CalendarOutlined /> Cập nhật mới nhất: {new Date().toLocaleDateString('vi-VN')}</Text>
              </Space>
            </div>
          </Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports/product-analytics')}>
            Quay lại
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl shadow-sm h-full">
            <Statistic
              title={<Text type="secondary">TỔNG DOANH THU</Text>}
              value={detail.total_revenue}
              suffix="đ"
              prefix={<DollarOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl shadow-sm h-full">
            <Statistic
              title={<Text type="secondary">TỔNG ĐÃ BÁN</Text>}
              value={detail.sold_quantity}
              prefix={<ShoppingOutlined className="text-emerald-500 mr-2" />}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl shadow-sm h-full">
            <Statistic
              title={<Text type="secondary">TB BÁN / THÁNG</Text>}
              value={Math.round(detail.average_monthly_sales)}
              prefix={<RiseOutlined className="text-indigo-500 mr-2" />}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl shadow-sm h-full">
            <Statistic
              title={<Text type="secondary">TỒN KHO HIỆN TẠI</Text>}
              value={detail.product_info.stock_quantity}
              valueStyle={{ color: detail.product_info.stock_quantity < 50 ? '#ef4444' : '#1e293b', fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Sales Trend Chart */}
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            title={<span className="font-bold">Xu hướng bán hàng theo tháng</span>}
            className="rounded-2xl shadow-sm h-full"
          >
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detail.monthly_sales} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6 }} />
                  <Line type="monotone" dataKey="quantity" name="Số lượng" stroke="#10b981" strokeWidth={4} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Top Customers for this product */}
        <Col xs={24} lg={8}>
          <Card 
            bordered={false} 
            title={<div className="flex items-center gap-2"><TeamOutlined className="text-blue-500" /> <span className="font-bold">Top khách hàng mua nhiều nhất</span></div>}
            className="rounded-2xl shadow-sm h-full"
          >
            <Table 
              columns={customerColumns} 
              dataSource={detail.top_customers} 
              pagination={false}
              size="small"
              rowKey="customer_id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDetail;
