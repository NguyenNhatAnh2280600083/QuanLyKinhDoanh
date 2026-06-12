import React, { useState, useEffect } from 'react';
import {
  Card, Button, Space, Tag, Row, Col, Typography,
  Breadcrumb, Descriptions, Divider, Table, Timeline,
  Statistic, Empty, message, Badge, Modal, Form, DatePicker
} from 'antd';
import {
  ArrowLeftOutlined, PrinterOutlined, DollarCircleOutlined,
  UserOutlined, FileTextOutlined, CalendarOutlined,
  CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined,
  HistoryOutlined, EditOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import debtService from '../services/debtService';
import { CustomerDebt, DebtStatus, DebtPayment } from '../types/debt';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CustomerDebtDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [debt, setDebt] = useState<CustomerDebt | null>(null);
  const [isDueDateModalVisible, setIsDueDateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchDebtDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await debtService.getDebtDetail(parseInt(id));
      setDebt(data);
    } catch (error) {
      message.error('Không thể tải chi tiết công nợ');
      navigate('/customer-debts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtDetail();
  }, [id]);

  const handleDueDateSubmit = async () => {
    if (!debt) return;
    try {
      const values = await form.validateFields();
      await debtService.updateDebt(debt.id, {
        due_date: values.due_date.toISOString()
      });
      message.success('Cập nhật hạn thanh toán thành công');
      setIsDueDateModalVisible(false);
      fetchDebtDetail();
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

  const paymentColumns = [
    {
      title: 'Ngày thanh toán',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <Text strong>{val.toLocaleString()}đ</Text>
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => {
        const methods: any = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', card: 'Thẻ / POS' };
        return methods[method] || method;
      }
    },
    {
      title: 'Người thực hiện',
      dataIndex: ['user', 'full_name'],
      key: 'user',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    }
  ];

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (!debt) return <Empty description="Không tìm thấy thông tin công nợ" />;

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Space align="center" size="middle">
            <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/customer-debts')} 
                className="hover:text-blue-600"
            />
            <div>
              <Title level={2} style={{ margin: 0 }}>Chi tiết Công nợ DEBT-{debt.id}</Title>
              <Breadcrumb 
                items={[
                  { title: <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/customer-debts')}>Công nợ</span> }, 
                  { title: `DEBT-${debt.id}` }
                ]} 
              />
            </div>
          </Space>
        </div>
        <Space>
          <Button icon={<PrinterOutlined />}>In phiếu đối chiếu</Button>
          {debt.remaining_amount > 0 && (
            <Button 
                type="primary" 
                icon={<DollarCircleOutlined />}
                onClick={() => navigate('/customer-debts')} // In real case, open payment modal here or redirect back with state
            >
                Ghi nhận thanh toán
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          {/* Main Info */}
          <Card bordered={false} className="shadow-sm mb-6">
            <div className="flex justify-between items-start mb-6">
              <Title level={4}><InfoCircleOutlined className="mr-2" /> Thông tin tổng quan</Title>
              {getStatusTag(debt.status)}
            </div>
            <Row gutter={32}>
              <Col span={12}>
                <Descriptions column={1}>
                  <Descriptions.Item label={<Space><UserOutlined /> Khách hàng</Space>}>
                    <Text strong>{debt.customer.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><FileTextOutlined /> Đơn hàng</Space>}>
                    <Text strong>ORD-{debt.order_id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><CalendarOutlined /> Ngày tạo</Space>}>
                    {dayjs(debt.created_at).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1}>
                  <Descriptions.Item label="Hạn thanh toán">
                    <Space>
                      <Text type={dayjs(debt.due_date).isBefore(dayjs()) ? 'danger' : 'secondary'} strong>
                        {dayjs(debt.due_date).format('DD/MM/YYYY')}
                      </Text>
                      {debt.status !== DebtStatus.PAID && (
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<EditOutlined />} 
                          onClick={() => {
                            form.setFieldsValue({ due_date: dayjs(debt.due_date) });
                            setIsDueDateModalVisible(true);
                          }}
                        />
                      )}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian còn lại">
                    {debt.status === DebtStatus.PAID ? (
                      <Badge status="success" text="Đã hoàn thành" />
                    ) : (
                      <Text strong>
                        {dayjs(debt.due_date).diff(dayjs(), 'day')} ngày
                      </Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16} className="text-center">
              <Col span={8}>
                <Statistic title="Tổng giá trị đơn hàng" value={debt.total_amount} suffix="đ" />
              </Col>
              <Col span={8}>
                <Statistic title="Đã thanh toán" value={debt.paid_amount} suffix="đ" valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Còn nợ" value={debt.remaining_amount} suffix="đ" valueStyle={{ color: '#f5222d' }} />
              </Col>
            </Row>
          </Card>

          {/* Payment History */}
          <Card 
            title={<span><HistoryOutlined className="mr-2" /> Lịch sử thanh toán</span>} 
            bordered={false} 
            className="shadow-sm"
          >
            <Table 
              columns={paymentColumns} 
              dataSource={debt.payments} 
              rowKey="id" 
              pagination={false}
              locale={{ emptyText: 'Chưa có dữ liệu thanh toán' }}
            />
          </Card>
        </Col>

        <Col span={8}>
          {/* Timeline */}
          <Card 
            title={<span><ClockCircleOutlined className="mr-2" /> Timeline thanh toán</span>} 
            bordered={false} 
            className="shadow-sm h-full"
          >
            {debt.payments.length > 0 ? (
              <Timeline 
                mode="left"
                items={[
                  ...debt.payments.map((p, idx) => ({
                    color: idx === 0 ? 'green' : 'blue',
                    label: dayjs(p.payment_date).format('DD/MM/YYYY'),
                    children: (
                      <div className="mb-2">
                        <Text strong>+{p.amount.toLocaleString()}đ</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {p.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </Text>
                      </div>
                    ),
                  })),
                  {
                    color: 'gray',
                    label: dayjs(debt.created_at).format('DD/MM/YYYY'),
                    children: <Text type="secondary">Khởi tạo công nợ</Text>,
                  }
                ]}
              />
            ) : (
              <Empty description="Chưa có lịch sử thanh toán" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Due Date Modal */}
      <Modal
        title="Cập nhật hạn thanh toán"
        open={isDueDateModalVisible}
        onOk={handleDueDateSubmit}
        onCancel={() => setIsDueDateModalVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="due_date" 
            label="Hạn thanh toán mới" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Text type="secondary">
            * Hệ thống sẽ tự động cập nhật trạng thái nếu ngày mới dẫn đến quá hạn.
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerDebtDetail;
