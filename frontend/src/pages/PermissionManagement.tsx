import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Select, Space, Table, Tag, message } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { SaveOutlined } from '@ant-design/icons';
import { Permission, Role, rbacService } from '../services/rbacService';

const PermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roleId, setRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: `${r.name.toUpperCase()}${r.description ? ` - ${r.description}` : ''}`,
        value: r.id,
      })),
    [roles]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([rbacService.listRoles(), rbacService.listPermissions()]);
      setRoles(rolesData);
      setPermissions(permsData);
      if (roleId === null && rolesData.length) {
        setRoleId(rolesData[0].id);
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Không thể tải dữ liệu phân quyền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!roleId) return;
    const role = roles.find((r) => r.id === roleId);
    const ids = (role?.permissions || []).map((p) => p.id);
    setSelectedPermissionIds(ids);
  }, [roleId, roles]);

  const save = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      await rbacService.setRolePermissions(roleId, selectedPermissionIds);
      message.success('Lưu phân quyền thành công');
      await fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lưu phân quyền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const rowSelection: TableRowSelection<Permission> = {
    selectedRowKeys: selectedPermissionIds,
    onChange: (keys) => setSelectedPermissionIds(keys as number[]),
  };

  const columns: any[] = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 220,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    { title: 'Tên', dataIndex: 'name', key: 'name', width: 240 },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
  ];

  return (
    <Card
      title="Phân quyền (Permission → Role)"
      extra={
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} disabled={!roleId}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-500">Chọn role để gán quyền</div>
          <Select
            style={{ width: 420, maxWidth: '100%' }}
            options={roleOptions}
            value={roleId ?? undefined}
            onChange={(v) => setRoleId(v)}
            loading={loading}
          />
        </div>

        <Table
          columns={columns}
          dataSource={permissions}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 20 }}
        />
      </Space>
    </Card>
  );
};

export default PermissionManagement;
