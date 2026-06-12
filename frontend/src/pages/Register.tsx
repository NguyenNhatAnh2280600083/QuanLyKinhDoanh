import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Layout, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SolutionOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    try {
      const email = await form.validateFields(['email']);
      setSendingOtp(true);
      await api.post(`/auth/send-otp?email=${email.email}`);
      message.success('Mã OTP đã được gửi! Vui lòng kiểm tra console log của backend.');
      startCountdown();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể gửi OTP. Vui lòng kiểm tra email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const registerData = {
        username: values.username,
        password: values.password,
        email: values.email,
        full_name: values.full_name,
        role_id: 3
      };

      await api.post(`/auth/register?otp=${values.otp}`, registerData);
      message.success('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-none p-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <SolutionOutlined className="text-white text-2xl" />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Đăng ký tài khoản</Title>
          <Text type="secondary">Tham gia hệ thống quản lý Lixco Sales</Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          size="large"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="full_name"
            label={<span className="text-gray-500 font-medium">Họ và tên</span>}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nguyễn Văn A" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="username"
            label={<span className="text-gray-500 font-medium">Tên đăng nhập</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="username123" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="text-gray-500 font-medium">Email</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="example@lixco.com" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="otp"
            label={<span className="text-gray-500 font-medium">Mã xác thực OTP</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
          >
            <Space.Compact className="w-full">
              <Input 
                prefix={<SafetyOutlined className="text-gray-400" />} 
                placeholder="6 chữ số" 
                className="rounded-l-lg"
              />
              <Button 
                type="primary" 
                onClick={handleSendOtp} 
                disabled={countdown > 0} 
                loading={sendingOtp}
                className="rounded-r-lg min-w-[120px]"
              >
                {countdown > 0 ? `${countdown}s` : 'Gửi mã'}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-gray-500 font-medium">Mật khẩu</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="••••••••" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label={<span className="text-gray-500 font-medium">Xác nhận mật khẩu</span>}
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="••••••••" className="rounded-lg" />
          </Form.Item>

          <Form.Item className="mt-8">
            <Button type="primary" htmlType="submit" className="w-full h-12 rounded-lg font-bold text-base shadow-lg shadow-blue-100" loading={loading}>
              Tạo tài khoản
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <Text type="secondary">Đã có tài khoản? </Text>
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        </Form>
      </Card>
    </Layout>
  );
};

export default Register;
