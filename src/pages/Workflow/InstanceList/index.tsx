import React, { useRef } from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag, Space } from 'antd';
import { EyeOutlined, StopOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import {
  getWorkflowInstances,
  terminateWorkflowInstance,
} from '@/services/workflow/instance';

const statusColorMap: Record<string, string> = {
  Running: 'processing',
  Completed: 'success',
  Terminated: 'error',
  Suspended: 'warning',
};

const InstanceList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleTerminate = async (id: string) => {
    try {
      await terminateWorkflowInstance(id, '管理员终止');
      message.success('终止成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('终止失败: ' + error.message);
    }
  };

  const columns: ProColumns<API.WorkflowInstanceDto>[] = [
    {
      title: '实例ID',
      dataIndex: 'id',
      width: 150,
      ellipsis: true,
      copyable: true,
      hideInTable: true,
    },
    {
      title: '流程Key',
      dataIndex: 'definitionKey',
      width: 150,
    },
    {
      title: '流程名称',
      dataIndex: 'definitionName',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '版本标签',
      dataIndex: 'tags',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        Running: { text: '运行中', status: 'Processing' },
        Completed: { text: '已完成', status: 'Success' },
        Terminated: { text: '已终止', status: 'Error' },
        Suspended: { text: '已挂起', status: 'Warning' },
      },
      render: (_, record) => (
        <Tag color={statusColorMap[record.status]}>{record.status}</Tag>
      ),
    },
    {
      title: '当前节点',
      dataIndex: 'currentElementId',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: '开始时间',
      dataIndex: 'creationTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => history.push(`/workflow/monitor/${record.id}`)}
        >
          查看详情
        </Button>,
        record.status === 'Running' && (
          <Popconfirm
            key="terminate"
            title="确定要终止此流程实例吗？"
            onConfirm={() => handleTerminate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<StopOutlined />}>
              终止
            </Button>
          </Popconfirm>
        ),
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.WorkflowInstanceDto>
        headerTitle="流程实例列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const { current, pageSize, definitionKey, businessKey, status } = params;
          const result = await getWorkflowInstances({
            skipCount: ((current || 1) - 1) * (pageSize || 10),
            maxResultCount: pageSize || 10,
            definitionKey,
            businessKey,
            status,
          });
          return {
            data: result.items,
            success: true,
            total: result.totalCount,
          };
        }}
        columns={columns}
        scroll={{ x: 1400 }}
      />
    </PageContainer>
  );
};

export default InstanceList;
