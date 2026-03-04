import React, { useRef } from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import {
  getWorkflowDraftList,
  publishWorkflowDraft,
  deleteWorkflowDraft,
} from '@/services/workflow/definition';

const DraftList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handlePublish = async (id: string) => {
    try {
      await publishWorkflowDraft(id);
      message.success('发布成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('发布失败: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflowDraft(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const columns: ProColumns<API.WorkflowDefinitionDraftDto>[] = [
    {
      title: '流程',
      dataIndex: 'definitionKey',
      width: 180,
      copyable: true,
    },
    {
      title: '流程名称',
      dataIndex: 'serviceTypeName',
      width: 180,
    },
    {
      title: '版本标签',
      dataIndex: 'tags',
      width: 120,
      align: 'center',
      render: (_, record) => record.tags || '-',
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'isPublished',
      width: 100,
      align: 'center',
      hideInSearch: true,
      render: () => <Tag>草稿</Tag>,
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
      width: 300,
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
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => history.push(`/workflow/designer/${record.id}`)}
        >
          编辑
        </Button>,
        <Button
          key="publish"
          type="link"
          size="small"
          icon={<SendOutlined />}
          onClick={() => handlePublish(record.id)}
        >
          发布
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除此草稿吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.WorkflowDefinitionDraftDto>
        headerTitle="草稿箱"
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
            新建草稿
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, key, name } = params;
          const result = await getWorkflowDraftList({
            skipCount: ((current || 1) - 1) * (pageSize || 10),
            maxResultCount: pageSize || 10,
            key,
            name,
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

export default DraftList;
