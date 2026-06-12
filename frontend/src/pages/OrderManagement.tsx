import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Card, Button, Modal, Form, Select, InputNumber, 
  message, Space, Tag, Descriptions, Divider, Row, Col, Input, Typography, Breadcrumb 
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, 
  PrinterOutlined, SaveOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined 
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    stock_quantity: number;
  };
}

interface Order {
  id: number;
  customer_id: number;
  status: string;
  total_amount: number;
  created_at: string;
  customer: {
    name: string;
    phone: string;
  };
  user: {
    full_name: string;
  };
  items: OrderItem[];
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form] = Form.useForm();
  
  // Watch form values for real-time calculation
  const formItems = Form.useWatch('items', form);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes, userRes] = await Promise.all([
        api.get('/orders/'),
        api.get('/customers/'),
        api.get('/products/'),
        api.get('/auth/me')
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
      setCurrentUser(userRes.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = () => {
    form.resetFields();
    form.setFieldsValue({
        date: dayjs(),
        items: [{}],
        currency: 'VND',
        warehouse: 'Kho tổng',
        responsible: currentUser?.full_name || 'Đang tải...'
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        customer_id: values.customer_id,
        items: values.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };
      
      await api.post('/orders/', payload);
      message.success('Tạo đơn hàng thành công');
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin đơn hàng');
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status?status=${status}`);
      message.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Cập nhật thất bại');
    }
  };

  const subTotal = useMemo(() => {
    if (!formItems) return 0;
    return formItems.reduce((acc: number, curr: any) => {
        const product = products.find((p: any) => p.id === curr?.product_id) as any;
        const price = product?.price || 0;
        return acc + (price * (curr?.quantity || 0));
    }, 0);
  }, [formItems, products]);

  const columns = [
    { 
      title: 'Mã ĐH', 
      dataIndex: 'id', 
      key: 'id', 
      render: (id: number) => <span className="font-bold text-indigo-600 uppercase">ORD-{id}</span> 
    },
    { 
      title: 'Khách hàng', 
      dataIndex: ['customer', 'name'], 
      key: 'customer',
      render: (text: string) => <span className="font-bold text-gray-700">{text}</span>
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'total_amount', 
      key: 'total_amount',
      align: 'right' as const,
      render: (amount: number) => <span className="font-black text-blue-600">${amount.toLocaleString()}</span>
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'completed') color = 'green';
        if (status === 'cancelled') color = 'red';
        if (status === 'approved') color = 'cyan';
        return <Tag color={color} className="rounded-full border-none px-3 font-black text-[10px] uppercase">{status}</Tag>;
      }
    },
    { 
      title: 'Ngày tạo', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      render: (date: string) => <Text type="secondary" className="font-medium text-xs">{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text> 
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Order) => (
        <Space size="small">
          <Button 
            type="text"
            icon={<EyeOutlined />} 
            onClick={() => { setSelectedOrder(record); setIsDetailVisible(true); }}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
          >
            Chi tiết
          </Button>
          {record.status === 'pending' && (
              <Button type="primary" ghost icon={<CheckOutlined />} onClick={() => handleUpdateStatus(record.id, 'approved')} className="rounded-lg border-indigo-200 text-indigo-600">Duyệt</Button>
          )}
          {record.status === 'ready_to_ship' && (
              <Button type="primary" icon={<CheckOutlined />} className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-lg" onClick={() => handleUpdateStatus(record.id, 'completed')}>Hoàn tất</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-[2.5rem] p-10 mb-8 shadow-2xl shadow-indigo-200/50">
        <div className="relative z-10">
          <Breadcrumb 
            items={[
              { title: <span className="text-white/50 hover:text-white transition-colors cursor-pointer font-medium text-xs uppercase tracking-widest">Hệ thống</span> },
              { title: <span className="text-white font-bold text-xs uppercase tracking-widest">Quản lý đơn hàng</span> },
            ]} 
          />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
                  <ShoppingCartOutlined className="text-indigo-400 text-xl" />
                </div>
                <Text className="text-indigo-400 font-black tracking-[0.3em] text-[10px] uppercase">Sales Operations</Text>
              </div>
              <Title level={1} style={{ color: 'white', margin: 0, fontWeight: 900, letterSpacing: '-0.025em' }}>
                Đơn Hàng Kinh Doanh
              </Title>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                onClick={handleCreateOrder}
                className="bg-indigo-500 hover:bg-indigo-400 border-none rounded-2xl px-8 h-14 font-black shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center"
              >
                TẠO ĐƠN HÀNG MỚI
              </Button>
            </div>
          </div>
        </div>
        
        {/* Modern decorative elements */}
        <div className="absolute top-[-30%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      <Card 
        bordered={false} 
        title={
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
            <span className="font-black text-gray-800 tracking-tight text-lg uppercase">Danh Sách Đơn Hàng Hệ Thống</span>
          </div>
        } 
        className="shadow-2xl shadow-gray-200/40 rounded-[2.5rem] mb-12 overflow-hidden bg-white border-none"
      >
        <Table 
          columns={columns} 
          dataSource={orders} 
          loading={loading} 
          rowKey="id" 
          pagination={{ pageSize: 10, showSizeChanger: true, className: "px-6 py-4" }}
          className="modern-table"
        />
      </Card>

      {/* Modal Bán hàng chuyên nghiệp */}
      <Modal
        title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '95%' }}>
                <span><PlusOutlined /> Tạo đơn hàng mới</span>
                <Space>
                    <Button size="small">Tùy chọn</Button>
                    <Button size="small">Trợ giúp</Button>
                </Space>
            </div>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={1100}
        style={{ top: 20 }}
        footer={[
            <Button key="back" icon={<ReloadOutlined />} onClick={() => form.resetFields()}>Nhập lại</Button>,
            <Button key="print" icon={<PrinterOutlined />}>Lưu & In (F7)</Button>,
            <Button key="submit" type="primary" icon={<SaveOutlined />} onClick={handleModalOk}>Lưu (F8)</Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="order-form">
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e8e8e8' }}>
            <Row gutter={24}>
              <Col span={12}>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item name="date" label="Ngày">
                      <Input value={dayjs().format('DD/MM/YYYY')} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item name="responsible" label="Người phụ trách">
                      <Input prefix={<SearchOutlined />} placeholder="Chọn nhân viên" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="currency" label="Đơn vị tiền tệ">
                  <Select><Option value="VND">Nội tệ (VND)</Option><Option value="USD">Ngoại tệ (USD)</Option></Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}>
                  <Select showSearch placeholder="Tìm theo tên hoặc số điện thoại" optionFilterProp="children">
                    {customers.map((c: any) => (
                      <Option key={c.id} value={c.id}>{c.name} - {c.phone}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="warehouse" label="Kho xuất HH/NVL">
                  <Input prefix={<SearchOutlined />} placeholder="Kho tổng" />
                </Form.Item>
              </Col>
            </Row>
          </div>
          
          <Divider orientation="left" plain>Danh sách mặt hàng</Divider>
          
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: 24 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: '10px', textAlign: 'left', width: '50px' }}>#</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Tên mặt hàng</th>
                      <th style={{ padding: '10px', textAlign: 'left', width: '120px' }}>Số lượng</th>
                      <th style={{ padding: '10px', textAlign: 'left', width: '150px' }}>Đơn giá</th>
                      <th style={{ padding: '10px', textAlign: 'left', width: '150px' }}>Thành tiền</th>
                      <th style={{ padding: '10px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, name, ...restField }, index) => {
                      const currentItem = formItems?.[index];
                      const product = products.find((p: any) => p.id === currentItem?.product_id) as any;
                      const lineTotal = (product?.price || 0) * (currentItem?.quantity || 0);
                      
                      return (
                        <tr key={key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '5px 10px' }}>{index + 1}</td>
                          <td style={{ padding: '5px 10px' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'product_id']}
                              rules={[{ required: true, message: 'Chọn SP' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select 
                                placeholder="Chọn sản phẩm" 
                                showSearch 
                                optionFilterProp="children"
                                style={{ width: '100%' }}
                              >
                                {products.map((p: any) => (
                                  <Option key={p.id} value={p.id}>
                                      {p.name} (Tồn: {p.stock_quantity})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </td>
                          <td style={{ padding: '5px 10px' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'quantity']}
                              rules={[{ required: true, message: 'SL' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                          </td>
                          <td style={{ padding: '5px 10px' }}>
                             <Input value={product ? `$${product.price.toLocaleString()}` : '-'} disabled />
                          </td>
                          <td style={{ padding: '5px 10px' }}>
                             <Input value={`$${lineTotal.toLocaleString()}`} disabled style={{ fontWeight: 'bold', color: '#000' }} />
                          </td>
                          <td style={{ padding: '5px 10px' }}>
                            <CloseOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>
                  Thêm mặt hàng 
                </Button>
              </div>
            )}
          </Form.List>

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
            <div style={{ width: '300px' }}>
                <Row gutter={16} style={{ marginBottom: 10 }}>
                    <Col span={12}><Text strong>Tổng tiền hàng:</Text></Col>
                    <Col span={12} style={{ textAlign: 'right' }}><Text strong style={{fontSize: '16px'}}>${subTotal.toLocaleString()}</Text></Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: 10 }}>
                    <Col span={12}><Text>Tiền thuế (10%):</Text></Col>
                    <Col span={12} style={{ textAlign: 'right' }}><Text>${(subTotal * 0.1).toLocaleString()}</Text></Col>
                </Row>
                <Divider style={{ margin: '10px 0' }} />
                <Row gutter={16}>
                    <Col span={12}><Text strong style={{fontSize: '18px', color: '#d32f2f'}}>TỔNG CỘNG:</Text></Col>
                    <Col span={12} style={{ textAlign: 'right' }}><Text strong style={{fontSize: '20px', color: '#d32f2f'}}>${(subTotal * 1.1).toLocaleString()}</Text></Col>
                </Row>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Modal chi tiết đơn hàng (giữ nguyên) */}
      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?.id}`}
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setIsDetailVisible(false)}>Đóng</Button>]}
        width={800}
      >
        {selectedOrder && (
            <>
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Khách hàng">{selectedOrder.customer.name}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{selectedOrder.customer.phone}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={selectedOrder.status === 'completed' ? 'green' : 'gold'}>
                            {selectedOrder.status.toUpperCase()}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                    <Descriptions.Item label="Nhân viên">{selectedOrder.user.full_name}</Descriptions.Item>
                    <Descriptions.Item label="Tổng cộng">
                        <span style={{fontSize: '18px', fontWeight: 'bold', color: '#d32f2f'}}>${selectedOrder.total_amount.toLocaleString()}</span>
                    </Descriptions.Item>
                </Descriptions>
                <Divider>Sản phẩm đã chọn</Divider>
                <Table
                    dataSource={selectedOrder.items}
                    columns={[
                        { title: 'Sản phẩm', dataIndex: ['product', 'name'], key: 'name' },
                        { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                        { title: 'Đơn giá', dataIndex: 'unit_price', key: 'unit_price', render: (val) => `$${val}` },
                        { title: 'Thành tiền', key: 'total', render: (_, rec: any) => `$${(rec.quantity * rec.unit_price).toLocaleString()}` },
                        { 
                          title: 'Kiểm tra kho', 
                          key: 'stock_check',
                          render: (_, rec: any) => {
                            const isAvailable = rec.product.stock_quantity >= rec.quantity;
                            return (
                              <Space direction="vertical" size={0}>
                                {selectedOrder.status === 'pending' ? (
                                    <Tag color={isAvailable ? 'success' : 'warning'}>
                                      {isAvailable ? 'Đủ hàng' : 'Thiếu hàng'}
                                    </Tag>
                                ) : (
                                    <Tag color="blue">Đã xử lý</Tag>
                                )}
                                <span style={{fontSize: '10px', color: '#999'}}>Tồn: {rec.product.stock_quantity}</span>
                              </Space>
                            );
                          }
                        },
                    ]}
                    pagination={false}
                    rowKey="id"
                    size="small"
                />
            </>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;

