import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { EditOutlined, LockOutlined, PlusOutlined, SafetyOutlined, UnlockOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { rbacService, AdminUser, Role } from '../services/rbacService';

const roleColor = (roleName: string) => {
  const role = roleName.toLowerCase();
  if (role === 'admin') return 'red';
  if (role === 'manager') return 'blue';
  if (role === 'sales') return 'green';
  if (role === 'warehouse') return 'orange';
  return 'default';
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm] = Form.useForm();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState<AdminUser | null>(null);
  const [roleForm] = Form.useForm();

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionTargetUser, setPermissionTargetUser] = useState<AdminUser | null>(null);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ label: `${r.name.toUpperCase()}${r.description ? ` - ${r.description}` : ''}`, value: r.id })),
    [roles]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([rbacService.listUsers(), rbacService.listRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      email: user.email,
      full_name: user.full_name,
      password: '',
    });
    setIsUserModalOpen(true);
  };

  const submitUserModal = async () => {
    try {
      const values = await userForm.validateFields();
      if (editingUser) {
        const payload: any = { email: values.email, full_name: values.full_name };
        if (values.password) payload.password = values.password;
        await rbacService.updateUser(editingUser.id, payload);
        message.success('Cập nhật user thành công');
      } else {
        await rbacService.createUser(values);
        message.success('Tạo user thành công');
      }
      setIsUserModalOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const openRoleModal = (user: AdminUser) => {
    setRoleTargetUser(user);
    roleForm.setFieldsValue({ role_id: user.role_id });
    setIsRoleModalOpen(true);
  };

  const submitRoleModal = async () => {
    try {
      const values = await roleForm.validateFields();
      if (!roleTargetUser) return;
      await rbacService.changeUserRole(roleTargetUser.id, values.role_id);
      message.success('Đổi role thành công');
      setIsRoleModalOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const lockUnlock = async (user: AdminUser) => {
    try {
      if (user.is_active) {
        await rbacService.lockUser(user.id);
        message.success('Đã khóa user');
      } else {
        await rbacService.unlockUser(user.id);
        message.success('Đã mở khóa user');
      }
      await fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const columns: any[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Tên', dataIndex: 'full_name', key: 'full_name', render: (_: any, r: AdminUser) => r.full_name || r.username },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (roleName: string) => <Tag color={roleColor(roleName)}>{roleName.toUpperCase()}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive: number) =>
        isActive ? <Tag color="green">ACTIVE</Tag> : <Tag color="red">LOCKED</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 240,
      render: (_: any, record: AdminUser) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditUser(record)}>
            Sửa
          </Button>
          <Button icon={<UserSwitchOutlined />} onClick={() => openRoleModal(record)}>
            Gán role
          </Button>
          <Button
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
            danger={!!record.is_active}
            onClick={() => lockUnlock(record)}
            disabled={record.username === 'admin'}
          >
            {record.is_active ? 'Khóa' : 'Mở'}
          </Button>
          <Button
            icon={<SafetyOutlined />}
            onClick={() => {
              setPermissionTargetUser(record);
              setIsPermissionModalOpen(true);
            }}
          >
            Quyền
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý người dùng"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateUser}>
          Tạo user
        </Button>
      }
    >
      <Table columns={columns} dataSource={users} loading={loading} rowKey="id" />

      <Modal
        title={editingUser ? 'Sửa user' : 'Tạo user'}
        open={isUserModalOpen}
        onOk={submitUserModal}
        onCancel={() => setIsUserModalOpen(false)}
        okText={editingUser ? 'Lưu' : 'Tạo'}
      >
        <Form form={userForm} layout="vertical">
          {!editingUser && (
            <>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                <Input.Password />
              </Form.Item>
              <Form.Item name="role_id" label="Role" rules={[{ required: true }]}>
                <Select options={roleOptions} />
              </Form.Item>
            </>
          )}

          {editingUser && (
            <Form.Item name="password" label="Mật khẩu mới (để trống nếu không đổi)">
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item name="full_name" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Gán role - ${roleTargetUser?.username || ''}`}
        open={isRoleModalOpen}
        onOk={submitRoleModal}
        onCancel={() => setIsRoleModalOpen(false)}
        okText="Lưu"
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item name="role_id" label="Role" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Quyền của user - ${permissionTargetUser?.username || ''}`}
        open={isPermissionModalOpen}
        onOk={() => setIsPermissionModalOpen(false)}
        onCancel={() => setIsPermissionModalOpen(false)}
        okText="Đóng"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Space wrap>
          {(permissionTargetUser?.permissions || []).length ? (
            permissionTargetUser?.permissions.map((p) => (
              <Tag key={p} color="geekblue">
                {p}
              </Tag>
            ))
          ) : (
            <Badge status="default" text="Không có permission" />
          )}
        </Space>
      </Modal>
    </Card>
  );
};

export default UserManagement;
