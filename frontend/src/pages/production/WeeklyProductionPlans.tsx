import React, { useEffect, useState } from 'react';
import { 
  Table, Tag, Card, Button, Space, Modal, Form, InputNumber, Select, 
  DatePicker, message, Progress, Input, Typography, Row, Col, Tooltip
} from 'antd';
import { 
  EyeOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  SyncOutlined, 
  CheckCircleOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  LineChartOutlined,
  ExperimentOutlined,
  CloseCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import productionPlanService, { ProductionPlan } from '../../services/productionPlanService';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const WeeklyProductionPlans: React.FC = () => {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Filters
  const [filterWeek, setFilterWeek] = useState<number | undefined>(undefined);
  const [filterYear, setFilterYear] = useState<number | undefined>(dayjs().year());
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterProductId, setFilterProductId] = useState<number | undefined>(undefined);

  const isAdminOrManager = user?.role.name === 'admin' || user?.role.name === 'manager';

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await productionPlanService.getPlans({
        week_number: filterWeek,
        year: filterYear,
        status: filterStatus,
        product_id: filterProductId
      });
      setPlans(data.items);
    } catch (error) {
      message.error('Không thể tải danh sách kế hoạch sản xuất');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [filterWeek, filterYear, filterStatus, filterProductId]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const range = values.date_range;
      if (!range || range.length < 2) {
        message.error('Vui lòng chọn khoảng thời gian tuần');
        return;
      }

      const payload = {
        product_id: values.product_id,
        planned_quantity: values.planned_quantity,
        week_number: values.week_number,
        year: values.year,
        start_date: range[0].toISOString(),
        end_date: range[1].toISOString(),
        note: values.note
      };

      await productionPlanService.createPlan(payload);
      message.success('Tạo kế hoạch sản xuất tuần thành công');
      setIsCreateModalVisible(false);
      form.resetFields();
      fetchPlans();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tạo kế hoạch sản xuất');
    }
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0]) {
      const startDate = dates[0];
      const year = startDate.year();
      // Estimate ISO week number
      const startOfYear = dayjs(`${year}-01-01`);
      const diffInDays = startDate.diff(startOfYear, 'day');
      const weekNumber = Math.ceil((diffInDays + startOfYear.day() + 1) / 7);
      
      form.setFieldsValue({
        week_number: weekNumber,
        year: year
      });
    }
  };

  const handleQuickComplete = async (id: number) => {
    try {
      await productionPlanService.completePlan(id);
      message.success('Hoàn thành kế hoạch thành công');
      fetchPlans();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi hoàn thành kế hoạch');
    }
  };

  const handleCancel = async (id: number) => {
    Modal.confirm({
      title: 'Xác nhận huỷ kế hoạch',
      content: 'Bạn có chắc chắn muốn huỷ kế hoạch sản xuất này?',
      okText: 'Xác nhận',
      cancelText: 'Không',
      onOk: async () => {
        try {
          await productionPlanService.cancelPlan(id);
          message.success('Huỷ kế hoạch thành công');
          fetchPlans();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Lỗi khi huỷ kế hoạch');
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xoá vĩnh viễn',
      content: 'Bạn có chắc chắn muốn xoá kế hoạch này vĩnh viễn khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác!',
      okText: 'Xoá vĩnh viễn',
      cancelText: 'Không',
      okType: 'danger',
      onOk: async () => {
        try {
          await productionPlanService.deletePlan(id);
          message.success('Xoá kế hoạch vĩnh viễn thành công');
          fetchPlans();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Lỗi khi xoá kế hoạch');
        }
      }
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Tag icon={<ClockCircleOutlined />} color="default">CHỜ SẢN XUẤT</Tag>;
      case 'IN_PROGRESS':
        return <Tag icon={<SyncOutlined spin />} color="processing">ĐANG SẢN XUẤT</Tag>;
      case 'COMPLETED':
        return <Tag icon={<CheckCircleOutlined />} color="success">HOÀN THÀNH</Tag>;
      case 'CANCELLED':
        return <Tag color="red">ĐÃ HỦY</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getProductionDuration = (startedAt?: string | null, completedAt?: string | null) => {
    if (!startedAt || !completedAt) return <span className="text-gray-400">—</span>;
    
    const start = dayjs(startedAt);
    const end = dayjs(completedAt);
    const duration = end.diff(start, 'millisecond');
    
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    let durationText = '';
    if (days > 0) durationText += `${days} ngày `;
    if (hours > 0) durationText += `${hours} giờ `;
    if (minutes > 0) durationText += `${minutes} phút`;
    
    if (!durationText) return '< 1 phút';
    
    return durationText.trim();
  };

  const columns = [
    {
      title: 'Mã kế hoạch',
      dataIndex: 'plan_code',
      key: 'plan_code',
      render: (code: string, record: ProductionPlan) => (
        <span 
          className="font-bold text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/production/weekly/${record.id}`)}
        >
          {code}
        </span>
      )
    },
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product_name',
      render: (name: string, record: ProductionPlan) => (
        <div>
          <span className="font-semibold text-gray-800">{name}</span>
          {record.order_id && (
            <div style={{ fontSize: '11px' }}>
              <Tag color="purple" style={{ margin: '2px 0 0 0' }}>Đơn hàng #{record.order_id}</Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Tuần & Thời gian',
      key: 'week_info',
      render: (_: any, record: ProductionPlan) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">Tuần {record.week_number} ({record.year})</span>
          <span className="text-xs text-gray-500">
            {dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}
          </span>
        </Space>
      )
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : <span className="text-gray-400">—</span>
    },
    {
      title: 'Thời gian hoàn thành',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : <span className="text-gray-400">—</span>
    },
    {
      title: 'Thời gian sản xuất',
      key: 'production_duration',
      render: (_: any, record: any) => getProductionDuration(record.started_at, record.completed_at)
    },
    {
      title: 'Tiến độ sản xuất',
      key: 'progress',
      render: (_: any, record: ProductionPlan) => (
        <div style={{ width: 160 }}>
          <Progress 
            percent={record.progress_percent} 
            size="small" 
            status={record.status === 'COMPLETED' ? 'success' : record.status === 'CANCELLED' ? 'exception' : 'active'} 
          />
          <div className="flex justify-between mt-1 text-[11px] text-gray-400">
            <span>Đã làm: {record.completed_quantity.toLocaleString()}</span>
            <span>Mục tiêu: {record.planned_quantity.toLocaleString()}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ProductionPlan) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/production/weekly/${record.id}`)}
          >
            Chi tiết
          </Button>
          {isAdminOrManager && record.status !== 'COMPLETED' && record.status !== 'CANCELLED' && (
            <Tooltip title="Đánh dấu hoàn thành ngay">
              <Button 
                type="text" 
                style={{ color: '#52c41a' }}
                icon={<CheckCircleOutlined />} 
                onClick={() => handleQuickComplete(record.id)}
              >
                Hoàn thành
              </Button>
            </Tooltip>
          )}
          {isAdminOrManager && record.status !== 'COMPLETED' && record.status !== 'CANCELLED' && (
            <Tooltip title="Huỷ kế hoạch">
              <Button 
                type="text" 
                style={{ color: '#ff4d4f' }}
                icon={<CloseCircleOutlined />} 
                onClick={() => handleCancel(record.id)}
              >
                Huỷ
              </Button>
            </Tooltip>
          )}
          {isAdminOrManager && (
            <Tooltip title="Xoá vĩnh viễn">
              <Button 
                type="text" 
                style={{ color: '#faad14' }}
                icon={<DeleteOutlined />} 
                onClick={() => handleDelete(record.id)}
              >
                Xoá
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Kế hoạch sản xuất theo tuần
          </Title>
          <Text type="secondary">
            Lập lịch, theo dõi tiến độ sản xuất và kiểm tra nhu cầu nguyên vật liệu nội bộ LIXCO
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
            icon={<ExperimentOutlined />} 
            onClick={() => navigate('/production/suggestions')}
          >
            Đề xuất sản xuất tuần
          </Button>
          {isAdminOrManager && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                form.resetFields();
                setIsCreateModalVisible(true);
              }}
            >
              Thêm kế hoạch thủ công
            </Button>
          )}
          <Button icon={<SyncOutlined />} onClick={fetchPlans}>Làm mới</Button>
        </Space>
      </div>

      {/* Filters Card */}
      <Card className="mb-6 shadow-sm border-gray-100">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-400 mb-1">Sản phẩm</div>
            <Select
              showSearch
              placeholder="Tất cả sản phẩm"
              optionFilterProp="children"
              allowClear
              style={{ width: '100%' }}
              value={filterProductId}
              onChange={setFilterProductId}
            >
              {products.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div className="text-xs text-gray-400 mb-1">Năm</div>
            <InputNumber
              placeholder="Năm"
              style={{ width: '100%' }}
              value={filterYear}
              onChange={val => setFilterYear(val ?? undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div className="text-xs text-gray-400 mb-1">Tuần</div>
            <InputNumber
              placeholder="Số tuần (1-53)"
              min={1}
              max={53}
              style={{ width: '100%' }}
              value={filterWeek}
              onChange={val => setFilterWeek(val ?? undefined)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-xs text-gray-400 mb-1">Trạng thái</div>
            <Select
              placeholder="Tất cả trạng thái"
              allowClear
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Option value="PLANNED">Chờ sản xuất</Option>
              <Option value="IN_PROGRESS">Đang sản xuất</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="CANCELLED">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} className="flex items-end">
            <Button 
              type="default" 
              icon={<SearchOutlined />} 
              onClick={fetchPlans}
              className="w-full mt-5"
            >
              Lọc kết quả
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Plans Table */}
      <Card className="shadow-sm border-gray-100" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={plans}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined className="text-blue-600" />
            <span className="font-bold">Tạo Kế hoạch Sản xuất Tuần mới</span>
          </Space>
        }
        open={isCreateModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setIsCreateModalVisible(false)}
        width={600}
        okText="Tạo kế hoạch"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ year: dayjs().year() }}>
          <Form.Item 
            name="product_id" 
            label="Sản phẩm cần sản xuất" 
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select showSearch optionFilterProp="children" placeholder="Chọn sản phẩm từ danh mục">
              {products.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name} (Tồn: {p.stock_quantity.toLocaleString()} chiếc)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                name="date_range" 
                label="Khoảng thời gian tuần sản xuất" 
                rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY" 
                  onChange={handleDateRangeChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="week_number" 
                label="Số tuần" 
                rules={[{ required: true, message: 'Vui lòng nhập tuần' }]}
              >
                <InputNumber min={1} max={53} style={{ width: '100%' }} placeholder="Ví dụ: 24" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="year" 
                label="Năm" 
                rules={[{ required: true, message: 'Vui lòng nhập năm' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Năm" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="planned_quantity" 
                label="Số lượng kế hoạch" 
                rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Ví dụ: 5000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú kế hoạch sản xuất">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú hoặc chỉ thị cụ thể (Ví dụ: Sản xuất bột giặt Lix tuần 24)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WeeklyProductionPlans;
