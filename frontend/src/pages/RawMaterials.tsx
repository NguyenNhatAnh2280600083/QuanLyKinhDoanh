import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Tag, message, Card, Typography, Row, Col, Statistic, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, ExportOutlined, DatabaseOutlined, WarningOutlined, StockOutlined } from '@ant-design/icons';
import rawMaterialService, { RawMaterial } from '../services/rawMaterialService';

const { Title, Text } = Typography;

const RawMaterials: React.FC = () => {
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isStockModalVisible, setIsStockModalVisible] = useState(false);
    const [stockAction, setStockAction] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
    const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
    const [form] = Form.useForm();
    const [stockForm] = Form.useForm();

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const data = await rawMaterialService.getAll();
            setMaterials(data);
        } catch (error) {
            message.error('Không thể tải danh sách nguyên vật liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleCreateOrUpdate = async (values: any) => {
        try {
            if (editingMaterial) {
                await rawMaterialService.update(editingMaterial.id, values);
                message.success('Cập nhật thành công');
            } else {
                await rawMaterialService.create(values);
                message.success('Thêm mới thành công');
            }
            setIsModalVisible(false);
            fetchMaterials();
        } catch (error) {
            message.error('Thao tác thất bại');
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa nguyên vật liệu này?',
            onOk: async () => {
                try {
                    await rawMaterialService.delete(id);
                    message.success('Xóa thành công');
                    fetchMaterials();
                } catch (error) {
                    message.error('Không thể xóa NVL đã có lịch sử hoặc định mức');
                }
            }
        });
    };

    const handleStockAction = async (values: any) => {
        if (!selectedMaterial) return;
        try {
            if (stockAction === 'IMPORT') {
                await rawMaterialService.importMaterial(selectedMaterial.id, values.quantity, values.note);
                message.success('Nhập kho thành công');
            } else {
                await rawMaterialService.exportMaterial(selectedMaterial.id, values.quantity, values.note);
                message.success('Xuất kho thành công');
            }
            setIsStockModalVisible(false);
            stockForm.resetFields();
            fetchMaterials();
        } catch (error: any) {
            message.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const stats = {
        total: materials.length,
        lowStock: materials.filter(m => m.stock_quantity <= m.minimum_stock && m.stock_quantity > 0).length,
        outOfStock: materials.filter(m => m.stock_quantity === 0).length,
    };

    const columns = [
        { title: 'Mã NVL', dataIndex: 'code', key: 'code', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Tên NVL', dataIndex: 'name', key: 'name' },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit' },
        { 
            title: 'Tồn kho', 
            dataIndex: 'stock_quantity', 
            key: 'stock_quantity',
            render: (val: number, record: RawMaterial) => (
                <Text type={val <= record.minimum_stock ? 'danger' : undefined} strong>
                    {val.toLocaleString()}
                </Text>
            )
        },
        { title: 'Ngưỡng tối thiểu', dataIndex: 'minimum_stock', key: 'minimum_stock' },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_: any, record: RawMaterial) => {
                if (record.stock_quantity === 0) return <Tag color="red">Hết hàng</Tag>;
                if (record.stock_quantity <= record.minimum_stock) return <Tag color="orange">Sắp hết</Tag>;
                return <Tag color="green">Bình thường</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: RawMaterial) => (
                <Space>
                    <Button 
                        icon={<ImportOutlined />} 
                        size="small" 
                        onClick={() => { setStockAction('IMPORT'); setSelectedMaterial(record); setIsStockModalVisible(true); }}
                        title="Nhập kho"
                    />
                    <Button 
                        icon={<ExportOutlined />} 
                        size="small" 
                        onClick={() => { setStockAction('EXPORT'); setSelectedMaterial(record); setIsStockModalVisible(true); }}
                        title="Xuất kho"
                    />
                    <Button 
                        icon={<EditOutlined />} 
                        size="small" 
                        onClick={() => { setEditingMaterial(record); form.setFieldsValue(record); setIsModalVisible(true); }} 
                    />
                    <Button 
                        icon={<DeleteOutlined />} 
                        size="small" 
                        danger 
                        onClick={() => handleDelete(record.id)} 
                    />
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={2}>Quản lý Nguyên vật liệu</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingMaterial(null); form.resetFields(); setIsModalVisible(true); }}>
                    Thêm NVL mới
                </Button>
            </div>

            <Row gutter={16} className="mb-8">
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Tổng nguyên vật liệu" value={stats.total} prefix={<DatabaseOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="NVL sắp hết" value={stats.lowStock} valueStyle={{ color: '#faad14' }} prefix={<WarningOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="NVL hết hàng" value={stats.outOfStock} valueStyle={{ color: '#cf1322' }} prefix={<StockOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <Table columns={columns} dataSource={materials} loading={loading} rowKey="id" />
            </Card>

            <Modal
                title={editingMaterial ? "Cập nhật Nguyên vật liệu" : "Thêm Nguyên vật liệu mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="code" label="Mã NVL" rules={[{ required: true }]}>
                                <Input placeholder="VD: NVL001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên NVL" rules={[{ required: true }]}>
                                <Input placeholder="Tên nguyên vật liệu" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="unit" label="Đơn vị tính" rules={[{ required: true }]}>
                                <Input placeholder="VD: kg, cái, lít..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="minimum_stock" label="Ngưỡng tối thiểu" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={stockAction === 'IMPORT' ? "Nhập kho nguyên vật liệu" : "Xuất kho nguyên vật liệu"}
                open={isStockModalVisible}
                onCancel={() => setIsStockModalVisible(false)}
                onOk={() => stockForm.submit()}
            >
                <div className="mb-4">
                    <Text type="secondary">NVL: </Text><Text strong>{selectedMaterial?.name}</Text>
                    <br />
                    <Text type="secondary">Tồn hiện tại: </Text><Text strong>{selectedMaterial?.stock_quantity} {selectedMaterial?.unit}</Text>
                </div>
                <Form form={stockForm} layout="vertical" onFinish={handleStockAction}>
                    <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0.01} />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} placeholder="Nhập lý do nhập/xuất..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RawMaterials;
