import React from 'react';
import { useParams, history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import BpmnModeler, { BpmnModelerRef } from '@/components/BpmnModeler';
import { getWorkflowDraft } from '@/services/workflow/definition';

const DraftView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const modelerRef = React.useRef<BpmnModelerRef>(null);
  const [currentXml, setCurrentXml] = React.useState<string>();
  return(<PageContainer
        header={{
          title: '流程定义详情',
        }}
      >
      </PageContainer>)
};
export default DraftView;