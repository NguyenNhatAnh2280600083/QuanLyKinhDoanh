import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('password', values.password);

      const response = await api.post('/auth/login', formData);
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      const userRes = await api.get('/auth/me');
      setUser(userRes.data);

      message.success('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">HỆ THỐNG QUẢN TRỊ NỘI BỘ</h1>
          <p className="text-gray-500">Đăng nhập để tiếp tục</p>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        <div className="text-center mt-4">
          <span className="text-gray-500">Chưa có tài khoản? </span>
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </Layout>
  );
};

export default Login;
