import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Card, Select, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/', {
        params: { search: searchText, region: regionFilter }
      });
      setCustomers(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchText, regionFilter]);

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/customers/${id}`);
      message.success('Xóa khách hàng thành công');
      fetchCustomers();
    } catch (error) {
      message.error('Xóa khách hàng thất bại');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, values);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await api.post('/customers/', values);
        message.success('Thêm khách hàng thành công');
      }
      setIsModalVisible(false);
      fetchCustomers();
    } catch (error) {
      message.error('Thao tác thất bại');
    }
  };

  const columns = [
    { title: 'Tên khách hàng', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Phân loại',
      dataIndex: 'customer_type',
      key: 'customer_type',
      render: (type: string) => (
        <Tag color={
          type === 'MT' ? 'blue' : 
          type === 'GT' ? 'green' : 
          type === 'ECOM' ? 'orange' : 
          'purple'
        }>
          {type || 'GT'}
        </Tag>
      )
    },
    { title: 'Khu vực', dataIndex: 'region', key: 'region' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý khách hàng" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
        Thêm khách hàng
      </Button>
    }>
      <Space className="mb-4">
        <Input
          placeholder="Tìm kiếm khách hàng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Select
          placeholder="Lọc theo khu vực"
          allowClear
          className="w-48"
          onChange={value => setRegionFilter(value)}
        >
          <Option value="North">Miền Bắc</Option>
          <Option value="Central">Miền Trung</Option>
          <Option value="South">Miền Nam</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên khách hàng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="customer_type" label="Phân loại kênh" rules={[{ required: true }]}>
            <Select>
              <Option value="MT">MT (Siêu thị, Chuỗi lẻ)</Option>
              <Option value="GT">GT (Đại lý, Nhà phân phối)</Option>
              <Option value="ECOM">ECOM (Thương mại điện tử)</Option>
              <Option value="EXPORT">EXPORT (Xuất khẩu)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="region" label="Khu vực">
            <Select>
              <Option value="North">Miền Bắc</Option>
              <Option value="Central">Miền Trung</Option>
              <Option value="South">Miền Nam</Option>
            </Select>
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CustomerManagement;
