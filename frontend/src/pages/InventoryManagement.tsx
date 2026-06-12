import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tag, Input, Space, Button, Modal, Form, InputNumber, message, Typography, Row, Col, Divider, Select, Statistic } from 'antd';
import { SearchOutlined, EditOutlined, HistoryOutlined, AlertOutlined, CheckCircleOutlined, SwapOutlined } from '@ant-design/icons';
import inventoryService from '../services/inventoryService';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Product {
  id: number;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  category: { name: string };
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const user = useAuthStore((s) => s.user);
  const permissionSet = new Set(user?.permissions || []);
  const canManageWarehouse = user?.role?.name === 'admin' || permissionSet.has('WAREHOUSE_MANAGEMENT');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getInventory({ skip: 0, limit: 1000 });
      setInventory(res.data.items);
    } catch (error) {
      message.error('Không thể tải dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjust = (record: Product) => {
    if (!canManageWarehouse) return;
    setSelectedProduct(record);
    form.setFieldsValue({
      current_system_qty: record.stock_quantity,
      actual_qty: record.stock_quantity,
      reason: 'Kiểm kê định kỳ'
    });
    setIsAdjustModalVisible(true);
  };

  const onAdjustSubmit = async () => {
    try {
      if (!canManageWarehouse) {
        message.error('Bạn không có quyền điều chỉnh kho');
        return;
      }
      const values = await form.validateFields();
      const diff = values.actual_qty - (selectedProduct?.stock_quantity || 0);
      
      // Use the inventory adjustment endpoint
      await inventoryService.adjustInventory(selectedProduct?.id as number, {
        quantity: values.actual_qty, // API expects the final quantity
        note: `[Điều chỉnh kiểm kê] ${values.reason}. Chênh lệch: ${diff > 0 ? '+' : ''}${diff}`
      });

      message.success('Cập nhật tồn kho thành công');
      setIsAdjustModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Điều chỉnh thất bại');
    }
  };

  const filteredData = useMemo(() => {
    return inventory.filter(p =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.category.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [inventory, searchText]);

  const stats = useMemo(() => {
    return {
      totalItems: inventory.length,
      lowStock: inventory.filter(p => p.stock_quantity <= p.low_stock_threshold).length,
      outOfStock: inventory.filter(p => p.stock_quantity <= 0).length,
      totalValue: inventory.reduce((acc, curr) => acc + (curr.stock_quantity * curr.price), 0)
    };
  }, [inventory]);

  const columns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Danh mục', dataIndex: ['category', 'name'], key: 'category' },
    {
        title: 'Tồn kho hiện tại',
        dataIndex: 'stock_quantity',
        key: 'stock',
        render: (qty: number, record: Product) => {
            const isLow = qty <= record.low_stock_threshold;
            const isOut = qty <= 0;
            return (
                <Space>
                    <Text strong style={{ fontSize: '16px', color: isOut ? '#f5222d' : (isLow ? '#fa8c16' : '#52c41a') }}>
                        {qty.toLocaleString()}
                    </Text>
                    {isOut ? <Tag color="error">HẾT HÀNG</Tag> : (isLow ? <Tag color="warning">SẮP HẾT</Tag> : <Tag color="success">AN TOÀN</Tag>)}
                </Space>
            );
        }
    },
    {
        title: 'Giá trị tồn',
        key: 'value',
        render: (_: any, record: Product) => `$${(record.stock_quantity * record.price).toLocaleString()}`
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Product) => (
        <Button icon={<SwapOutlined />} onClick={() => handleAdjust(record)} disabled={!canManageWarehouse}>
          Điều chỉnh / Kiểm kê
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '0px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Tổng mặt hàng" value={stats.totalItems} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Hết hàng" value={stats.outOfStock} valueStyle={{ color: '#cf1322' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Sắp hết hàng" value={stats.lowStock} valueStyle={{ color: '#d46b08' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Tổng giá trị kho" value={stats.totalValue} precision={0} prefix="$" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Quản lý Tồn kho & Kiểm kê</span>
                <Space>
                    <Input 
                        placeholder="Tìm sản phẩm..." 
                        prefix={<SearchOutlined />} 
                        style={{ width: 300 }} 
                        onChange={e => setSearchText(e.target.value)}
                    />
                    <Button
                        type="primary"
                        icon={<HistoryOutlined />}
                        onClick={() => navigate('/inventory-logs')}
                        disabled={!canManageWarehouse}
                    >
                        Xem Nhật ký Kho
                    </Button>
                </Space>
            </div>
        }
        bordered={false}
        className="shadow-sm"
      >
        <Table columns={columns} dataSource={filteredData} loading={loading} rowKey="id" />
      </Card>

      <Modal
        title={<span><SwapOutlined /> Điều chỉnh / Kiểm kê sản phẩm</span>}
        open={isAdjustModalVisible}
        onOk={onAdjustSubmit}
        onCancel={() => setIsAdjustModalVisible(false)}
        okText="Xác nhận điều chỉnh"
        width={500}
      >
        <Form form={form} layout="vertical">
          <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '4px', marginBottom: '20px', border: '1px solid #91d5ff' }}>
            <Text strong>{selectedProduct?.name}</Text>
            <br />
            <Text type="secondary">Danh mục: {selectedProduct?.category.name}</Text>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số lượng trên sổ sách">
                <InputNumber value={selectedProduct?.stock_quantity} disabled style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="actual_qty" 
                label="Số lượng kiểm thực tế" 
                rules={[{ required: true, message: 'Nhập số lượng thực tế' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} autoFocus />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="reason" 
            label="Lý do điều chỉnh" 
            rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
          >
            <Select>
              <Option value="Kiểm kê định kỳ">Kiểm kê định kỳ</Option>
              <Option value="Hàng hỏng/Hết hạn">Hàng hỏng / Hết hạn</Option>
              <Option value="Sai sót nhập liệu">Sai sót nhập liệu</Option>
              <Option value="Xuất mẫu/Tặng">Xuất mẫu / Tặng</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>
          
          <Text type="secondary" italic style={{ fontSize: '12px' }}>
            * Lưu ý: Mọi thay đổi sẽ được ghi lại trong Nhật ký tồn kho để phục vụ đối soát sau này.
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
