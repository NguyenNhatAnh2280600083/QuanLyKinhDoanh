import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Space, Button, message, Typography, Empty } from 'antd';
import { 
  BarChartOutlined, 
  LineChartOutlined, 
  PieChartOutlined, 
  SyncOutlined, 
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExperimentOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import weeklyProductionService, { WeeklyProductionDashboardData } from '../../services/weeklyProductionService';

const { Title, Text } = Typography;

const COLORS = ['#6366f1', '#f59e0b', '#10b981']; // Indigo, Amber, Emerald

const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<WeeklyProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboard = await weeklyProductionService.getProductionDashboard();
      setData(dashboard);
    } catch (error) {
      message.error('Không thể tải dữ liệu Dashboard sản xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang kết xuất báo cáo và biểu đồ sản xuất..." />
      </div>
    );
  }

  if (!data) {
    return <Empty description="Không có dữ liệu thống kê sản xuất" />;
  }

  return (
    <div className="p-0">
      {/* Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Dashboard Thống kê Sản xuất
          </Title>
          <Text type="secondary">
            Báo cáo hiệu năng vận hành sản xuất tuần, sản lượng và tiến độ hoàn thành các chỉ tiêu LIXCO
          </Text>
        </div>
        <Space>
          <Button 
            icon={<ExperimentOutlined />} 
            onClick={() => navigate('/production/suggestions')}
          >
            Đề xuất sản xuất tuần
          </Button>
          <Button 
            type="primary"
            icon={<CalendarOutlined />} 
            onClick={() => navigate('/production/weekly')}
          >
            Quản lý Kế hoạch tuần
          </Button>
          <Button icon={<SyncOutlined />} onClick={fetchDashboardData}>Làm mới</Button>
        </Space>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tổng sản phẩm cần sản xuất</span>}
              value={data.total_products_need_production}
              precision={0}
              valueStyle={{ color: '#2563eb', fontWeight: 700, fontSize: '28px' }}
              prefix={<ExperimentOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tổng số lượng đề xuất</span>}
              value={data.total_planned_quantity}
              precision={0}
              valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: '28px' }}
              prefix={<DatabaseOutlined className="text-emerald-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Sản phẩm sắp hết</span>}
              value={data.low_stock_products}
              precision={0}
              valueStyle={{ color: '#ef4444', fontWeight: 700, fontSize: '28px' }}
              prefix={<WarningOutlined className="text-red-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tỷ lệ hoàn thành tuần trước</span>}
              value={data.completion_rate}
              precision={1}
              valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: '28px' }}
              suffix="%"
              prefix={<CheckCircleOutlined className="text-amber-500 mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Charts Grid */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Horizontal Bar Chart: Top Products to Produce */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined className="text-blue-500" />
                <span className="font-bold text-sm text-gray-700">Top sản phẩm cần sản xuất thêm (chiếc)</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl h-full"
          >
            {data.top_products_need_production && data.top_products_need_production.length > 0 ? (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={data.top_products_need_production}
                    layout="vertical"
                    margin={{ top: 15, right: 15, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis 
                      dataKey="product_name" 
                      type="category" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#475569', fontSize: 11 }} 
                      width={120} 
                    />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar 
                      dataKey="suggested_production" 
                      name="Số lượng đề xuất" 
                      fill="#3b82f6" 
                      radius={[0, 4, 4, 0]} 
                      barSize={16} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-80">
                <Empty description="Không có sản phẩm nào có đề xuất sản xuất" />
              </div>
            )}
          </Card>
        </Col>

        {/* Bar Chart: Weekly Volume */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BarChartOutlined className="text-indigo-500" />
                <span className="font-bold text-sm text-gray-700">Tổng sản lượng sản xuất theo tuần (chiếc)</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl h-full"
          >
            {data.weekly_volume.length > 0 ? (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={data.weekly_volume}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="planned" name="Sản lượng kế hoạch" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="completed" name="Sản lượng thực tế" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-80">
                <Empty description="Chưa có dữ liệu sản lượng tuần" />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Pie Chart: Status Distribution */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlined className="text-blue-500" />
                <span className="font-bold text-sm text-gray-700">Cơ cấu trạng thái kế hoạch tuần</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl h-full"
          >
            {data.total_plans > 0 ? (
              <div className="flex flex-col justify-center items-center">
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.status_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.status_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} kế hoạch`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-full flex flex-col gap-2 mt-2 px-4">
                  {data.status_distribution.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <Space>
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-gray-500">{item.label}</span>
                      </Space>
                      <span className="font-bold text-gray-700">{item.value} ({data.total_plans > 0 ? Math.round(item.value / data.total_plans * 100) : 0}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-60">
                <Empty description="Chưa có kế hoạch tuần nào được tạo" />
              </div>
            )}
          </Card>
        </Col>

        {/* Row: Line Chart Weekly Progress */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <LineChartOutlined className="text-amber-500" />
                <span className="font-bold text-sm text-gray-700">Xu hướng tiến độ sản xuất hoàn thành trung bình (%)</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl h-full"
          >
            {data.weekly_progress.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={data.weekly_progress}
                    margin={{ top: 10, right: 20, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}%`]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      name="Tiến độ hoàn thành trung bình" 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-60">
                <Empty description="Chưa có dữ liệu tiến trình" />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductionDashboard;
