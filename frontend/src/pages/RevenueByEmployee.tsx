import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space, Button, DatePicker, message, Modal, List, Tag, Divider, Breadcrumb, Avatar } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  TeamOutlined, 
  TrophyOutlined,
  SearchOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import employeeReportService, { EmployeeRevenue, EmployeeDashboard, EmployeeRevenueDetail, TopCustomer } from '../services/employeeReportService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const RevenueByEmployee: React.FC = () => {
  const [data, setData] = useState<EmployeeRevenue[]>([]);
  const [dashboard, setDashboard] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRevenueDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange) {
        params.start_date = dateRange[0].startOf('day').toISOString();
        params.end_date = dateRange[1].endOf('day').toISOString();
      }
      
      const [revenueData, dashboardData] = await Promise.all([
        employeeReportService.getRevenueByEmployee(params),
        employeeReportService.getEmployeeDashboard()
      ]);
      
      setData(revenueData);
      setDashboard(dashboardData);
    } catch (error) {
      message.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowDetail = async (employeeId: number) => {
    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const detail = await employeeReportService.getEmployeeRevenueDetail(employeeId);
      setSelectedEmployee(detail);
    } catch (error) {
      message.error('Không thể tải chi tiết nhân viên');
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: EmployeeRevenue, b: EmployeeRevenue) => a.revenue - b.revenue,
      render: (val: number) => <Text type="success" strong>{val.toLocaleString()} đ</Text>,
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'total_orders',
      key: 'total_orders',
      sorter: (a: EmployeeRevenue, b: EmployeeRevenue) => a.total_orders - b.total_orders,
    },
    {
      title: 'Số khách hàng',
      dataIndex: 'total_customers',
      key: 'total_customers',
    },
    {
      title: 'Giá trị đơn TB',
      dataIndex: 'avg_order_value',
      key: 'avg_order_value',
      render: (val: number) => <span>{Math.round(val).toLocaleString()} đ</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: any, record: EmployeeRevenue) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => handleShowDetail(record.employee_id)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in duration-1000">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-[2.5rem] p-10 mb-8 shadow-2xl shadow-blue-200/50">
        <div className="relative z-10">
          <Breadcrumb 
            items={[
              { title: <span className="text-white/50 hover:text-white transition-colors cursor-pointer font-medium text-xs uppercase tracking-widest">Trang chủ</span> },
              { title: <span className="text-white/50 hover:text-white transition-colors cursor-pointer font-medium text-xs uppercase tracking-widest">Báo cáo doanh thu</span> },
              { title: <span className="text-white font-bold text-xs uppercase tracking-widest">Hiệu quả nhân viên</span> },
            ]} 
          />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-6">
            <div>
              <Title level={1} style={{ color: 'white', margin: 0, fontWeight: 800, letterSpacing: '-0.025em' }}>
                Hiệu Quả Nhân Viên Kinh Doanh
              </Title>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <RangePicker 
                value={dateRange} 
                onChange={(vals) => setDateRange(vals)}
                className="bg-white/10 border-none text-white placeholder-white/50 h-12 rounded-xl"
                suffixIcon={<CalendarOutlined className="text-blue-400" />}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={fetchData}
                loading={loading}
                className="bg-blue-600 border-none rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20"
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all">
            <Statistic
              title={<Text type="secondary" className="font-bold uppercase text-[10px] tracking-wider">Tổng doanh thu</Text>}
              value={dashboard?.total_revenue || 0}
              suffix="đ"
              prefix={<DollarOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ color: '#1e1b4bff', fontWeight: 900, fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all">
            <Statistic
              title={<Text type="secondary" className="font-bold uppercase text-[10px] tracking-wider">Tổng đơn hàng</Text>}
              value={dashboard?.total_orders || 0}
              prefix={<ShoppingCartOutlined className="text-emerald-500 mr-2" />}
              valueStyle={{ color: '#065f46', fontWeight: 900, fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all">
            <Statistic
              title={<Text type="secondary" className="font-bold uppercase text-[10px] tracking-wider">Tổng nhân viên</Text>}
              value={dashboard?.total_sales_employees || 0}
              prefix={<TeamOutlined className="text-indigo-500 mr-2" />}
              valueStyle={{ color: '#3730a3', fontWeight: 900, fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all bg-amber-50">
            <Statistic
              title={<Text type="secondary" className="font-bold uppercase text-[10px] tracking-wider">Nhân viên xuất sắc</Text>}
              value={dashboard?.best_employee?.employee_name || 'N/A'}
              prefix={<TrophyOutlined className="text-amber-500 mr-2" />}
              valueStyle={{ color: '#92400e', fontWeight: 900, fontSize: '18px' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mb-8">
        {/* Chart */}
        <Col xs={24} lg={12}>
          <Card title="Top 10 Nhân viên doanh thu cao nhất" className="rounded-[1.5rem] border-none shadow-sm h-full">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="employee_name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [`${val.toLocaleString()} đ`, 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Top customers of best employee or general list */}
        <Col xs={24} lg={12}>
          <Card title="Phân bổ doanh thu theo đơn hàng" className="rounded-[1.5rem] border-none shadow-sm h-full">
             <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="employee_name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total_orders" name="Số đơn hàng" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="total_customers" name="Số khách hàng" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6, fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="rounded-[1.5rem] border-none shadow-sm mb-8 overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          rowKey="employee_id"
          pagination={{ pageSize: 10 }}
          className="custom-table"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
        className="detail-modal"
        centered
      >
        {detailLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : selectedEmployee && (
          <div className="p-4">
            <div className="flex items-center gap-4 mb-8">
              <Avatar size={80} icon={<UserOutlined />} className="bg-blue-100 text-blue-500" />
              <div>
                <Title level={2} className="m-0">{selectedEmployee.employee_name}</Title>
                <Text type="secondary" className="text-lg">{selectedEmployee.email}</Text>
              </div>
            </div>

            <Row gutter={[24, 24]} className="mb-8">
              <Col span={6}>
                <Card className="bg-slate-50 border-none rounded-2xl">
                  <Statistic title="Doanh thu" value={selectedEmployee.revenue} suffix="đ" valueStyle={{ fontWeight: 800 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="bg-slate-50 border-none rounded-2xl">
                  <Statistic title="Đơn hàng" value={selectedEmployee.total_orders} valueStyle={{ fontWeight: 800 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="bg-slate-50 border-none rounded-2xl">
                  <Statistic title="Khách hàng" value={selectedEmployee.total_customers} valueStyle={{ fontWeight: 800 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="bg-slate-50 border-none rounded-2xl">
                  <Statistic title="Giá trị đơn TB" value={Math.round(selectedEmployee.avg_order_value)} suffix="đ" valueStyle={{ fontWeight: 800 }} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col span={14}>
                <Card title="Doanh thu theo tháng" className="rounded-2xl border-slate-100 h-full">
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedEmployee.monthly_revenue}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
              <Col span={10}>
                <Card title="Top 5 khách hàng mua nhiều nhất" className="rounded-2xl border-slate-100 h-full">
                  <List<TopCustomer>
                    dataSource={selectedEmployee.top_customers}
                    renderItem={(item) => (
                      <List.Item className="border-none px-0">
                        <List.Item.Meta
                          avatar={<div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
                          title={<Text strong>{item.customer_name}</Text>}
                        />
                        <Text type="success" strong>{item.revenue.toLocaleString()} đ</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RevenueByEmployee;
