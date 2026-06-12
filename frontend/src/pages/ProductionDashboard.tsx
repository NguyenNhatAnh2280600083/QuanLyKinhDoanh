import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Space, Button, message, Typography, Empty } from 'antd';
import { 
  BarChartOutlined, 
  LineChartOutlined, 
  PieChartOutlined, 
  SyncOutlined, 
  RightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import productionPlanService, { DashboardData } from '../services/productionPlanService';

const { Title, Text } = Typography;

const COLORS = ['#6366f1', '#f59e0b', '#10b981']; // Indigo, Amber, Emerald

const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboard = await productionPlanService.getDashboard();
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
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tổng số kế hoạch</span>}
              value={data.total_plans}
              precision={0}
              valueStyle={{ color: '#1e293b', fontWeight: 700, fontSize: '28px' }}
              prefix={<CalendarOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Chờ sản xuất</span>}
              value={data.planned}
              precision={0}
              valueStyle={{ color: '#6366f1', fontWeight: 700, fontSize: '28px' }}
              prefix={<ClockCircleOutlined className="text-indigo-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Đang sản xuất</span>}
              value={data.in_progress}
              precision={0}
              valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: '28px' }}
              prefix={<PlayCircleOutlined className="text-amber-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tỷ lệ hoàn thành TB</span>}
              value={data.completion_rate}
              precision={0}
              valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: '28px' }}
              suffix="%"
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Charts Grid */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Bar Chart: Weekly Volume */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <BarChartOutlined className="text-blue-500" />
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
                    <Bar dataKey="planned" name="Sản lượng kế hoạch" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} />
                    <Bar dataKey="completed" name="Sản lượng thực tế" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
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
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.status_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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
              <div className="flex justify-center items-center h-80">
                <Empty description="Chưa có kế hoạch tuần nào được tạo" />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Row: Line Chart Weekly Progress */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <LineChartOutlined className="text-blue-500" />
                <span className="font-bold text-sm text-gray-700">Xu hướng tiến độ sản xuất hoàn thành trung bình (%)</span>
              </Space>
            }
            className="shadow-sm border-gray-100 rounded-xl"
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
