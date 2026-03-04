import React, { useRef } from 'react';
import { history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import { CopyOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import {
  createDraftFromPublished,
  getWorkflowDefinitions,
} from '@/services/workflow/definition';

const PublishedList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleCreateDraft = async (id: string) => {
    try {
      const draft = await createDraftFromPublished(id);
      message.success('已基于发布版本创建草稿');
      if (draft?.id) {
        history.push(`/workflow/designer/${draft.id}`);
      }
    } catch (error: any) {
      message.error('创建草稿失败: ' + error.message);
    }
  };

  const columns: ProColumns<API.WorkflowDefinitionDto>[] = [
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
      title: '版本',
      dataIndex: 'version',
      width: 100,
      align: 'center',
      render: (_, record) => <Tag color="green">v{record.version}</Tag>,
    },
    {
      title: '标签',
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
      render: () => <Tag color="green">已发布</Tag>,
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
      width: 260,
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
          key="create-draft"
          type="link"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => handleCreateDraft(record.id)}
        >
          创建草稿
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.WorkflowDefinitionDto>
        headerTitle="已发布流程"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const { current, pageSize, key, name } = params;
          const result = await getWorkflowDefinitions({
            skipCount: ((current || 1) - 1) * (pageSize || 10),
            maxResultCount: pageSize || 10,
            key,
            name,
            isPublished: true,
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

export default PublishedList;
