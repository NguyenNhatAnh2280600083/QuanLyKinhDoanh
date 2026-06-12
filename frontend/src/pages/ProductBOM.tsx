import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, InputNumber, Select, message, Card, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CalculatorOutlined } from '@ant-design/icons';
import bomService, { BOM } from '../services/bomService';
import rawMaterialService, { RawMaterial } from '../services/rawMaterialService';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const ProductBOM: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [bomItems, setBomItems] = useState<BOM[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        try {
            const [prodRes, matRes] = await Promise.all([
                api.get('/products/'),
                rawMaterialService.getAll()
            ]);
            setProducts(prodRes.data);
            setMaterials(matRes);
        } catch (error) {
            message.error('Không thể tải dữ liệu');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchBOM = async (productId: number) => {
        setLoading(true);
        try {
            const data = await bomService.getByProduct(productId);
            setBomItems(data);
        } catch (error) {
            message.error('Không thể tải định mức sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleProductChange = (value: number) => {
        setSelectedProduct(value);
        fetchBOM(value);
    };

    const handleAddBOM = async (values: any) => {
        if (!selectedProduct) return;
        try {
            await bomService.create({
                product_id: selectedProduct,
                material_id: values.material_id,
                quantity_required: values.quantity_required
            });
            message.success('Thêm định mức thành công');
            setIsModalVisible(false);
            form.resetFields();
            fetchBOM(selectedProduct);
        } catch (error) {
            message.error('Thao tác thất bại');
        }
    };

    const handleDeleteBOM = async (id: number) => {
        try {
            await bomService.delete(id);
            message.success('Xóa thành công');
            if (selectedProduct) fetchBOM(selectedProduct);
        } catch (error) {
            message.error('Xóa thất bại');
        }
    };

    const columns = [
        { title: 'Nguyên vật liệu', dataIndex: 'material_name', key: 'material_name', render: (text: string) => <Text strong>{text}</Text> },
        { 
            title: 'Định mức (cho 1 đvsp)', 
            dataIndex: 'quantity_required', 
            key: 'quantity_required',
            render: (val: number, record: BOM) => <Text>{val} {record.material_unit}</Text>
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: BOM) => (
                <Button 
                    icon={<DeleteOutlined />} 
                    size="small" 
                    danger 
                    onClick={() => handleDeleteBOM(record.id)} 
                />
            )
        }
    ];

    return (
        <div className="p-6">
            <Title level={2}>Định mức Nguyên vật liệu (BOM)</Title>
            <Text type="secondary" className="mb-6 block">Thiết lập công thức sản xuất cho từng sản phẩm</Text>

            <Card bordered={false} className="shadow-sm mb-6">
                <div className="flex items-center gap-4">
                    <Text strong>Chọn sản phẩm:</Text>
                    <Select 
                        showSearch
                        style={{ width: 400 }} 
                        placeholder="Tìm sản phẩm..."
                        onChange={handleProductChange}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={products.map(p => ({ value: p.id, label: `${p.name} (${p.price.toLocaleString()}đ)` }))}
                    />
                    {selectedProduct && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                            Thêm định mức
                        </Button>
                    )}
                </div>
            </Card>

            {selectedProduct ? (
                <Card bordered={false} className="shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <Title level={4} style={{ margin: 0 }}>Công thức sản xuất</Title>
                        <Text type="secondary">{bomItems.length} thành phần</Text>
                    </div>
                    <Table 
                        columns={columns} 
                        dataSource={bomItems} 
                        loading={loading} 
                        rowKey="id" 
                        pagination={false}
                    />
                </Card>
            ) : (
                <Card bordered={false} className="shadow-sm flex justify-center p-12">
                    <Text type="secondary">Vui lòng chọn một sản phẩm để xem và thiết lập BOM</Text>
                </Card>
            )}

            <Modal
                title="Thêm thành phần vào định mức"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleAddBOM}>
                    <Form.Item name="material_id" label="Nguyên vật liệu" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Chọn nguyên vật liệu">
                            {materials.map(m => (
                                <Option key={m.id} value={m.id}>{m.name} ({m.unit}) - Tồn: {m.stock_quantity}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="quantity_required" label="Số lượng cần thiết (cho 1 đơn vị sản phẩm)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0.0001} step={0.1} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductBOM;
