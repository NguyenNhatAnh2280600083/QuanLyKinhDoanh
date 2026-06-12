import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Card, Select, InputNumber, Tag, Divider, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;
const { Title } = Typography;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const { user } = useAuthStore();

  const isManagerOrAdmin = user?.role.name === 'admin' || user?.role.name === 'manager';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/'),
        api.get('/products/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Xóa sản phẩm thành công');
      fetchData();
    } catch (error) {
      message.error('Xóa sản phẩm thất bại');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await api.post('/products/', values);
        message.success('Thêm sản phẩm thành công');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Thao tác thất bại');
    }
  };

  const handleCategoryModalOk = async () => {
    try {
      const values = await categoryForm.validateFields();
      await api.post('/products/categories', values);
      message.success('Thêm danh mục thành công');
      categoryForm.resetFields();
      fetchData(); // Refresh categories in the product form dropdown too
    } catch (error) {
      message.error('Thêm danh mục thất bại');
    }
  };

  const columns = [
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { 
      title: 'Danh mục', 
      dataIndex: ['category', 'name'], 
      key: 'category' 
    },
    { 
      title: 'Giá ($)', 
      dataIndex: 'price', 
      key: 'price',
      render: (price: number) => price.toLocaleString()
    },
    { 
      title: 'Tồn kho', 
      dataIndex: 'stock_quantity', 
      key: 'stock_quantity',
      render: (stock: number) => (
          <Tag color={stock < 10 ? 'red' : 'green'}>{stock}</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      hidden: !isManagerOrAdmin,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <Card title="Quản lý sản phẩm" extra={
      isManagerOrAdmin && (
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setIsCategoryModalVisible(true)}>
            Quản lý danh mục
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm sản phẩm
          </Button>
        </Space>
      )
    }>
      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="Danh mục" rules={[{ required: true }]}>
            <Select>
              {categories.map((cat: any) => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="Giá bán ($)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="stock_quantity" label="Số lượng tồn kho" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="low_stock_threshold" label="Ngưỡng cảnh báo tồn thấp" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Quản lý danh mục */}
      <Modal
        title="Quản lý danh mục"
        open={isCategoryModalVisible}
        onCancel={() => setIsCategoryModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="mb-6">
          <Title level={5}>Thêm danh mục mới</Title>
          <Form form={categoryForm} layout="inline" onFinish={handleCategoryModalOk}>
            <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
              <Input placeholder="Tên danh mục" />
            </Form.Item>
            <Form.Item name="description">
              <Input placeholder="Mô tả (không bắt buộc)" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Thêm</Button>
            </Form.Item>
          </Form>
        </div>
        
        <Divider>Danh sách danh mục hiện có</Divider>
        <Table 
          dataSource={categories} 
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
            { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
            { title: 'Mô tả', dataIndex: 'description', key: 'description' },
          ]}
        />
      </Modal>
    </Card>
  );
};

export default ProductManagement;
