import BpmnViewer from '@/components/BpmnViewer';
import { history, useParams } from '@umijs/max';
import { message, Select, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getWorkflowDefinition,
  getWorkflowDefinitions,
} from '@/services/workflow/definition';

const WorkflowViewer: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const [currentXml, setCurrentXml] = useState<string>('');
  const [versionOptions, setVersionOptions] = useState<API.WorkflowDefinitionDto[]>([]);
  const [currentDefinitionId, setCurrentDefinitionId] = useState<string>();

  useEffect(() => {
    if (id) {
      loadDefinition(id);
    }
  }, [id]);

  const loadDefinition = async (definitionId: string) => {
    setLoading(true);
    try {
      const data = await getWorkflowDefinition(definitionId);
      setCurrentXml(data.bpmnXml || '');
      setCurrentDefinitionId(data.id);

      if (data.definitionKey) {
        const versions = await getWorkflowDefinitions({
          skipCount: 0,
          maxResultCount: 100,
          key: data.definitionKey,
          isPublished: true,
        });

        const sortedVersions = [...(versions.items || [])].sort(
          (a, b) => (b.version || 0) - (a.version || 0),
        );

        setVersionOptions(sortedVersions);
      } else {
        setVersionOptions([]);
      }
    } catch (error: any) {
      message.error('加载流程定义失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = (definitionId: string) => {
    if (!definitionId || definitionId === id) {
      return;
    }
    history.replace(`/workflow/viewer/${definitionId}`);
  };

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Select
          style={{ width: 320 }}
          placeholder="选择已发布版本"
          value={currentDefinitionId}
          onChange={handleVersionChange}
          options={versionOptions.map((item) => ({
            value: item.id,
            label: `v${item.version}${item.tag ? ` (${item.tag})` : ''}`,
          }))}
        />
      </div>
      <div style={{ height: 'calc(100vh - 168px)', minHeight: 560 }}>
        <BpmnViewer xml={currentXml} height="100%" />
      </div>
    </Spin>
  );
};

export default WorkflowViewer;