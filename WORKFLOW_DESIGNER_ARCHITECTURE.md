# 工作流前端设计与代码结构说明（Workflow Designer）

## 1. 文档目标

本说明用于统一前后端对以下内容的理解：

- 流程设计器的数据流与发布链路
- BPMN XML 到流程 JSON（processJson）的转换规则
- Camunda 扩展属性（如 `camunda:assignee`）的落库策略
- 监控页的数据读取与容错策略
- 当前代码结构与可扩展建议

---

## 2. 端到端流程（前端视角）

### 2.1 新建/编辑流程定义

1. 用户在设计器编辑 BPMN。
2. 点击“保存”后，前端执行：
   - 从建模器获取 XML
   - 解析 XML 生成 `processJson`
   - 提取 `processId` 作为流程 `key`
   - 调用创建或更新接口
3. 新建成功后跳转到编辑态（带 definition id）。

### 2.2 发布流程定义

1. 点击“发布”时先执行一次保存。
2. 保存成功后调用发布接口。
3. 发布动作只会“激活流程定义”，不会自动创建流程实例。

### 2.3 启动流程实例（独立动作）

需调用实例启动接口（`startWorkflowInstance`）单独创建实例，发布不会替代该动作。

---

## 3. 代码结构总览

### 3.1 页面层

- `src/pages/Workflow/Designer/index.tsx`
  - 流程定义的加载、保存、发布
  - BPMN XML 与 `processJson` 的提交
  - 对 `key`（流程 ID）做前置校验

- `src/pages/Workflow/Monitor/index.tsx`
  - 流程实例详情、流程图、执行历史展示
  - 对历史数据做数组归一化，避免 `filter is not a function`

### 3.2 组件层

- `src/components/BpmnModeler/index.tsx`
  - BPMN 设计器与属性面板（Camunda provider）

- `src/components/BpmnViewer/index.tsx`
  - 流程图查看与节点高亮

### 3.3 服务层

- `src/services/workflow/definition.ts`
  - 流程定义 CRUD 与发布

- `src/services/workflow/instance.ts`
  - 实例启动、查询、终止、挂起、恢复、历史

### 3.4 解析层

- `src/utils/bpmn-parser.ts`
  - BPMN XML 解析
  - 结构化输出 `ProcessDefinition`
  - Camunda 扩展属性写入 `properties`

---

## 4. 核心数据结构

### 4.1 processJson 顶层

```json
{
  "startEventId": "StartEvent_1",
  "elements": [],
  "sequenceFlows": []
}
```

### 4.2 节点结构（后端消费重点）

```json
{
  "id": "Activity_1yjkh5u",
  "name": "审批",
  "type": "UserTask",
  "properties": {
    "assignee": "${oneUser}"
  },
  "incoming": ["Flow_17d1wi6"],
  "outgoing": ["Flow_1stcgn8"]
}
```

说明：
- `properties` 是后端执行参数入口，统一承载 Camunda 扩展属性。
- `incoming/outgoing` 用于图关系与可视化/回溯。

---

## 5. Camunda 属性处理策略（已实现）

位置：`src/utils/bpmn-parser.ts`

### 5.1 解析器初始化

- 使用 `bpmn-moddle`
- 注册 `camunda-bpmn-moddle/resources/camunda.json`
- 使 `camunda:*` 在解析阶段可识别

### 5.2 属性提取规则

#### A. 通用规则

- 遍历元素 `$attrs`
- 所有 `camunda:*` 自动映射到 `properties`
  - 例：`camunda:assignee` → `properties.assignee`

#### B. 常用字段显式补齐

- `asyncBefore`
- `asyncAfter`
- `exclusive`
- `jobPriority`
- `taskPriority`
- `priority`

#### C. UserTask 特化字段

- `assignee`
- `candidateGroups`
- `candidateUsers`
- `formKey`
- `dueDate`
- `priority`

读取顺序为“元素字段优先，`$attrs` 兜底”，确保不同建模写法都能稳定输出。

#### D. ServiceTask 字段

- `className`（来自 `camunda:class`）
- `methodName`（来自 `camunda:method`）
- `delegateExpression`（来自 `camunda:delegateExpression`）

#### E. extensionElements 处理

- `camunda:Properties`：平铺进 `properties`
- `camunda:InputOutput`：转成纯 JSON 数组
  - `inputParameters`
  - `outputParameters`
- `camunda:TaskListener` / `camunda:ExecutionListener`
  - 分别放入 `taskListeners` / `executionListeners`

---

## 6. 保存与发布链路细节

位置：`src/pages/Workflow/Designer/index.tsx`

### 6.1 保存

- 新建时：必须有流程 `key`（来自 BPMN `process id`）
- 编辑时：允许保存但建议保留合法 `key`
- 提交内容：
  - `bpmnXml`
  - `processJson`（解析结果序列化）
  - 名称/描述/分类等

### 6.2 发布

- 先保存、再发布
- 发布成功表示定义可被启动，不创建实例

---

## 7. 监控页容错策略

位置：`src/pages/Workflow/Monitor/index.tsx`

问题背景：历史接口可能返回数组，也可能返回分页结构。  
已做处理：统一归一化为数组再渲染。

```ts
const normalizedHistory = Array.isArray(historyData)
  ? historyData
  : Array.isArray((historyData as any)?.items)
    ? (historyData as any).items
    : [];
```

收益：避免 `history.filter is not a function`。

---

## 8. 前后端对齐建议（重点）

1. **建议保留双轨存储**
   - `bpmnXml` 作为权威定义
   - `processJson` 作为执行/查询友好模型

2. **后端执行统一读 `properties`**
   - 避免后端重复解析 XML
   - 降低 Camunda 模型耦合

3. **约定字段白名单（可选）**
   - 如果后端希望固定 schema，可在解析后做一次 normalize
   - 例如固定输出：`assignee/candidateUsers/candidateGroups/formKey/dueDate/priority/...`

4. **权限与发布**
   - 发布接口通常要求更高权限，403 时需确认 ABP 权限点配置
   - 若测试环境需匿名，可在后端方法上用 `[AllowAnonymous]`（仅测试环境建议）

---

## 9. 建议的下一步实施

### 9.1 协议稳定化

- 增加“前端 processJson schema 校验”（保存前）
- 与后端明确必填字段（如 `id/type/properties.assignee`）

### 9.2 测试保障

- 增加 `BpmnParser` 单元测试（至少覆盖）：
  - UserTask assignee 提取
  - extensionElements 提取
  - listener / inputOutput 提取

### 9.3 运维与排错

- 前端在保存失败时打印关键上下文（可选 debug 开关）：
  - `processId`
  - 节点数量
  - 某关键节点的 `properties`

---

## 10. 总结

当前实现已经满足“将 Camunda 属性写入流程 JSON 的 properties”这一核心要求，尤其支持了后端所需的 `assignee` 场景。整体架构建议继续沿用“XML + JSON 双轨”，并通过 schema 与测试进一步固化协议稳定性。