import React, { useEffect, useState } from 'react';
import { 
  Table, Tag, Card, Button, Space, InputNumber, 
  message, Row, Col, Typography, Checkbox, Tooltip, Statistic 
} from 'antd';
import { 
  ExperimentOutlined, 
  CalendarOutlined, 
  DatabaseOutlined, 
  LineChartOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import weeklyProductionService, { WeeklySuggestion, WeeklyProductionDashboardData } from '../../services/weeklyProductionService';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

interface SuggestionRow extends WeeklySuggestion {
  key: number;
  selected: boolean;
  edited_quantity: number;
}

const WeeklyProductionSuggestion: React.FC = () => {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [dashboardData, setDashboardData] = useState<WeeklyProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Get next week and year by default
  const defaultNextWeek = () => {
    const nextWeekDate = dayjs().add(7, 'day');
    // Simple week number estimation
    const startOfYear = dayjs(`${nextWeekDate.year()}-01-01`);
    const diffInDays = nextWeekDate.diff(startOfYear, 'day');
    return Math.ceil((diffInDays + startOfYear.day() + 1) / 7);
  };

  const [weekNumber, setWeekNumber] = useState<number>(defaultNextWeek());
  const [year, setYear] = useState<number>(dayjs().year());

  const isAdminOrManager = user?.role.name === 'admin' || user?.role.name === 'manager';

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await weeklyProductionService.getWeeklySuggestions();
      const rows: SuggestionRow[] = data.map(item => ({
        ...item,
        key: item.product_id,
        // Auto-select products that need production or are low stock
        selected: item.suggested_production > 0 || item.status === 'LOW_STOCK',
        edited_quantity: item.suggested_production
      }));
      setSuggestions(rows);

      // Fetch dashboard KPIs
      const dashboard = await weeklyProductionService.getProductionDashboard();
      setDashboardData(dashboard);
    } catch (error) {
      message.error('Không thể tải đề xuất kế hoạch sản xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (productId: number, checked: boolean) => {
    setSuggestions(prev => 
      prev.map(row => row.product_id === productId ? { ...row, selected: checked } : row)
    );
  };

  const handleQuantityChange = (productId: number, val: number | null) => {
    const qty = val || 0;
    setSuggestions(prev => 
      prev.map(row => row.product_id === productId ? { ...row, edited_quantity: qty } : row)
    );
  };

  const handleCreatePlan = async () => {
    if (!isAdminOrManager) {
      message.error('Bạn không có quyền thực hiện hành động này');
      return;
    }

    const selectedPlans = suggestions
      .filter(row => row.selected && row.edited_quantity > 0)
      .map(row => ({
        product_id: row.product_id,
        planned_quantity: row.edited_quantity
      }));

    if (selectedPlans.length === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm và nhập số lượng sản xuất lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      await weeklyProductionService.createWeekPlan({
        week_number: weekNumber,
        year: year,
        plans: selectedPlans
      });
      message.success(`Tạo kế hoạch sản xuất tuần ${weekNumber} năm ${year} thành công!`);
      // Navigate to plans page
      navigate('/production/weekly');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tạo kế hoạch sản xuất tuần');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'NEED_PRODUCTION':
        return <Tag icon={<ExperimentOutlined />} color="blue">CẦN SẢN XUẤT</Tag>;
      case 'LOW_STOCK':
        return <Tag icon={<WarningOutlined />} color="red">TỒN KHO THẤP</Tag>;
      case 'NO_NEED':
        return <Tag icon={<CheckCircleOutlined />} color="green">ĐỦ HÀNG</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Chọn',
      key: 'select',
      width: 60,
      align: 'center' as const,
      render: (_: any, record: SuggestionRow) => (
        <Checkbox
          checked={record.selected}
          disabled={!isAdminOrManager}
          onChange={(e) => handleCheckboxChange(record.product_id, e.target.checked)}
        />
      )
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string) => <span className="font-semibold text-gray-800">{text}</span>
    },
    {
      title: 'Bán tuần qua',
      dataIndex: 'sold_last_week',
      key: 'sold_last_week',
      align: 'right' as const,
      render: (num: number) => num.toLocaleString()
    },
    {
      title: 'Trung bình / ngày',
      dataIndex: 'avg_daily_sales',
      key: 'avg_daily_sales',
      align: 'right' as const,
      render: (num: number) => num.toLocaleString()
    },
    {
      title: 'Dự báo tuần tới',
      dataIndex: 'forecast_next_week',
      key: 'forecast_next_week',
      align: 'right' as const,
      render: (num: number) => num.toLocaleString()
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'current_stock',
      key: 'current_stock',
      align: 'right' as const,
      render: (num: number) => (
        <span className={num <= 10 ? 'text-red-500 font-medium' : 'text-gray-700'}>
          {num.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Tồn an toàn',
      dataIndex: 'safety_stock',
      key: 'safety_stock',
      align: 'right' as const,
      render: (num: number) => num.toLocaleString()
    },
    {
      title: 'Đề xuất sản xuất',
      dataIndex: 'suggested_production',
      key: 'suggested_production',
      align: 'right' as const,
      render: (num: number) => (
        <span className={num > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}>
          {num.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Số lượng chỉnh sửa',
      key: 'edited_quantity',
      width: 140,
      render: (_: any, record: SuggestionRow) => (
        <InputNumber
          min={0}
          value={record.edited_quantity}
          disabled={!record.selected || !isAdminOrManager}
          onChange={(val) => handleQuantityChange(record.product_id, val)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    }
  ];

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Đề xuất Kế hoạch Sản xuất Tuần
          </Title>
          <Text type="secondary">
            Phân tích dữ liệu bán hàng 7 ngày gần nhất để tự động lập kế hoạch sản xuất tuần mới cho LIXCO
          </Text>
        </div>
        <Space>
          <Button 
            icon={<LineChartOutlined />} 
            onClick={() => navigate('/production/dashboard')}
          >
            Dashboard sản xuất
          </Button>
          <Button 
            icon={<CalendarOutlined />} 
            onClick={() => navigate('/production/weekly')}
          >
            Kế hoạch tuần
          </Button>
          <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tổng sp cần sản xuất</span>}
              value={dashboardData?.total_products_need_production ?? 0}
              valueStyle={{ color: '#2563eb', fontWeight: 700, fontSize: '28px' }}
              prefix={<ExperimentOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tổng số lượng đề xuất</span>}
              value={dashboardData?.total_planned_quantity ?? 0}
              valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: '28px' }}
              prefix={<DatabaseOutlined className="text-emerald-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Sản phẩm sắp hết</span>}
              value={dashboardData?.low_stock_products ?? 0}
              valueStyle={{ color: '#ef4444', fontWeight: 700, fontSize: '28px' }}
              prefix={<WarningOutlined className="text-red-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-400 font-semibold uppercase text-xs tracking-wider">Tỷ lệ hoàn thành tuần trước</span>}
              value={dashboardData?.completion_rate ?? 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: '28px' }}
              prefix={<CheckCircleOutlined className="text-amber-500 mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Action panel for creating plan */}
      <Card className="mb-6 shadow-sm border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Space direction="vertical" size={2}>
              <span className="text-xs text-gray-400 font-medium">NĂM SẢN XUẤT</span>
              <InputNumber
                min={2020}
                max={2050}
                value={year}
                onChange={(val) => setYear(val || dayjs().year())}
                disabled={!isAdminOrManager}
                style={{ width: 120 }}
              />
            </Space>
            <Space direction="vertical" size={2}>
              <span className="text-xs text-gray-400 font-medium">TUẦN SẢN XUẤT</span>
              <InputNumber
                min={1}
                max={53}
                value={weekNumber}
                onChange={(val) => setWeekNumber(val || 1)}
                disabled={!isAdminOrManager}
                style={{ width: 120 }}
              />
            </Space>
          </div>
          
          <div>
            {isAdminOrManager ? (
              <Button 
                type="primary" 
                size="large"
                icon={<CheckCircleOutlined />}
                loading={submitting}
                onClick={handleCreatePlan}
                className="bg-blue-600 hover:bg-blue-700 font-semibold h-11"
              >
                Tạo kế hoạch tuần {weekNumber}
              </Button>
            ) : (
              <Tooltip title="Chỉ Admin hoặc Manager mới có quyền tạo kế hoạch">
                <Button 
                  type="primary" 
                  size="large"
                  disabled
                  className="font-semibold h-11"
                >
                  Tạo kế hoạch tuần (Khóa)
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </Card>

      {/* Suggestions Table */}
      <Card className="shadow-sm border-gray-100" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={suggestions}
          loading={loading}
          pagination={false}
          className="border-none"
        />
      </Card>
    </div>
  );
};

export default WeeklyProductionSuggestion;
