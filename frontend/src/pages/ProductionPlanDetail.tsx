import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Col, Row, Button, Progress, Descriptions, Tag, Divider, 
  Table, message, Modal, Form, InputNumber, Space, Typography, Alert, Badge, Spin, Empty
} from 'antd';
import { 
  LeftOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  WarningOutlined, 
  DatabaseOutlined, 
  ScheduleOutlined,
  UserOutlined,
  DashboardOutlined,
  GoldOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import productionPlanService, { ProductionPlan, MaterialRequirement } from '../services/productionPlanService';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const ProductionPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [materials, setMaterials] = useState<MaterialRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const isAdminOrManager = user?.role.name === 'admin' || user?.role.name === 'manager';

  const fetchPlanDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await productionPlanService.getPlanDetail(Number(id));
      setPlan(data);
      form.setFieldsValue({ completed_quantity: data.completed_quantity });
    } catch (error) {
      message.error('Không thể tải chi tiết kế hoạch sản xuất');
      navigate('/production/weekly');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    if (!id) return;
    setMaterialsLoading(true);
    try {
      const data = await productionPlanService.getMaterialRequirements(Number(id));
      setMaterials(data.materials);
    } catch (error) {
      console.error('Không thể tính toán nhu cầu nguyên vật liệu', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanDetail();
    fetchMaterials();
  }, [id]);

  const handleUpdateSubmit = async () => {
    if (!plan) return;
    try {
      const values = await form.validateFields();
      if (values.completed_quantity > plan.planned_quantity) {
        message.error('Số lượng hoàn thành không thể lớn hơn số lượng kế hoạch!');
        return;
      }

      await productionPlanService.updateProgress(plan.id, values.completed_quantity);
      message.success('Cập nhật tiến độ sản xuất thành công');
      setIsUpdateModalVisible(false);
      fetchPlanDetail();
      fetchMaterials(); // Reload materials stock as they might have been deducted if auto-completed
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Cập nhật tiến độ thất bại');
    }
  };

  const handleComplete = () => {
    if (!plan) return;
    Modal.confirm({
      title: 'Xác nhận hoàn thành kế hoạch sản xuất',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p>Hệ thống sẽ thực hiện các công việc sau:</p>
          <ul>
            <li>Cập nhật trạng thái thành <b>HOÀN THÀNH</b>.</li>
            <li>Đặt số lượng hoàn thành thực tế bằng số lượng kế hoạch: <b>{plan.planned_quantity.toLocaleString()} chiếc</b>.</li>
            <li>Tự động tăng tồn kho thành phẩm cho sản phẩm: <b>{plan.product.name}</b>.</li>
            <li>Tự động trừ tồn kho nguyên vật liệu tương ứng theo định mức BOM.</li>
            <li>Ghi nhận lịch sử nhập xuất kho thành phẩm và nguyên vật liệu.</li>
          </ul>
        </div>
      ),
      okText: 'Xác nhận hoàn tất',
      cancelText: 'Đóng',
      okButtonProps: { style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } },
      onOk: async () => {
        try {
          await productionPlanService.completePlan(plan.id);
          message.success('Đánh dấu hoàn thành kế hoạch sản xuất thành công!');
          fetchPlanDetail();
          fetchMaterials();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Lỗi khi hoàn thành kế hoạch');
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

  const materialColumns = [
    {
      title: 'Tên Nguyên vật liệu',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: MaterialRequirement) => (
        <span className={record.enough ? "font-medium" : "font-bold text-red-600"}>
          {name}
        </span>
      )
    },
    {
      title: 'Nhu cầu cần (BOM)',
      dataIndex: 'required',
      key: 'required',
      render: (val: number) => <span className="font-semibold">{val.toLocaleString()}</span>
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'stock',
      key: 'stock',
      render: (val: number, record: MaterialRequirement) => (
        <span className={record.enough ? "text-green-600 font-semibold" : "text-red-500 font-bold"}>
          {val.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Tình trạng',
      dataIndex: 'enough',
      key: 'enough',
      render: (enough: boolean) => enough ? (
        <Badge status="success" text={<span className="text-green-600 font-semibold">Đủ NVL</span>} />
      ) : (
        <Badge status="error" text={<span className="text-red-600 font-bold">Thiếu NVL</span>} />
      )
    },
    {
      title: 'Số lượng thiếu',
      dataIndex: 'missing',
      key: 'missing',
      render: (val: number, record: MaterialRequirement) => !record.enough && val > 0 ? (
        <Tag color="red" className="font-bold">Thiếu {val.toLocaleString()}</Tag>
      ) : (
        <span className="text-gray-400">-</span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang tải thông tin kế hoạch sản xuất..." />
      </div>
    );
  }

  if (!plan) {
    return (
      <Empty description="Không tìm thấy kế hoạch sản xuất" />
    );
  }

  const anyMaterialMissing = materials.some(m => !m.enough);

  return (
    <div className="p-0">
      {/* Back button and page title */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          icon={<LeftOutlined />} 
          onClick={() => navigate('/production/weekly')}
          className="hover:text-blue-600 border-gray-200"
        >
          Quay lại danh sách
        </Button>
        <Space>
          {isAdminOrManager && plan.status !== 'COMPLETED' && plan.status !== 'CANCELLED' && (
            <>
              <Button 
                type="primary" 
                ghost
                icon={<EditOutlined />} 
                onClick={() => setIsUpdateModalVisible(true)}
              >
                Cập nhật tiến độ
              </Button>
              <Button 
                type="primary" 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                icon={<CheckCircleOutlined />} 
                onClick={handleComplete}
              >
                Hoàn thành kế hoạch
              </Button>
            </>
          )}
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Plan Details & Progress */}
        <Col xs={24} lg={14}>
          {/* Main Info Card */}
          <Card 
            title={
              <Space>
                <ScheduleOutlined className="text-blue-600" />
                <span className="font-bold text-lg">Thông tin Kế hoạch {plan.plan_code}</span>
              </Space>
            }
            extra={getStatusTag(plan.status)}
            className="shadow-sm border-gray-100 mb-6"
          >
            <Descriptions bordered column={1} size="small" labelStyle={{ width: '180px', fontWeight: 600 }}>
              <Descriptions.Item label="Sản phẩm">{plan.product.name}</Descriptions.Item>
              <Descriptions.Item label="Tuần kế hoạch">Tuần {plan.week_number} năm {plan.year}</Descriptions.Item>
              <Descriptions.Item label="Thời gian thực hiện">
                {dayjs(plan.start_date).format('DD/MM/YYYY')} - {dayjs(plan.end_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng mục tiêu">{plan.planned_quantity.toLocaleString()} chiếc</Descriptions.Item>
              <Descriptions.Item label="Số lượng đã làm">{plan.completed_quantity.toLocaleString()} chiếc</Descriptions.Item>
              <Descriptions.Item label="Người lập kế hoạch">
                <Space>
                  <UserOutlined />
                  {plan.creator?.full_name || 'Hệ thống tự động'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(plan.created_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {plan.note && (
                <Descriptions.Item label="Ghi chú / Chỉ đạo">
                  <div className="bg-yellow-50 p-2.5 rounded border border-yellow-100 text-yellow-800 text-xs italic">
                    {plan.note}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider className="my-6" />

            {/* Progress Display */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Text strong className="text-gray-700">Tiến độ sản xuất thực tế:</Text>
                <span className="font-bold text-lg text-blue-600">{plan.progress_percent}%</span>
              </div>
              <Progress 
                percent={plan.progress_percent} 
                strokeWidth={16} 
                status={plan.status === 'COMPLETED' ? 'success' : plan.status === 'CANCELLED' ? 'exception' : 'active'}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Khởi chạy: 0</span>
                <span>Hoàn tất: {plan.completed_quantity.toLocaleString()} / {plan.planned_quantity.toLocaleString()} chiếc</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Column: Material requirements checking */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <GoldOutlined className="text-blue-600" />
                <span className="font-bold text-lg">Đánh giá Nhu cầu Nguyên vật liệu (BOM)</span>
              </Space>
            }
            className="shadow-sm border-gray-100 h-full"
            bodyStyle={{ padding: 0 }}
          >
            <div className="p-4">
              {anyMaterialMissing && plan.status !== 'COMPLETED' && plan.status !== 'CANCELLED' && (
                <Alert
                  message={
                    <span className="font-bold text-red-700">Cảnh báo thiếu hụt Nguyên vật liệu</span>
                  }
                  description="Kho hiện tại không có đủ nguyên vật liệu để hoàn thành mục tiêu sản xuất của tuần này. Vui lòng liên hệ phòng thu mua để nhập thêm NVL trước khi vận hành sản xuất."
                  type="warning"
                  showIcon
                  icon={<WarningOutlined className="text-red-500" />}
                  className="mb-4 bg-red-50 border-red-100 text-red-700"
                />
              )}

              {!anyMaterialMissing && plan.status !== 'COMPLETED' && plan.status !== 'CANCELLED' && (
                <Alert
                  message="Đủ Nguyên vật liệu"
                  description="Tồn kho nguyên vật liệu hiện tại hoàn toàn đáp ứng đủ định mức sản xuất theo kế hoạch tuần. Sẵn sàng hoạt động sản xuất."
                  type="success"
                  showIcon
                  className="mb-4"
                />
              )}
            </div>

            <Table
              columns={materialColumns}
              dataSource={materials}
              loading={materialsLoading}
              rowKey="name"
              pagination={false}
              locale={{ emptyText: <Empty description="Sản phẩm này chưa được thiết lập định mức nguyên vật liệu (BOM)" /> }}
            />
          </Card>
        </Col>
      </Row>

      {/* Update Progress Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined className="text-blue-600" />
            <span className="font-bold">Cập nhật sản lượng hoàn thành thực tế</span>
          </Space>
        }
        open={isUpdateModalVisible}
        onOk={handleUpdateSubmit}
        onCancel={() => setIsUpdateModalVisible(false)}
        okText="Lưu cập nhật"
        cancelText="Đóng"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-400">Sản phẩm kế hoạch:</div>
            <div className="font-bold text-base text-gray-800">{plan.product.name}</div>
            <div className="mt-2 flex gap-4 text-sm">
              <span>Mục tiêu tuần: <Tag color="blue" className="font-semibold">{plan.planned_quantity.toLocaleString()} chiếc</Tag></span>
              <span>Đã hoàn thành: <Tag color="orange" className="font-semibold">{plan.completed_quantity.toLocaleString()} chiếc</Tag></span>
            </div>
          </div>

          <Form.Item
            name="completed_quantity"
            label="Sản lượng thực tế đã sản xuất"
            rules={[
              { required: true, message: 'Vui lòng nhập sản lượng hoàn thành' }
            ]}
          >
            <InputNumber 
              min={0} 
              max={plan.planned_quantity} 
              style={{ width: '100%' }} 
              size="large" 
              placeholder="Nhập số lượng thực tế..."
            />
          </Form.Item>

          <Text type="secondary" italic className="text-xs">
            * Hệ thống sẽ tự động cập nhật phần trăm tiến độ tương ứng. Khi sản lượng đạt mục tiêu {plan.planned_quantity.toLocaleString()} chiếc, kế hoạch sẽ tự động chuyển sang hoàn thành và cộng dồn vào tồn kho thành phẩm.
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

import { ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';

export default ProductionPlanDetail;
