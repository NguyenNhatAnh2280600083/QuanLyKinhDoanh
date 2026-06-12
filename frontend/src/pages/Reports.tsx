import React, { useState } from 'react';
import { Card, Button, Space, DatePicker, Table, message, Typography, Row, Col, Statistic } from 'antd';
import { FileExcelOutlined, SearchOutlined, BarChartOutlined } from '@ant-design/icons';
import api from '../services/api';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // In a real app, we would pass dateRange to the API
      const res = await api.get('/orders/'); // Using orders as base for report
      setReportData(res.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/stats/export/excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Thong ke doanh thu.xlsx');
      document.body.appendChild(link);
      link.click();
      message.success('Đã tải xuống báo cáo Excel');
    } catch (error) {
      message.error('Xuất báo cáo thất bại');
    }
  };

  const columns = [
    { title: 'Mã đơn', dataIndex: 'id', key: 'id' },
    { title: 'Khách hàng', dataIndex: ['customer', 'name'], key: 'customer' },
    { title: 'Nhân viên', dataIndex: ['user', 'full_name'], key: 'user' },
    { 
        title: 'Doanh thu ($)', 
        dataIndex: 'total_amount', 
        key: 'total_amount',
        render: (val: number) => val.toLocaleString()
    },
    { 
        title: 'Trạng thái', 
        dataIndex: 'status', 
        key: 'status',
        render: (status: string) => <Tag color={status === 'completed' ? 'green' : 'blue'}>{status.toUpperCase()}</Tag>
    },
    { title: 'Ngày', dataIndex: 'created_at', key: 'created_at', render: (val: string) => new Date(val).toLocaleDateString() },
  ];

  const totalRevenue = reportData.reduce((acc, curr: any) => acc + curr.total_amount, 0);

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Card title="Báo cáo doanh thu bán hàng">
        <Space direction="vertical" className="w-full">
          <Row gutter={16} align="middle">
            <Col>
              <RangePicker onChange={(dates) => setDateRange(dates)} />
            </Col>
            <Col>
              <Button type="primary" icon={<SearchOutlined />} onClick={fetchReport} loading={loading}>
                Xem báo cáo
              </Button>
            </Col>
            <Col>
              <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                Xuất Excel
              </Button>
            </Col>
          </Row>

          {reportData.length > 0 && (
            <>
              <Row gutter={16} className="mt-8">
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="Tổng doanh thu" value={totalRevenue} prefix="$" precision={2} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="Tổng số đơn" value={reportData.length} />
                  </Card>
                </Col>
              </Row>

              <Table
                className="mt-4"
                columns={columns}
                dataSource={reportData}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
};

const Tag = ({ color, children }: any) => (
    <span style={{ 
        backgroundColor: color === 'green' ? '#f6ffed' : '#e6f7ff',
        color: color === 'green' ? '#52c41a' : '#1890ff',
        border: `1px solid ${color === 'green' ? '#b7eb8f' : '#91d5ff'}`,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px'
    }}>
        {children}
    </span>
);

export default Reports;
