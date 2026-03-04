import React, { useRef, useState } from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { Button, message, Modal, Form, Input, Tag } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { getMyTasks, completeTask, claimTask } from '@/services/workflow/task';

const { TextArea } = Input;

const MyTasks: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<API.TaskInstanceDto>();
  const [form] = Form.useForm();

  const handleComplete = async (task: API.TaskInstanceDto) => {
    setCurrentTask(task);
    form.resetFields();
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!currentTask) return;

      await completeTask(currentTask.id, {
        variables: values.variables ? JSON.parse(values.variables) : {},
        comment: values.comment,
      });

      message.success('任务完成');
      setCompleteModalVisible(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('完成任务失败: ' + error.message);
    }
  };

  const handleClaim = async (taskId: string) => {
    try {
      await claimTask(taskId);
      message.success('认领成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('认领失败: ' + error.message);
    }
  };

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
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        Pending: { text: '待处理', status: 'Warning' },
        InProgress: { text: '处理中', status: 'Processing' },
        Completed: { text: '已完成', status: 'Success' },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          Pending: 'warning',
          InProgress: 'processing',
          Completed: 'success',
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
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      align: 'center',
      hideInSearch: true,
      render: (_, record) => {
        const priority = record.priority || 0;
        const color = priority > 5 ? 'red' : priority > 3 ? 'orange' : 'default';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: '到期时间',
      dataIndex: 'dueDate',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => record.dueDate || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'creationTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
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
        record.status === 'Pending' && !record.assigneeId && (
          <Button
            key="claim"
            type="link"
            size="small"
            onClick={() => handleClaim(record.id)}
          >
            认领
          </Button>
        ),
        (record.status === 'Pending' || record.status === 'InProgress') && (
          <Button
            key="complete"
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleComplete(record)}
          >
            完成
          </Button>
        ),
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TaskInstanceDto>
        headerTitle="我的待办任务"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const { current, pageSize } = params;
          const result = await getMyTasks({
            skipCount: ((current || 1) - 1) * (pageSize || 10),
            maxResultCount: pageSize || 10,
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

      <Modal
        title="完成任务"
        open={completeModalVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="任务名称">
            <Input value={currentTask?.name} disabled />
          </Form.Item>
          <Form.Item
            name="comment"
            label="备注"
            rules={[{ required: false }]}
          >
            <TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item
            name="variables"
            label="变量（JSON格式）"
            rules={[
              {
                validator: async (_, value) => {
                  if (value) {
                    try {
                      JSON.parse(value);
                    } catch {
                      throw new Error('请输入有效的JSON格式');
                    }
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder='例如: {"approved": true, "comment": "同意"}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default MyTasks;
