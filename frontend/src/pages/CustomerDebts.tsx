import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Modal, Form, Select, InputNumber, 
  message, Space, Tag, Row, Col, Input, Typography, DatePicker, Statistic, Divider, Breadcrumb
} from 'antd';
import { 
  SearchOutlined, EyeOutlined, DollarCircleOutlined, 
  HistoryOutlined, FilterOutlined, ArrowUpOutlined, 
  ArrowDownOutlined, AlertOutlined, CheckCircleOutlined,
  DashboardOutlined, ReloadOutlined, CalendarOutlined, EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import debtService from '../services/debtService';
import { CustomerDebtListItem, DebtSummary, DebtStatus } from '../types/debt';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CustomerDebts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [debts, setDebts] = useState<CustomerDebtListItem[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isDueDateModalVisible, setIsDueDateModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<CustomerDebtListItem | null>(null);
  const [form] = Form.useForm();
  const [dueDateForm] = Form.useForm();

  // Filters
  const [filterCustomer, setFilterCustomer] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterDateRange, setFilterDateRange] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterCustomer) params.customer_id = filterCustomer;
      if (filterStatus) params.status = filterStatus;
      if (filterDateRange) {
        params.start_date = filterDateRange[0].startOf('day').toISOString();
        params.end_date = filterDateRange[1].endOf('day').toISOString();
      }

      const [debtsData, summaryData, customersRes] = await Promise.all([
        debtService.getDebts(params),
        debtService.getSummary(),
        api.get('/customers/')
      ]);

      setDebts(debtsData);
      setSummary(summaryData);
      setCustomers(customersRes.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu công nợ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCustomer, filterStatus, filterDateRange]);

  const handlePayment = (debt: CustomerDebtListItem) => {
    setSelectedDebt(debt);
    form.resetFields();
    form.setFieldsValue({
      amount: debt.remaining_amount,
      payment_method: 'cash',
      payment_date: dayjs()
    });
    setIsPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedDebt) return;
    try {
      const values = await form.validateFields();
      await debtService.recordPayment(selectedDebt.id, {
        amount: values.amount,
        payment_method: values.payment_method,
        payment_date: values.payment_date.toISOString(),
        note: values.note
      });
      message.success('Ghi nhận thanh toán thành công');
      setIsPaymentModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi ghi nhận thanh toán');
    }
  };

  const handleEditDueDate = (debt: CustomerDebtListItem) => {
    setSelectedDebt(debt);
    dueDateForm.setFieldsValue({
      due_date: dayjs(debt.due_date)
    });
    setIsDueDateModalVisible(true);
  };

  const handleDueDateSubmit = async () => {
    if (!selectedDebt) return;
    try {
      const values = await dueDateForm.validateFields();
      await debtService.updateDebt(selectedDebt.id, {
        due_date: values.due_date.toISOString()
      });
      message.success('Cập nhật hạn thanh toán thành công');
      setIsDueDateModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi cập nhật hạn thanh toán');
    }
  };

  const getStatusTag = (status: DebtStatus) => {
    switch (status) {
      case DebtStatus.UNPAID:
        return <Tag color="error">CHƯA THANH TOÁN</Tag>;
      case DebtStatus.PARTIAL:
        return <Tag color="warning">THANH TOÁN MỘT PHẦN</Tag>;
      case DebtStatus.PAID:
        return <Tag color="success">ĐÃ THANH TOÁN</Tag>;
      case DebtStatus.OVERDUE:
        return <Tag color="magenta">QUÁ HẠN</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã công nợ',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <Text strong>DEBT-{id}</Text>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_code',
      key: 'order_code',
      render: (code: string, record: any) => (
        <Button type="link" onClick={() => navigate(`/orders`)} style={{ padding: 0 }}>
          {code}
        </Button>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val: number) => <Text strong>{val.toLocaleString()}đ</Text>
    },
    {
      title: 'Đã trả',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (val: number) => <Text type="success">{val.toLocaleString()}đ</Text>
    },
    {
      title: 'Còn nợ',
      dataIndex: 'remaining_amount',
      key: 'remaining_amount',
      render: (val: number) => <Text type="danger" strong>{val.toLocaleString()}đ</Text>
    },
    {
      title: 'Hạn thanh toán',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string) => {
        const isOverdue = dayjs(date).isBefore(dayjs());
        return <Text type={isOverdue ? 'danger' : 'secondary'}>{dayjs(date).format('DD/MM/YYYY')}</Text>
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: DebtStatus) => getStatusTag(status)
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: CustomerDebtListItem) => (
        <Space>
          <Button 
            type="primary" 
            ghost 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/customer-debts/${record.id}`)}
          >
            Chi tiết
          </Button>
          {record.status !== DebtStatus.PAID && (
            <Button 
              type="default" 
              icon={<CalendarOutlined />} 
              onClick={() => handleEditDueDate(record)}
            >
              Hạn trả
            </Button>
          )}
          {record.remaining_amount > 0 && (
            <Button 
              type="primary" 
              icon={<DollarCircleOutlined />} 
              onClick={() => handlePayment(record)}
            >
              Thanh toán
            </Button>
          )}
        </Space>
      )
    }
  ];

  const chartData = summary ? [
    { name: 'Đã thu', value: summary.total_paid },
    { name: 'Còn nợ', value: summary.total_remaining }
  ] : [];

  const COLORS = ['#52c41a', '#f5222d'];

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản lý Công nợ Khách hàng</Title>
          <Breadcrumb 
            items={[
              { title: 'Hệ thống' }, 
              { title: 'Tài chính' }, 
              { title: 'Công nợ' }
            ]} 
          />
        </div>
        <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
            loading={loading}
        >
            Làm mới
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tổng công nợ"
              value={summary?.total_debt || 0}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DashboardOutlined />}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Đã thu hồi"
              value={summary?.total_paid || 0}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Còn phải thu"
              value={summary?.total_remaining || 0}
              precision={0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<HistoryOutlined />}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm border-l-4 border-red-500">
            <Statistic
              title="Nợ quá hạn"
              value={summary?.overdue_amount || 0}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<AlertOutlined />}
              suffix="đ"
            />
            <div className="text-xs text-red-400 mt-1">
              Số lượng: {summary?.overdue_count || 0} đơn hàng
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={16} className="mb-6">
        <Col span={10}>
          <Card title="Tỷ lệ thu hồi nợ" bordered={false} className="shadow-sm h-full">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString() + 'đ'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={14}>
          <Card title="Top khách hàng nợ nhiều nhất" bordered={false} className="shadow-sm h-full">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.top_debt_customers || []} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value: number) => value.toLocaleString() + 'đ'} />
                  <Bar dataKey="amount" fill="#fa8c16" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter Section */}
      <Card bordered={false} className="shadow-sm mb-6">
        <Space size="middle" wrap>
          <div className="flex items-center">
            <Text strong className="mr-2">Khách hàng:</Text>
            <Select 
              style={{ width: 200 }} 
              placeholder="Chọn khách hàng" 
              allowClear
              onChange={setFilterCustomer}
              value={filterCustomer}
              options={customers.map(c => ({ label: c.name, value: c.id }))}
            />
          </div>
          <div className="flex items-center">
            <Text strong className="mr-2">Trạng thái:</Text>
            <Select 
              style={{ width: 180 }} 
              placeholder="Chọn trạng thái" 
              allowClear
              onChange={setFilterStatus}
              value={filterStatus}
            >
              <Option value="unpaid">Chưa thanh toán</Option>
              <Option value="partial">Thanh toán một phần</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="overdue">Quá hạn</Option>
            </Select>
          </div>
          <div className="flex items-center">
            <Text strong className="mr-2">Thời gian:</Text>
            <RangePicker onChange={setFilterDateRange} value={filterDateRange} />
          </div>
          <Button 
            type="default" 
            icon={<FilterOutlined />} 
            onClick={() => {
              setFilterCustomer(undefined);
              setFilterStatus(undefined);
              setFilterDateRange(null);
            }}
          >
            Xóa lọc
          </Button>
        </Space>
      </Card>

      {/* Debt Table */}
      <Card bordered={false} className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={debts} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        title={`Ghi nhận thanh toán - DEBT-${selectedDebt?.id}`}
        open={isPaymentModalVisible}
        onOk={handlePaymentSubmit}
        onCancel={() => setIsPaymentModalVisible(false)}
        okText="Ghi nhận"
        cancelText="Hủy"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Tổng nợ" value={selectedDebt?.total_amount || 0} suffix="đ" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Còn lại" value={selectedDebt?.remaining_amount || 0} suffix="đ" valueStyle={{ color: '#f5222d' }} />
                  </Col>
                </Row>
              </div>
            </Col>
            <Col span={24}>
              <Form.Item 
                name="amount" 
                label="Số tiền thanh toán" 
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiền' },
                  { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="payment_method" 
                label="Phương thức" 
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="cash">Tiền mặt</Option>
                  <Option value="transfer">Chuyển khoản</Option>
                  <Option value="card">Thẻ / POS</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="payment_date" 
                label="Ngày thanh toán" 
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú thanh toán..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Due Date Modal */}
      <Modal
        title={`Cập nhật hạn thanh toán - DEBT-${selectedDebt?.id}`}
        open={isDueDateModalVisible}
        onOk={handleDueDateSubmit}
        onCancel={() => setIsDueDateModalVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
        width={400}
      >
        <Form form={dueDateForm} layout="vertical">
          <Form.Item 
            name="due_date" 
            label="Hạn thanh toán mới" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Text type="secondary">
            * Hệ thống sẽ tự động cập nhật trạng thái "Quá hạn" nếu ngày mới nhỏ hơn hiện tại.
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerDebts;
