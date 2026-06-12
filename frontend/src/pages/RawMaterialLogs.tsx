import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, message } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import rawMaterialService, { RawMaterialLog } from '../services/rawMaterialService';

const { Title, Text } = Typography;

const RawMaterialLogs: React.FC = () => {
    const [logs, setLogs] = useState<RawMaterialLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await rawMaterialService.getLogs();
            setLogs(data);
        } catch (error) {
            message.error('Không thể tải lịch sử nguyên vật liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text: string) => new Date(text).toLocaleString('vi-VN'),
            sorter: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        },
        {
            title: 'Nguyên vật liệu',
            dataIndex: 'material_name',
            key: 'material_name',
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'IMPORT' ? 'green' : 'blue'}>
                    {type === 'IMPORT' ? 'NHẬP KHO' : 'XUẤT KHO'}
                </Tag>
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (val: number, record: any) => (
                <Text strong type={record.type === 'IMPORT' ? 'success' : 'danger'}>
                    {record.type === 'IMPORT' ? '+' : '-'}{val.toLocaleString()}
                </Text>
            )
        },
        {
            title: 'Người thực hiện',
            dataIndex: 'user_full_name',
            key: 'user_full_name',
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            key: 'note',
            render: (text: string) => <Text type="secondary">{text || '-'}</Text>
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={2}><HistoryOutlined /> Lịch sử Nguyên vật liệu</Title>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Table 
                    columns={columns} 
                    dataSource={logs} 
                    loading={loading} 
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                />
            </Card>
        </div>
    );
};

export default RawMaterialLogs;
