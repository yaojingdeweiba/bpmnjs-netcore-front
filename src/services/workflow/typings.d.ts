declare namespace API {
  // 流程定义相关
  export interface WorkflowDefinitionDto {
    id: string;
    definitionKey: string;
    serviceTypeId: string;
    serviceTypeName: string;
    version: number;
    tags: string;
    isPublished: boolean;
    description?: string;
    category?: string;
    bpmnXml: string;
    processJson: string;
    creationTime: string;
    creatorId?: string;
  }

  export interface CreateWorkflowDefinitionDto {
    definitionKey: string;
    serviceTypeId: string;
    serviceTypeName: string;
    description?: string;
    bpmnXml: string;
    processJson: string;
    category?: string;
    tags?: string;
  }

  export interface WorkflowDefinitionDraftDto {
    id: string;
    baseDefinitionId?: string;
    definitionKey: string;
    serviceTypeName: string;
    draftName:string,
    version?: number;
    tags?: string;
    description?: string;
    category?: string;
    bpmnXml: string;
    processJson: string;
    creationTime: string;
    creatorId?: string;
  }

  export interface SaveWorkflowDraftDto {
    id?: string;
    definitionId?: string;
    definitionKey: string;
    serviceTypeId: string;
    serviceTypeName: string;
    description?: string;
    category?: string;
    bpmnXml: string;
    processJson: string;
    tags?: string;
    draftId?: string;
  }

  export interface UpdateWorkflowDefinitionDto {
    definitionKey?: string;
    serviceTypeId?: string;
    serviceTypeName?: string;
    description?: string;
    bpmnXml?: string;
    processJson?: string;
    category?: string;
    tags?: string;
  }

  // 流程实例相关
  export interface WorkflowInstanceDto {
    id: string;
    definitionId: string;
    definitionKey: string;
    definitionName?: string;
    businessKey?: string;
    status: 'Running' | 'Completed' | 'Terminated' | 'Suspended';
    currentElementId?: string;
    variables: Record<string, any>;
    creationTime: string;
    completedAt?: string;
    creatorId?: string;
    tags?: string;
  }

  export type WorkflowElementStateStatus =
    | 'Running'
    | 'InProgress'
    | 'Success'
    | 'Completed'
    | 'Failed'
    | 'Terminated'
    | string;

  export interface WorkflowElementStateDto {
    elementId: string;
    executionId?: string;
    state: WorkflowElementStateStatus;
    retriesLeft?: number;
    errorMessage?: string | null;
  }

  export interface WorkflowInstanceStateDto {
    currentElementIds: string[];
    elementStates: WorkflowElementStateDto[];
    instanceStatus: string;
  }

  export interface StartWorkflowDto {
    definitionKey: string;
    businessKey?: string;
    variables?: Record<string, any>;
  }

  // 任务相关
  export interface TaskInstanceDto {
    id: string;
    instanceId: string;
    taskKey: string;
    name: string;
    assigneeId?: string;
    assigneeName?: string;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Terminated';
    formKey?: string;
    dueDate?: string;
    priority?: number;
    variables: Record<string, any>;
    creationTime: string;
    completionTime?: string;
  }

  export interface CompleteTaskDto {
    variables?: Record<string, any>;
    comment?: string;
  }

  export interface ClaimTaskDto {
    userId: string;
  }

  export interface TransferTaskDto {
    userId: string;
  }

  // 执行历史
  export interface ExecutionHistoryDto {
    id: string;
    instanceId: string;
    elementId: string;
    elementType: string;
    elementName?: string;
    action: string;
    data?: Record<string, any>;
    creationTime: string;
  }

  // 分页查询
  export interface PagedResultDto<T> {
    items: T[];
    totalCount: number;
  }

  export interface PagedQueryDto {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
  }
}
