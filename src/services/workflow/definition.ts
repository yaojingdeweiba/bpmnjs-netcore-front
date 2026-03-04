import { request } from '@umijs/max';

/** 保存草稿 */
export async function saveWorkflowDraft(data: API.SaveWorkflowDraftDto) {
  return request<API.WorkflowDefinitionDraftDto>('/draft/save', {
    method: 'POST',
    data,
  });
}

/** 获取草稿列表 */
export async function getWorkflowDraftList(
  params?: API.PagedQueryDto & {
    key?: string;
    name?: string;
  },
) {
  return request<API.PagedResultDto<API.WorkflowDefinitionDraftDto>>(
    '/draft/list',
    {
      method: 'GET',
      params,
    },
  );
}

/** 获取草稿详情 */
export async function getWorkflowDraft(id: string) {
  return request<API.WorkflowDefinitionDraftDto>(`/draft/${id}`, {
    method: 'GET',
  });
}

/** 从已发布版本创建草稿 */
export async function createDraftFromPublished(id: string) {
  return request<API.WorkflowDefinitionDraftDto>(
    `/draft/create-from-published/${id}`,
    {
      method: 'POST',
    },
  );
}

/** 删除草稿 */
export async function deleteWorkflowDraft(id: string) {
  return request<void>(`/draft/${id}`, {
    method: 'DELETE',
  });
}

/** 从草稿发布 */
export async function publishWorkflowDraft(id: string) {
  return request<void>(`/draft/publish/${id}`, {
    method: 'POST',
  });
}

/** 获取流程定义列表 */
export async function getWorkflowDefinitions(
  params?: API.PagedQueryDto & {
    key?: string;
    name?: string;
    isPublished?: boolean;
  },
) {
  return request<API.PagedResultDto<API.WorkflowDefinitionDto>>(
    '/api/app/workflow-definition',
    {
      method: 'GET',
      params,
    },
  );
}

/** 获取流程定义详情 */
export async function getWorkflowDefinition(id: string) {
  return request<API.WorkflowDefinitionDto>(`/api/app/workflow-definition/${id}`, {
    method: 'GET',
  });
}

/** 创建流程定义 */
export async function createWorkflowDefinition(
  data: API.CreateWorkflowDefinitionDto,
) {
  return request<API.WorkflowDefinitionDto>('/api/app/workflow-definition', {
    method: 'POST',
    data,
  });
}

/** 更新流程定义 */
export async function updateWorkflowDefinition(
  id: string,
  data: API.UpdateWorkflowDefinitionDto,
) {
  return request<void>(`/api/app/workflow-definition/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 发布流程定义 */
export async function publishWorkflowDefinition(id: string) {
  return request<void>(`/api/app/workflow-definition/${id}/publish`, {
    method: 'POST',
  });
}

/** 删除流程定义 */
export async function deleteWorkflowDefinition(id: string) {
  return request<void>(`/api/app/workflow-definition/${id}`, {
    method: 'DELETE',
  });
}

/** 获取流程定义的BPMN XML */
export async function getWorkflowDefinitionXml(id: string) {
  return request<{ xml: string }>(`/api/app/workflow-definition/${id}/xml`, {
    method: 'GET',
  });
}
