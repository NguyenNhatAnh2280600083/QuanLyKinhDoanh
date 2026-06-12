import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { rbacService, Role } from '../services/rbacService';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await rbacService.listRoles();
      setRoles(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tải danh sách role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({ name: role.name, description: role.description });
    setIsModalOpen(true);
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRole) {
        await rbacService.updateRole(editingRole.id, values);
        message.success('Cập nhật role thành công');
      } else {
        await rbacService.createRole(values);
        message.success('Tạo role thành công');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const remove = async (role: Role) => {
    Modal.confirm({
      title: `Xóa role ${role.name.toUpperCase()}?`,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await rbacService.deleteRole(role.id);
          message.success('Xóa role thành công');
          await fetchData();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Xóa role thất bại');
        }
      },
    });
  };

  const columns: any[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Tag color="blue">{v.toUpperCase()}</Tag>,
    },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Số quyền',
      key: 'permissionCount',
      width: 120,
      render: (_: any, r: Role) => (r.permissions ? r.permissions.length : 0),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v?: string) => (v ? new Date(v).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      render: (_: any, r: Role) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(r)}>
            Sửa
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => remove(r)}
            disabled={r.name.toLowerCase() === 'admin'}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý nhóm quyền (Role)"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Tạo role
        </Button>
      }
    >
      <Table columns={columns} dataSource={roles} loading={loading} rowKey="id" />

      <Modal
        title={editingRole ? 'Sửa role' : 'Tạo role'}
        open={isModalOpen}
        onOk={submit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingRole ? 'Lưu' : 'Tạo'}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên role" rules={[{ required: true }]}>
            <Input placeholder="admin / manager / sales / warehouse" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RoleManagement;
