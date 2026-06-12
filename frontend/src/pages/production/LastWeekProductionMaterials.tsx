import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, message, Tag, Empty } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import weeklyProductionService, { LastWeekProductionProduct, BOMRequirement } from '../../services/weeklyProductionService';

const { Title, Text } = Typography;

const statusTag = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <Tag icon={<CheckCircleOutlined />} color="green">Hoàn thành</Tag>;
    case 'IN_PROGRESS':
      return <Tag icon={<WarningOutlined />} color="orange">Đang sản xuất</Tag>;
    case 'PLANNED':
      return <Tag icon={<ExclamationCircleOutlined />} color="blue">Chờ sản xuất</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const materialColumns = [
  {
    title: 'Nguyên vật liệu',
    dataIndex: 'material_name',
    key: 'material_name',
    render: (value: string) => <Text strong>{value}</Text>
  },
  {
    title: 'Đơn vị',
    dataIndex: 'material_unit',
    key: 'material_unit',
    width: 120,
  },
  {
    title: 'Số lượng cần',
    dataIndex: 'required_quantity',
    key: 'required_quantity',
    align: 'right' as const,
    render: (value: number) => value.toLocaleString()
  },
  {
    title: 'Tồn kho hiện tại',
    dataIndex: 'current_stock',
    key: 'current_stock',
    align: 'right' as const,
    render: (value: number) => value.toLocaleString()
  },
  {
    title: 'Thiếu',
    dataIndex: 'missing_quantity',
    key: 'missing_quantity',
    align: 'right' as const,
    render: (value: number) => value > 0 ? value.toLocaleString() : '0'
  },
  {
    title: 'Trạng thái',
    dataIndex: 'enough',
    key: 'enough',
    width: 140,
    render: (enough: boolean) => enough ? <Tag color="green">Đủ</Tag> : <Tag color="red">Không đủ</Tag>
  }
];

const columns = [
  {
    title: 'Sản phẩm',
    dataIndex: 'product_name',
    key: 'product_name',
    render: (value: string) => <Text strong>{value}</Text>
  },
  {
    title: 'Số lượng kế hoạch',
    dataIndex: 'planned_quantity',
    key: 'planned_quantity',
    align: 'right' as const,
    render: (value: number) => value.toLocaleString()
  },
  {
    title: 'Số lượng hoàn thành',
    dataIndex: 'completed_quantity',
    key: 'completed_quantity',
    align: 'right' as const,
    render: (value: number) => value.toLocaleString()
  },
  {
    title: 'Tiến độ',
    dataIndex: 'progress_percent',
    key: 'progress_percent',
    align: 'right' as const,
    render: (value: number) => <Text>{value.toFixed(1)}%</Text>
  },
  {
    title: 'Trạng thái kế hoạch',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => statusTag(status)
  }
];

const LastWeekProductionMaterials: React.FC = () => {
  const [data, setData] = useState<LastWeekProductionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekLabel, setWeekLabel] = useState('Tuần trước');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const result = await weeklyProductionService.getLastWeekProductMaterials();
      setData(result || []);
      if (result && result.length > 0) {
        setWeekLabel(`Tuần ${result[0].week_number} / ${result[0].year}`);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu sản phẩm và nguyên vật liệu tuần trước');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Title level={4} className="mb-0">Sản phẩm tuần trước và nguyên vật liệu</Title>
            <Text type="secondary">Dữ liệu sản phẩm sản xuất của tuần trước để tham chiếu kế hoạch sản xuất tiếp theo.</Text>
          </div>
          <div>
            <Tag color="blue" style={{ fontSize: 14 }}>{weekLabel}</Tag>
          </div>
        </div>
      </Card>

      <Card loading={loading}>
        {data.length === 0 ? (
          <Empty description="Không có dữ liệu tuần trước" />
        ) : (
          <Table
            dataSource={data.map((item) => ({ ...item, key: item.plan_id }))}
            columns={columns}
            expandable={{
              expandedRowRender: (record: LastWeekProductionProduct) => (
                <Table
                  dataSource={record.bom_materials.map((item, index) => ({ ...item, key: index }))}
                  columns={materialColumns}
                  pagination={false}
                />
              ),
              rowExpandable: (record) => record.bom_materials && record.bom_materials.length > 0,
              expandRowByClick: true,
              expandIconColumnIndex: 0,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default LastWeekProductionMaterials;
