import React, { useEffect, useState } from 'react';
import { Table, Button, Form, InputNumber, Select, message, Card, Typography, Row, Col, Statistic, Tag } from 'antd';
import { CalculatorOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import bomService, { MaterialCalculationResponse } from '../services/bomService';
import api from '../services/api';

const { Title, Text } = Typography;

const MaterialRequirementCalculator: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MaterialCalculationResponse | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products/');
                setProducts(res.data);
            } catch (error) {
                message.error('Không thể tải danh sách sản phẩm');
            }
        };
        fetchProducts();
    }, []);

    const handleCalculate = async (values: any) => {
        setLoading(true);
        try {
            const data = await bomService.calculateRequirements(values.product_id, values.production_quantity);
            setResult(data);
        } catch (error) {
            message.error('Lỗi khi tính toán nhu cầu');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Nguyên vật liệu', dataIndex: 'material_name', key: 'material_name', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Nhu cầu cần thiết', dataIndex: 'required_quantity', key: 'required_quantity', render: (val: number) => <Text strong>{val.toLocaleString()}</Text> },
        { title: 'Tồn kho hiện tại', dataIndex: 'current_stock', key: 'current_stock', render: (val: number) => <Text>{val.toLocaleString()}</Text> },
        {
            title: 'Trạng thái',
            dataIndex: 'enough',
            key: 'enough',
            render: (enough: boolean, record: any) => (
                enough ? 
                <Tag color="green" icon={<CheckCircleOutlined />}>Đủ hàng</Tag> : 
                <Tag color="red" icon={<CloseCircleOutlined />}>Thiếu {(record.required_quantity - record.current_stock).toLocaleString()}</Tag>
            )
        }
    ];

    return (
        <div className="p-6">
            <Title level={2}>Tính toán Nhu cầu Nguyên vật liệu</Title>
            <Text type="secondary" className="mb-6 block">Kiểm tra khả năng đáp ứng NVL cho kế hoạch sản xuất dự kiến</Text>

            <Card bordered={false} className="shadow-sm mb-6">
                <Form form={form} layout="inline" onFinish={handleCalculate}>
                    <Form.Item name="product_id" label="Sản phẩm" rules={[{ required: true }]} style={{ width: 400 }}>
                        <Select showSearch placeholder="Chọn sản phẩm cần sản xuất">
                            {products.map(p => (
                                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="production_quantity" label="Số lượng dự kiến" rules={[{ required: true }]}>
                        <InputNumber min={1} placeholder="Nhập số lượng..." />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" icon={<CalculatorOutlined />} htmlType="submit" loading={loading}>
                            Tính toán
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {result && (
                <div className="animate-in fade-in duration-500">
                    <Row gutter={16} className="mb-6">
                        <Col span={12}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic 
                                    title="Sản phẩm dự kiến" 
                                    value={result.product_name} 
                                    valueStyle={{ fontSize: '18px', fontWeight: 700 }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic 
                                    title="Trạng thái đáp ứng" 
                                    value={result.status === 'ENOUGH' ? 'CÓ THỂ SẢN XUẤT' : 'KHÔNG ĐỦ NGUYÊN LIỆU'} 
                                    valueStyle={{ color: result.status === 'ENOUGH' ? '#3f8600' : '#cf1322', fontWeight: 800 }}
                                    prefix={result.status === 'ENOUGH' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card bordered={false} className="shadow-sm" title="Chi tiết nhu cầu vật tư">
                        <Table 
                            columns={columns} 
                            dataSource={result.required_materials} 
                            pagination={false}
                            rowKey="material_id"
                        />
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MaterialRequirementCalculator;
