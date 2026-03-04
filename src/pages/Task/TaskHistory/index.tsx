import React, { useRef } from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { getTaskHistory } from '@/services/workflow/task';

const TaskHistory: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<API.TaskInstanceDto>[] = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '任务Key',
      dataIndex: 'taskKey',
      width: 150,
      hideInSearch: true,
    },
    {
      title: '实例ID',
      dataIndex: 'instanceId',
      width: 150,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        Completed: { text: '已完成', status: 'Success' },
        Terminated: { text: '已终止', status: 'Error' },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          Completed: 'success',
          Terminated: 'error',
        };
        return <Tag color={colorMap[record.status]}>{record.status}</Tag>;
      },
    },
    {
      title: '受理人',
      dataIndex: 'assigneeName',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.assigneeName || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'creationTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '完成时间',
      dataIndex: 'completionTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => history.push(`/workflow/monitor/${record.instanceId}`)}
        >
          查看流程
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TaskInstanceDto>
        headerTitle="任务历史"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const { current, pageSize, instanceId, assigneeId } = params;
          const result = await getTaskHistory({
            skipCount: ((current || 1) - 1) * (pageSize || 10),
            maxResultCount: pageSize || 10,
            instanceId,
            assigneeId,
          });
          return {
            data: result.items,
            success: true,
            total: result.totalCount,
          };
        }}
        columns={columns}
        scroll={{ x: 1200 }}
      />
    </PageContainer>
  );
};

export default TaskHistory;
