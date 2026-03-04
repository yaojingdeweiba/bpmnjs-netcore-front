# BPMN 工作流系统 - 前端部分

## 项目概述

这是基于 Ant Design Pro + bpmn-js 的 BPMN 工作流管理前端系统，提供流程设计、流程管理、任务管理等功能。

## 技术栈

- **框架**: React 19.2.4 + Umi 4.6.29
- **UI组件**: Ant Design Pro Components
- **BPMN**: bpmn-js 18.12.0 + bpmn-js-properties-panel
- **状态管理**: Zustand (通过 @umijs/max)
- **HTTP客户端**: Umi Request (基于 axios)
- **包管理器**: pnpm

## 项目结构

```
src/
├── components/              # 全局组件
│   ├── BpmnModeler/        # BPMN建模器组件（含属性面板）
│   │   ├── index.tsx
│   │   └── styles.less
│   └── BpmnViewer/         # BPMN查看器组件
│       ├── index.tsx
│       └── styles.less
│
├── pages/                   # 页面组件
│   ├── Workflow/           # 工作流模块
│   │   ├── ProcessList/    # 流程定义列表
│   │   ├── Designer/       # 流程设计器
│   │   ├── InstanceList/   # 流程实例列表
│   │   └── Monitor/        # 流程监控
│   └── Task/               # 任务模块
│       ├── MyTasks/        # 我的待办任务
│       └── TaskHistory/    # 任务历史
│
├── services/               # API服务层
│   └── workflow/
│       ├── typings.d.ts    # TypeScript类型定义
│       ├── definition.ts   # 流程定义API
│       ├── instance.ts     # 流程实例API
│       └── task.ts         # 任务API
│
├── utils/                  # 工具函数
│   └── bpmn-parser.ts      # BPMN解析工具
│
├── locales/                # 国际化
│   ├── zh-CN/menu.ts       # 中文菜单
│   └── en-US/menu.ts       # 英文菜单
│
└── app.tsx                 # 应用配置
```

## 功能模块

### 1. 工作流管理

#### 流程定义列表 (`/workflow/process-list`)
- 查看所有流程定义
- 支持按流程Key、名称、状态搜索
- 新建、编辑、删除流程定义
- 发布流程定义

#### 流程设计器 (`/workflow/designer`)
- 可视化BPMN流程设计
- 属性面板配置节点属性
  - UserTask: 配置受理人、候选用户、表单等
  - ServiceTask: 配置服务类名和方法
  - SequenceFlow: 配置条件表达式
  - Gateway: 配置网关类型
- 自动解析BPMN XML为JSON
- 支持保存和发布

#### 流程实例列表 (`/workflow/instance-list`)
- 查看所有流程实例
- 支持按流程Key、业务Key、状态搜索
- 查看流程详情和监控
- 终止运行中的流程

#### 流程监控 (`/workflow/monitor/:id`)
- 实时查看流程执行状态
- 可视化显示当前执行节点
- 查看执行历史
- 高亮已完成节点

### 2. 任务管理

#### 我的待办任务 (`/task/my-tasks`)
- 查看待处理任务
- 认领任务
- 完成任务（支持传递变量）
- 查看关联流程

#### 任务历史 (`/task/task-history`)
- 查看已完成的任务
- 按实例ID、受理人筛选
- 查看关联流程

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置后端API地址

编辑 `config/proxy.ts`，修改后端API地址：

```typescript
export default {
  dev: {
    '/api/': {
      target: 'https://localhost:44300',  // 修改为你的后端地址
      changeOrigin: true,
      secure: false,
    },
  },
};
```

### 3. 启动开发服务器

```bash
pnpm dev
# 或
pnpm start
```

访问 http://localhost:8000

### 4. 构建生产版本

```bash
pnpm build
```

## API接口说明

### 流程定义API

- `GET /api/app/workflow-definition` - 获取流程定义列表
- `GET /api/app/workflow-definition/{id}` - 获取流程定义详情
- `POST /api/app/workflow-definition` - 创建流程定义
- `PUT /api/app/workflow-definition/{id}` - 更新流程定义
- `POST /api/app/workflow-definition/{id}/publish` - 发布流程定义
- `DELETE /api/app/workflow-definition/{id}` - 删除流程定义

### 流程实例API

- `POST /api/app/workflow-instance/start` - 启动流程实例
- `GET /api/app/workflow-instance` - 获取流程实例列表
- `GET /api/app/workflow-instance/{id}` - 获取流程实例详情
- `POST /api/app/workflow-instance/{id}/terminate` - 终止流程实例
- `GET /api/app/workflow-instance/{id}/history` - 获取执行历史

### 任务API

- `GET /api/app/task/my-tasks` - 获取我的待办任务
- `GET /api/app/task/{id}` - 获取任务详情
- `POST /api/app/task/{id}/claim` - 认领任务
- `POST /api/app/task/{id}/complete` - 完成任务
- `GET /api/app/task/history` - 获取任务历史

## BPMN建模器使用说明

### 基本操作

1. **添加节点**：从左侧工具栏拖拽节点到画布
2. **连接节点**：点击节点的小圆点，拖动到目标节点
3. **配置属性**：选中节点，在右侧属性面板配置
4. **删除节点**：选中节点，按 Delete 键

### 节点类型

- **StartEvent**: 开始事件
- **UserTask**: 用户任务（需要人工处理）
- **ServiceTask**: 服务任务（自动执行）
- **ExclusiveGateway**: 排他网关（根据条件选择分支）
- **ParallelGateway**: 并行网关（多分支并行执行）
- **EndEvent**: 结束事件

### UserTask配置示例

```
受理人 (Assignee): user123
候选用户 (Candidate Users): user1,user2,user3
候选组 (Candidate Groups): manager,admin
表单标识 (Form Key): leave-form
```

### SequenceFlow条件表达式示例

```javascript
${approved == true}
${amount > 10000}
${status == 'approved' && days <= 3}
```

## 常见问题

### 1. 代理配置不生效

确保 `config/proxy.ts` 中的配置正确，并且后端服务已启动。

### 2. BPMN属性面板不显示

检查是否正确安装了 `bpmn-js-properties-panel` 和 `camunda-bpmn-moddle`。

### 3. 样式问题

确保在组件中正确导入了BPMN相关的CSS文件：

```typescript
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js-properties-panel/dist/assets/properties-panel.css';
```

### 4. TypeScript类型错误

如果遇到类型错误，可以在 `src/typings.d.ts` 中添加类型声明：

```typescript
declare module 'bpmn-js/lib/Modeler';
declare module 'bpmn-js/lib/Viewer';
declare module 'bpmn-moddle';
```

## 后续优化建议

1. **表单集成**: 集成动态表单引擎，支持任务表单配置
2. **权限控制**: 集成ABP权限系统，控制菜单和操作权限
3. **流程模板**: 提供常用流程模板，快速创建流程
4. **流程版本管理**: 支持流程版本回滚和对比
5. **流程统计**: 添加流程执行统计和分析图表
6. **Web Hook**: 支持流程事件通知
7. **移动端适配**: 支持移动端审批

## 相关文档

- [Ant Design Pro 文档](https://pro.ant.design/)
- [Umi 文档](https://umijs.org/)
- [bpmn-js 文档](https://bpmn.io/toolkit/bpmn-js/)
- [ABP Framework 文档](https://docs.abp.io/)

## 许可证

MIT
