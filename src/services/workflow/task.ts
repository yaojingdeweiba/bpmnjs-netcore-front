import { request } from '@umijs/max';

/** 获取我的待办任务 */
export async function getMyTasks(params?: API.PagedQueryDto) {
  return request<API.PagedResultDto<API.TaskInstanceDto>>(
    '/api/app/task/my-tasks',
    {
      method: 'GET',
      params,
    },
  );
}

/** 获取任务详情 */
export async function getTask(id: string) {
  return request<API.TaskInstanceDto>(`/api/app/task/${id}`, {
    method: 'GET',
  });
}

/** 认领任务 */
export async function claimTask(id: string) {
  return request<void>(`/api/app/task/${id}/claim`, {
    method: 'POST',
  });
}

/** 完成任务 */
export async function completeTask(id: string, data: API.CompleteTaskDto) {
  return request<void>(`/api/app/task/${id}/complete`, {
    method: 'POST',
    data,
  });
}

/** 委派任务 */
export async function delegateTask(id: string, data: API.ClaimTaskDto) {
  return request<void>(`/api/app/task/${id}/delegate`, {
    method: 'POST',
    data,
  });
}

/** 转办任务 */
export async function transferTask(id: string, data: API.TransferTaskDto) {
  return request<void>(`/api/app/task/${id}/transfer`, {
    method: 'POST',
    data,
  });
}

/** 获取任务历史 */
export async function getTaskHistory(
  params?: API.PagedQueryDto & {
    instanceId?: string;
    assigneeId?: string;
  },
) {
  return request<API.PagedResultDto<API.TaskInstanceDto>>(
    '/api/app/task/history',
    {
      method: 'GET',
      params,
    },
  );
}

/** 获取所有任务（管理员用） */
export async function getAllTasks(
  params?: API.PagedQueryDto & {
    status?: string;
    assigneeId?: string;
    instanceId?: string;
  },
) {
  return request<API.PagedResultDto<API.TaskInstanceDto>>('/api/app/task', {
    method: 'GET',
    params,
  });
}
