import React, { useEffect, useState } from 'react';
import { useParams } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Descriptions, Timeline, Button, Spin, message, Tag } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import BpmnViewer from '@/components/BpmnViewer';
import {
  getWorkflowInstance,
  getInstanceHistory,
  getInstanceState,
} from '@/services/workflow/instance';
import { getWorkflowDefinition } from '@/services/workflow/definition';
import dayjs from 'dayjs';

const EXCLUDED_ELEMENT_ID_PATTERN = /^(StartEvent|EndEvent|.*Gateway)_?/i;

const isCompletedAction = (action?: string) =>
  /complete|completed|finish|finished|end|ended|terminate|terminated|cancel|cancelled|leave|left/i.test(
    action || '',
  );

const isRunningState = (state?: string) => /running|inprogress|active/i.test(state || '');
const isCompletedState = (state?: string) => /success|completed/i.test(state || '');
const isFailedState = (state?: string) => /failed|error|incident|terminated/i.test(state || '');

const getStateTagColor = (state?: string) => {
  if (isFailedState(state)) return 'error';
  if (isRunningState(state)) return 'processing';
  if (isCompletedState(state)) return 'success';
  return 'default';
};

const Monitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState<API.WorkflowInstanceDto>();
  const [instanceState, setInstanceState] = useState<API.WorkflowInstanceStateDto>();
  const [bpmnXml, setBpmnXml] = useState<string>('');
  const [executionHistory, setExecutionHistory] = useState<API.ExecutionHistoryDto[]>([]);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (instanceId: string) => {
    setLoading(true);
    try {
      // 加载流程实例
      const instanceData = await getWorkflowInstance(instanceId);
      setInstance(instanceData);

      // 加载流程定义（获取BPMN XML）
      const definitionData = await getWorkflowDefinition(instanceData.definitionId);
      setBpmnXml(definitionData.bpmnXml);

      // 加载执行历史
      const historyData = await getInstanceHistory(instanceId);
      const normalizedHistory = Array.isArray(historyData)
        ? historyData
        : Array.isArray((historyData as any)?.items)
          ? (historyData as any).items
          : [];
      setExecutionHistory(normalizedHistory);

      // 加载运行时状态（当前节点 + 元素状态）
      const stateData = await getInstanceState(instanceId);
      setInstanceState(stateData);
    } catch (error: any) {
      message.error('加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      Running: 'processing',
      Completed: 'success',
      Terminated: 'error',
      Suspended: 'warning',
    };
    return colorMap[status] || 'default';
  };

  const runningElementIdsFromState = (instanceState?.elementStates || [])
    .filter((item) => isRunningState(item.state))
    .map((item) => item.elementId)
    .filter((elementId) => !EXCLUDED_ELEMENT_ID_PATTERN.test(elementId));

  const highlightedElementIds = Array.from(
    new Set([
      ...((instanceState?.currentElementIds || []).filter(
        (elementId) => !EXCLUDED_ELEMENT_ID_PATTERN.test(elementId),
      )),
      ...runningElementIdsFromState,
    ]),
  );

  const elementTypeMap = new Map(
    executionHistory
      .filter((item) => item.elementId)
      .map((item) => [item.elementId, (item.elementType || '').toLowerCase()]),
  );

  const serviceTaskStates = (instanceState?.elementStates || []).filter((item) => {
    const elementType = elementTypeMap.get(item.elementId) || '';
    return elementType.includes('servicetask') || /service.?task/i.test(item.elementId);
  });

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="流程监控"
      extra={[
        <Button
          key="back"
          icon={<RollbackOutlined />}
          onClick={() => window.location.href = '/workflow/instance-list'}
        >
          返回
        </Button>,
      ]}
    >
      <Card title="实例信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Instance Id">{instance?.id}</Descriptions.Item>
          {/* <Descriptions.Item label="业务Key">
            {instance?.businessKey || '-'}
          </Descriptions.Item> */}
          <Descriptions.Item label="Definition Key">{instance?.definitionKey}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(instance?.status || '')}>
              {instance?.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前节点">
            {highlightedElementIds.length > 0
              ? highlightedElementIds.join(', ')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开始时间" >
            {instance?.creationTime ? dayjs(instance.creationTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间"  span={2}>
            {instance?.completedAt ? dayjs(instance.completedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          {/* <Descriptions.Item label="ServiceTask 状态" span={2}>
            {serviceTaskStates.length > 0 ? (
              serviceTaskStates.map((item) => (
                <Tag key={`${item.elementId}-${item.executionId || ''}`} color={getStateTagColor(item.state)}>
                  {item.elementId}: {item.state}
                  {typeof item.retriesLeft === 'number' ? ` (重试:${item.retriesLeft})` : ''}
                  {item.errorMessage ? ` - ${item.errorMessage}` : ''}
                </Tag>
              ))
            ) : (
              '-'
            )}
          </Descriptions.Item> */}
        </Descriptions>
      </Card>

      <Card title="流程图" style={{ marginBottom: 16 }}>
        <div style={{ height: '500px' }}>
          <BpmnViewer
            xml={bpmnXml}
            height="100%"
            highlightedElements={highlightedElementIds}
            completedElements={[]}
          />
        </div>
      </Card>

      <Card title="执行历史">
        <Timeline>
          {executionHistory.map((item) => (
            <Timeline.Item key={item.id} color={isCompletedAction(item.action) ? 'green' : 'blue'}>
              <p>
                <strong>{item.elementName || item.elementId}</strong> ({item.elementType})
              </p>
              <p>操作: {item.action}</p>
              <p style={{ color: '#999' }}>时间: {item.creationTime}</p>
              {item.data && (
                <p>
                  数据: <code>{JSON.stringify(item.data, null, 2)}</code>
                </p>
              )}
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </PageContainer>
  );
};

export default Monitor;
