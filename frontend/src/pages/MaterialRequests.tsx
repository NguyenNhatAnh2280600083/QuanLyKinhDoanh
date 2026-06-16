import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Typography,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import materialRequestService, {
  MaterialRequest,
  MaterialRequestStatus,
  MaterialRequestCreate,
  MaterialRequestUpdate
} from '../services/materialRequestService';
import rawMaterialService from '../services/rawMaterialService';
import { RawMaterial } from '../services/rawMaterialService';

const { Title } = Typography;
const { Option } = Select;

const MaterialRequests: React.FC = () => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<MaterialRequestStatus | undefined>(undefined);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await materialRequestService.getRequests({ status: statusFilter });
      setRequests(data.items);
    } catch (error) {
      message.error('Không thể tải danh sách yêu cầu nhập nguyên vật liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await rawMaterialService.getAll();
      setMaterials(data);
    } catch (error) {
      console.error('Failed to fetch materials', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMaterials();
  }, [statusFilter]);

  const getStatusTag = (status: MaterialRequestStatus) => {
    const statusMap: Record<MaterialRequestStatus, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: 'Chờ duyệt' },
      APPROVED: { color: 'blue', text: 'Đã duyệt' },
      REJECTED: { color: 'red', text: 'Đã từ chối' },
      COMPLETED: { color: 'green', text: 'Hoàn thành' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const requestData: MaterialRequestCreate = {
        material_id: values.material_id,
        requested_quantity: values.requested_quantity,
        current_stock: values.current_stock,
        missing_quantity: values.missing_quantity,
        reason: values.reason
      };
      await materialRequestService.createRequest(requestData);
      message.success('Tạo yêu cầu nhập nguyên vật liệu thành công');
      setIsCreateModalVisible(false);
      form.resetFields();
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tạo yêu cầu');
    }
  };

  const handleEdit = async () => {
    if (!selectedRequest) return;
    try {
      const values = await editForm.validateFields();
      const updateData: MaterialRequestUpdate = {};
      if (values.requested_quantity !== undefined) updateData.requested_quantity = values.requested_quantity;
      if (values.reason !== undefined) updateData.reason = values.reason;
      await materialRequestService.updateRequest(selectedRequest.id, updateData);
      message.success('Cập nhật yêu cầu thành công');
      setIsEditModalVisible(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể cập nhật yêu cầu');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await materialRequestService.approveRequest(id);
      message.success('Duyệt yêu cầu thành công');
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể duyệt yêu cầu');
    }
  };

  const handleReject = async (id: number) => {
    Modal.confirm({
      title: 'Từ chối yêu cầu',
      content: (
        <Form layout="vertical">
          <Form.Item label="Lý do từ chối" name="reason">
            <Input.TextArea rows={4} placeholder="Nhập lý do từ chối (nếu có)" />
          </Form.Item>
        </Form>
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async (values: any) => {
        try {
          await materialRequestService.rejectRequest(id, values.reason);
          message.success('Từ chối yêu cầu thành công');
          fetchRequests();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Không thể từ chối yêu cầu');
        }
      }
    });
  };

  const handleComplete = async (id: number) => {
    try {
      await materialRequestService.completeRequest(id);
      message.success('Đánh dấu hoàn thành thành công');
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể đánh dấu hoàn thành');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await materialRequestService.deleteRequest(id);
      message.success('Xóa yêu cầu thành công');
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể xóa yêu cầu');
    }
  };

  const openEditModal = (request: MaterialRequest) => {
    setSelectedRequest(request);
    editForm.setFieldsValue({
      requested_quantity: request.requested_quantity,
      reason: request.reason
    });
    setIsEditModalVisible(true);
  };

  const handleMaterialChange = (materialId: number) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      form.setFieldsValue({
        current_stock: material.stock_quantity
      });
    }
  };

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'request_code',
      key: 'request_code',
      render: (code: string) => <span className="font-medium">{code}</span>
    },
    {
      title: 'Nguyên vật liệu',
      dataIndex: 'material_name',
      key: 'material_name',
      render: (name: string, record: MaterialRequest) => (
        <div>
          <span className="font-medium">{name}</span>
          {record.material_unit && (
            <span className="text-sm text-gray-500 ml-2">({record.material_unit})</span>
          )}
        </div>
      )
    },
    {
      title: 'Số lượng yêu cầu',
      dataIndex: 'requested_quantity',
      key: 'requested_quantity',
      align: 'right' as const,
      render: (qty: number, record: MaterialRequest) => (
        <span>{qty.toLocaleString()} {record.material_unit}</span>
      )
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'current_stock',
      key: 'current_stock',
      align: 'right' as const,
      render: (qty: number, record: MaterialRequest) => (
        <span>{qty.toLocaleString()} {record.material_unit}</span>
      )
    },
    {
      title: 'Số lượng thiếu',
      dataIndex: 'missing_quantity',
      key: 'missing_quantity',
      align: 'right' as const,
      render: (qty: number, record: MaterialRequest) => (
        <span className={qty > 0 ? 'text-red-500 font-medium' : ''}>
          {qty.toLocaleString()} {record.material_unit}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: MaterialRequestStatus) => getStatusTag(status)
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator_full_name',
      key: 'creator_full_name'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: MaterialRequest) => (
        <Space size="middle">
          {record.status === 'PENDING' && (
            <>
              <Tooltip title="Sửa">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Tooltip title="Duyệt">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleApprove(record.id)}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  style={{ color: '#ff4d4f' }}
                  onClick={() => handleReject(record.id)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Tooltip title="Đánh dấu hoàn thành">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleComplete(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa yêu cầu này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Yêu cầu nhập nguyên vật liệu
          </Title>
        </div>
        <Space>
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="PENDING">Chờ duyệt</Option>
            <Option value="APPROVED">Đã duyệt</Option>
            <Option value="REJECTED">Đã từ chối</Option>
            <Option value="COMPLETED">Hoàn thành</Option>
          </Select>
          <Button icon={<SyncOutlined />} onClick={fetchRequests} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Tạo yêu cầu mới
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm border-gray-100" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="Tạo yêu cầu nhập nguyên vật liệu"
        open={isCreateModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText="Tạo yêu cầu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="material_id"
            label="Nguyên vật liệu"
            rules={[{ required: true, message: 'Vui lòng chọn nguyên vật liệu' }]}
          >
            <Select
              showSearch
              placeholder="Chọn nguyên vật liệu"
              optionFilterProp="children"
              onChange={handleMaterialChange}
            >
              {materials.map(material => (
                <Option key={material.id} value={material.id}>
                  {material.name} ({material.code}) - Tồn: {material.stock_quantity.toLocaleString()} {material.unit}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="current_stock"
            label="Tồn kho hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập tồn kho hiện tại' }]}
          >
            <InputNumber style={{ width: '100%' }} disabled />
          </Form.Item>

          <Form.Item
            name="missing_quantity"
            label="Số lượng thiếu"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng thiếu' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập số lượng thiếu" />
          </Form.Item>

          <Form.Item
            name="requested_quantity"
            label="Số lượng yêu cầu nhập"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng yêu cầu' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập số lượng yêu cầu nhập" />
          </Form.Item>

          <Form.Item name="reason" label="Lý do yêu cầu">
            <Input.TextArea rows={4} placeholder="Nhập lý do yêu cầu nhập nguyên vật liệu" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa yêu cầu nhập nguyên vật liệu"
        open={isEditModalVisible}
        onOk={handleEdit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedRequest(null);
        }}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="requested_quantity"
            label="Số lượng yêu cầu nhập"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng yêu cầu' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập số lượng yêu cầu nhập" />
          </Form.Item>

          <Form.Item name="reason" label="Lý do yêu cầu">
            <Input.TextArea rows={4} placeholder="Nhập lý do yêu cầu nhập nguyên vật liệu" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialRequests;
