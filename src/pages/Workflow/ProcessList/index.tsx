import React, { useRef } from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag, Space } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import {
  getWorkflowDefinitions,
  publishWorkflowDefinition,
  deleteWorkflowDefinition,
} from '@/services/workflow/definition';

const ProcessList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handlePublish = async (id: string) => {
    try {
      await publishWorkflowDefinition(id);
      message.success('发布成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('发布失败: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflowDefinition(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const columns: ProColumns<API.WorkflowDefinitionDto>[] = [
    {
      title: '流程',
      dataIndex: 'definitionKey',
      width: 150,
      copyable: true,
    },
    {
      title: '流程名称',
      dataIndex: 'serviceTypeName',
      width: 150,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      align: 'center',
      render: (_, record) => <Tag color="blue">v{record.version}</Tag>,
    },
      {
      title: '版本标签',
      dataIndex: 'tags',
      width: 80,
      align: 'center'
    },
    {
      title: '状态',
      dataIndex: 'isPublished',
      width: 80,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        true: { text: '已发布', status: 'Success' },
        false: { text: '草稿', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isPublished ? 'green' : 'default'}>
          {record.isPublished ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    // {
    //   title: '分类',
    //   dataIndex: 'category',
    //   width: 80,
    //   hideInSearch: true,
    // },
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
      width: 250,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => history.push(`/workflow/viewer/${record.id}`)}
        >
          查看
        </Button>,
        !record.isPublished && (
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => history.push(`/workflow/designer/${record.id}`)}
          >
            编辑
          </Button>
        ),
        !record.isPublished && (
          <Button
            key="publish"
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handlePublish(record.id)}
          >
            发布
          </Button>
        ),
        !record.isPublished && (
          <Popconfirm
            key="delete"
            title="确定要删除此流程定义吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        ),
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.WorkflowDefinitionDto>
        headerTitle="流程定义列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/workflow/designer')}
          >
            新建流程
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          const { current, pageSize, key, name, isPublished } = params;
          const result = await getWorkflowDefinitions({
            skipCount: ((current || 1) - 1) * (pageSize || 10),
            maxResultCount: pageSize || 10,
            key,
            name,
            isPublished,
          });
          return {
            data: result.items,
            success: true,
            total: result.totalCount,
          };
        }}
        columns={columns}
        scroll={{ x: 1300 }}
      />
    </PageContainer>
  );
};

export default ProcessList;
