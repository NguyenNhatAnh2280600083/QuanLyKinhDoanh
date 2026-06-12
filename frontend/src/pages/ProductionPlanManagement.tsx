import React, { useEffect, useState } from 'react';
import { 
  Table, Tag, Card, Button, Space, Modal, Form, InputNumber, Select, 
  DatePicker, message, Progress, Descriptions, Divider, Input, Typography, 
  Row, Col 
} from 'antd';
import { EditOutlined, EyeOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, SearchOutlined, PlusOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

interface ProductionPlan {
  id: number;
  order_id: number | null;
  product_id: number;
  required_quantity: number;
  planned_quantity: number;
  completed_quantity: number;
  status: string;
  expected_completion_date: string;
  actual_completion_date: string | null;
  note: string;
  created_at: string;
  product: {
    id: number;
    name: string;
  };
}

interface Product {
  id: number;
  name: string;
  stock_quantity: number;
}

const ProductionPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const { user } = useAuthStore();
  const [searchOrderId, setSearchOrderId] = useState<string>('');

  const isAdminOrManager = user?.role.name === 'admin' || user?.role.name === 'manager';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, productsRes] = await Promise.all([
        api.get('/production-plans/', {
          params: { order_id: searchOrderId || undefined }
        }),
        api.get('/products/')
      ]);
      setPlans(plansRes.data.items);
      setProducts(productsRes.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchOrderId]);

  const handleUpdate = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    form.setFieldsValue({
      completed_quantity: plan.completed_quantity,
    });
    setIsUpdateModalVisible(true);
  };

  const handleCreateDirective = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
        expected_completion_date: dayjs().add(7, 'day')
    });
    setIsCreateModalVisible(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedPlan) return;
    try {
      const values = await form.validateFields();
      await api.patch(`/production-plans/${selectedPlan.id}/quantity`, {
        completed_quantity: values.completed_quantity
      });
      message.success('Cập nhật tiến độ thành công');
      setIsUpdateModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const handleCancelPlan = async (plan: ProductionPlan) => {
    Modal.confirm({
      title: 'Xác nhận hủy kế hoạch',
      content: `Bạn có chắc chắn muốn hủy kế hoạch sản xuất #${plan.id} cho sản phẩm "${plan.product.name}" không?`,
      okText: 'Xác nhận hủy',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: async () => {
        try {
          await api.patch(`/production-plans/${plan.id}/cancel`);
          message.success('Hủy kế hoạch thành công');
          fetchData();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Hủy kế hoạch thất bại');
        }
      }
    });
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
          ...values,
          expected_completion_date: values.expected_completion_date.toISOString(),
          required_quantity: values.planned_quantity // For directives, required = planned
      };
      await api.post('/production-plans/', payload);
      message.success('Tạo kế hoạch sản xuất theo chỉ thị thành công');
      setIsCreateModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tạo kế hoạch');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'waiting_production':
        return <Tag icon={<ClockCircleOutlined />} color="default">CHỜ SẢN XUẤT</Tag>;
      case 'in_production':
        return <Tag icon={<SyncOutlined spin />} color="processing">ĐANG SẢN XUẤT</Tag>;
      case 'production_done':
        return <Tag icon={<CheckCircleOutlined />} color="success">HOÀN TẤT</Tag>;
      case 'cancelled':
        return <Tag color="red">ĐÃ HỦY</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    { 
        title: 'Mã ĐH / Chỉ thị', 
        dataIndex: 'order_id', 
        key: 'order_id',
        render: (id: number | null) => id ? (
            <Tag color="blue">ORD-{id}</Tag>
        ) : (
            <Tag color="purple" icon={<FileTextOutlined />}>CHỈ THỊ CÔNG TY</Tag>
        )
    },
    { title: 'Sản phẩm', dataIndex: ['product', 'name'], key: 'product' },
    { 
      title: 'Tiến độ', 
      key: 'progress',
      render: (_: any, record: ProductionPlan) => {
        const percent = Math.round((record.completed_quantity / record.planned_quantity) * 100);
        return (
          <div style={{ width: 140 }}>
            <Progress percent={percent} size="small" status={record.status === 'production_done' ? 'success' : 'active'} />
            <div style={{fontSize: '11px', color: '#8c8c8c', marginTop: '4px'}}>
                {record.completed_quantity} / {record.planned_quantity} đơn vị
            </div>
          </div>
        );
      }
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    { 
      title: 'Dự kiến xong', 
      dataIndex: 'expected_completion_date', 
      key: 'expected_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ProductionPlan) => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined />} onClick={() => { setSelectedPlan(record); setIsDetailVisible(true); }}>Xem</Button>
          {isAdminOrManager && record.status !== 'production_done' && record.status !== 'cancelled' && (
            <>
              <Button type="primary" size="small" ghost icon={<EditOutlined />} onClick={() => handleUpdate(record)}>Cập nhật</Button>
              <Button type="primary" danger size="small" ghost icon={<DeleteOutlined />} onClick={() => handleCancelPlan(record)}>Hủy</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700 }}>Quản lý kế hoạch sản xuất</h2>
          <Text type="secondary">Điều phối sản xuất theo đơn hàng và chỉ thị kho</Text>
        </div>
        <Space>
          <Input 
            placeholder="Tìm theo mã ĐH..." 
            prefix={<SearchOutlined />} 
            value={searchOrderId}
            onChange={e => setSearchOrderId(e.target.value)}
            style={{ width: 220 }}
          />
          {isAdminOrManager && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDirective}>
                Tạo kế hoạch chỉ thị
            </Button>
          )}
          <Button icon={<SyncOutlined />} onClick={fetchData}>Làm mới</Button>
        </Space>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={plans}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal Tạo kế hoạch chỉ thị */}
      <Modal
        title={<span><PlusOutlined /> Tạo kế hoạch sản xuất theo chỉ thị</span>}
        open={isCreateModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setIsCreateModalVisible(false)}
        width={500}
        okText="Tạo kế hoạch"
        cancelText="Hủy"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item 
            name="product_id" 
            label="Sản phẩm cần sản xuất" 
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select showSearch optionFilterProp="children" placeholder="Chọn sản phẩm từ danh mục">
              {products.map(p => (
                <Option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock_quantity})</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="planned_quantity" 
                label="Số lượng sản xuất" 
                rules={[{ required: true, message: 'Nhập số lượng' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Số lượng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="expected_completion_date" 
                label="Ngày dự kiến hoàn thành"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú / Chỉ thị cụ thể">
            <Input.TextArea rows={3} placeholder="Nhập các yêu cầu kỹ thuật hoặc chỉ thị từ công ty..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Cập nhật tiến độ */}
      <Modal
        title="Cập nhật tiến độ sản xuất"
        open={isUpdateModalVisible}
        onOk={handleUpdateSubmit}
        onCancel={() => setIsUpdateModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{fontSize: '12px', color: '#8c8c8c'}}>Sản phẩm đang sản xuất:</div>
            <div style={{fontWeight: 700, fontSize: '16px'}}>{selectedPlan?.product.name}</div>
            <div style={{marginTop: '8px'}}>
                Mục tiêu: <Tag color="blue">{selectedPlan?.planned_quantity} đơn vị</Tag>
            </div>
          </div>
          
          <Form.Item 
            name="completed_quantity" 
            label="Số lượng thực tế đã hoàn thành" 
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} size="large" />
          </Form.Item>
          
          <Text type="secondary" italic style={{fontSize: '12px'}}>
            * Khi số lượng hoàn thành đạt mục tiêu, trạng thái sẽ tự động chuyển thành HOÀN TẤT và nhập kho.
          </Text>
        </Form>
      </Modal>

      {/* Modal Chi tiết */}
      <Modal
        title={`Chi tiết kế hoạch #${selectedPlan?.id}`}
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setIsDetailVisible(false)}>Đóng</Button>]}
        width={700}
      >
        {selectedPlan && (
          <div style={{ padding: '8px 0' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Nguồn gốc" span={1}>
                {selectedPlan.order_id ? `Đơn hàng #ORD-${selectedPlan.order_id}` : <Tag color="purple">Chỉ thị công ty</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={1}>{getStatusTag(selectedPlan.status)}</Descriptions.Item>
              <Descriptions.Item label="Sản phẩm" span={2}>{selectedPlan.product.name}</Descriptions.Item>
              <Descriptions.Item label="Số lượng mục tiêu">{selectedPlan.planned_quantity}</Descriptions.Item>
              <Descriptions.Item label="Số lượng hoàn thành">{selectedPlan.completed_quantity}</Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">{dayjs(selectedPlan.created_at).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Dự kiến xong">{dayjs(selectedPlan.expected_completion_date).format('DD/MM/YYYY')}</Descriptions.Item>
              {selectedPlan.actual_completion_date && (
                <Descriptions.Item label="Thực tế xong" span={2}>
                    {dayjs(selectedPlan.actual_completion_date).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
            {selectedPlan.note && (
              <>
                <Divider orientation="left" plain>Ghi chú chỉ thị</Divider>
                <div style={{ padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px', fontStyle: 'italic' }}>
                  {selectedPlan.note}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionPlanManagement;


