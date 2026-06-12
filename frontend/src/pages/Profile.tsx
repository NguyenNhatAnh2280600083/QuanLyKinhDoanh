import React from 'react';
import { Card, Descriptions, Avatar, Tag, Row, Col, Typography, Space, Divider } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined, CalendarOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'red';
      case 'manager': return 'green';
      case 'sales': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Title level={2} className="mb-8">Thông tin cá nhân</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card className="shadow-sm rounded-2xl text-center pb-8">
            <div className="flex flex-col items-center">
              <Avatar 
                size={120} 
                icon={<UserOutlined />} 
                className="shadow-lg mb-4 border-4 border-blue-50"
                style={{ backgroundColor: '#1677ff' }}
              />
              <Title level={3} style={{ margin: 0 }}>{user.full_name}</Title>
              <Text type="secondary" className="mb-4">@{user.username}</Text>
              <div className="mt-2">
                <Tag color={getRoleColor(user.role.name)} className="px-4 py-1 rounded-full border-none font-bold uppercase tracking-wider">
                  {user.role.name}
                </Tag>
              </div>
            </div>
            
            <Divider />
            
            <div className="text-left px-4">
              <Space direction="vertical" size="middle" className="w-full">
                <div className="flex justify-between items-center">
                  <Text type="secondary">Trạng thái</Text>
                  <Tag color="success" className="mr-0 border-none rounded-full">Đang hoạt động</Tag>
                </div>
                <div className="flex justify-between items-center">
                  <Text type="secondary">Ngày gia nhập</Text>
                  <Text strong>{new Date(user.created_at).toLocaleDateString('vi-VN')}</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title={<span className="font-bold text-gray-700">Chi tiết tài khoản</span>} className="shadow-sm rounded-2xl h-full">
            <Descriptions bordered column={1} labelStyle={{ width: '200px', fontWeight: 600, backgroundColor: '#fafafa' }}>
              <Descriptions.Item label={<Space><IdcardOutlined className="text-blue-500" /> Mã nhân viên</Space>}>
                #{user.id.toString().padStart(4, '0')}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><UserOutlined className="text-blue-500" /> Tên đăng nhập</Space>}>
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><UserOutlined className="text-blue-500" /> Họ và tên</Space>}>
                {user.full_name}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><MailOutlined className="text-blue-500" /> Địa chỉ Email</Space>}>
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><SafetyCertificateOutlined className="text-blue-500" /> Vai trò hệ thống</Space>}>
                <span className="capitalize font-medium">{user.role.name}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<Space><CalendarOutlined className="text-blue-500" /> Thời gian tạo</Space>}>
                {new Date(user.created_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Title level={5} className="text-blue-700 mb-2">Ghi chú bảo mật</Title>
              <Text className="text-blue-600">
                Tài khoản của bạn được bảo vệ bởi hệ thống xác thực JWT. Để thay đổi mật khẩu hoặc thông tin cá nhân, vui lòng liên hệ với quản trị viên hệ thống (Admin).
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
