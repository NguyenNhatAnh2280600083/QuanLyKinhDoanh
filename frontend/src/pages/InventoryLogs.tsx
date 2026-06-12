import React, { useState, useEffect } from 'react';
import { Table, Tag, Select, DatePicker, Card, Typography, Space, message, Button } from 'antd';
import { ArrowLeftOutlined, FilterOutlined } from '@ant-design/icons';
import inventoryService, { InventoryLog } from '../services/inventoryService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const InventoryLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InventoryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  
  const navigate = useNavigate();

  const fetchLogs = async (page = 1, pageSize = 10, type?: string) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await inventoryService.getInventoryLogs({ skip, limit: pageSize, type });
      setData(response.data.items);
      setTotal(response.data.total);
    } catch (error: any) {
      message.error('Không thể tải lịch sử kho: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.current, pagination.pageSize, typeFilter);
  }, [pagination.current, pagination.pageSize, typeFilter]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value === 'ALL' ? undefined : value);
    setPagination({ ...pagination, current: 1 });
  };

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'OUT':
        return <Tag color="volcano">XUẤT KHO</Tag>;
      case 'ADJUST':
        return <Tag color="blue">ĐIỀU CHỈNH</Tag>;
      case 'RETURN':
        return <Tag color="green">HOÀN KHO</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
      width: 180,
    },
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (text: string, record: InventoryLog) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID SP: {record.product_id}</Text>
        </Space>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type),
      width: 120,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty: number) => (
        <Text strong style={{ color: qty < 0 ? '#cf1322' : '#3f8600' }}>
          {qty > 0 ? `+${qty}` : qty}
        </Text>
      ),
      width: 100,
    },
    {
      title: 'Tồn cuối',
      dataIndex: 'ending_balance',
      key: 'ending_balance',
      render: (balance: number) => (
        <Text strong style={{ color: balance < 0 ? '#cf1322' : '#1890ff' }}>
          {balance}
        </Text>
      ),
      width: 100,
    },
    {
      title: 'Người thực hiện',
      dataIndex: ['user', 'full_name'],
      key: 'user',
      render: (name: string, record: InventoryLog) => (
        <span>{name} ({record.user.username})</span>
      )
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id?: number) => id ? `#${id}` : '-',
      width: 100,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex items-center mb-6">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/inventory')}
            className="mr-4"
          />
          <Title level={3} style={{ margin: 0 }}>Lịch sử kho</Title>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Space>
            <FilterOutlined />
            <Text>Loại giao dịch:</Text>
            <Select defaultValue="ALL" style={{ width: 150 }} onChange={handleTypeChange}>
              <Option value="ALL">Tất cả</Option>
              <Option value="OUT">Xuất kho (OUT)</Option>
              <Option value="ADJUST">Điều chỉnh (ADJUST)</Option>
              <Option value="RETURN">Hoàn kho (RETURN)</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} bản ghi`,
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default InventoryLogs;
