import { request } from '@umijs/max';

/** 启动流程实例 */
export async function startWorkflowInstance(data: API.StartWorkflowDto) {
  return request<API.WorkflowInstanceDto>('/api/app/workflow-instance/start', {
    method: 'POST',
    data,
  });
}

/** 获取流程实例列表 */
export async function getWorkflowInstances(
  params?: API.PagedQueryDto & {
    definitionKey?: string;
    businessKey?: string;
    status?: string;
  },
) {
  return request<API.PagedResultDto<API.WorkflowInstanceDto>>(
    '/api/app/workflow-instance',
    {
      method: 'GET',
      params,
    },
  );
}

/** 获取流程实例详情 */
export async function getWorkflowInstance(id: string) {
  return request<API.WorkflowInstanceDto>(`/api/app/workflow-instance/${id}`, {
    method: 'GET',
  });
}

/** 获取流程实例运行状态（当前节点 + 元素状态） */
export async function getInstanceState(instanceId: string) {
  return request<API.WorkflowInstanceStateDto>(
    `/api/app/workflow-instance/instance-state/${instanceId}`,
    {
      method: 'GET',
    },
  );
}

/** 终止流程实例 */
export async function terminateWorkflowInstance(id: string, reason?: string) {
  return request<void>(`/api/app/workflow-instance/${id}/terminate`, {
    method: 'POST',
    data: { reason },
  });
}

/** 挂起流程实例 */
export async function suspendWorkflowInstance(id: string) {
  return request<void>(`/api/app/workflow-instance/${id}/suspend`, {
    method: 'POST',
  });
}

/** 恢复流程实例 */
export async function resumeWorkflowInstance(id: string) {
  return request<void>(`/api/app/workflow-instance/${id}/resume`, {
    method: 'POST',
  });
}

/** 获取流程实例的执行历史 */
export async function getInstanceHistory(instanceId: string) {
  return request<API.ExecutionHistoryDto[]>(
    `/api/app/workflow-instance/history/${instanceId}`,
    {
      method: 'GET',
    },
  );
}
