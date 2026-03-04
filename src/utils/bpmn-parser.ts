import BpmnModdle from 'bpmn-moddle';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';

// 确保正确导入（处理 CommonJS 和 ES6 模块）
const ModdleConstructor = (BpmnModdle as any).default || BpmnModdle;

export interface ProcessDefinition {
  startEventId: string;
  elements: ProcessElement[];
  sequenceFlows: SequenceFlow[];
}

export interface ProcessElement {
  id: string;
  name?: string;
  type: string;
  properties: Record<string, any>;
  incoming: string[];
  outgoing: string[];
}

export interface SequenceFlow {
  id: string;
  sourceRef: string;
  targetRef: string;
  condition?: string;
}

export class BpmnParser {
  private moddle: any;

  constructor() {
    try {
      this.moddle = new ModdleConstructor({
        camunda: camundaModdleDescriptor,
      });
    } catch (error) {
      console.error('初始化 BpmnModdle 失败:', error);
      throw error;
    }
  }

  async parse(bpmnXml: string): Promise<ProcessDefinition> {
    try {
      if (!this.moddle || !this.moddle.fromXML) {
        throw new Error('BpmnModdle 未正确初始化');
      }
      
      // bpmn-moddle v6 使用回调函数而不是 Promise
      const result = await new Promise<any>((resolve, reject) => {
        this.moddle.fromXML(bpmnXml, (err: any, definitions: any, context: any) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rootElement: definitions, warnings: context?.warnings || [] });
          }
        });
      });
      
      const definitions = result.rootElement;
      
      if (!definitions) {
        throw new Error('无法解析 BPMN XML - rootElement 为空');
      }

      // bpmn-moddle v6 中，definitions.rootElements 包含所有顶层元素
      const rootElements = definitions.rootElements || [];
      const process = rootElements.find(
        (el: any) => el.$type === 'bpmn:Process'
      );

      if (!process) {
        throw new Error('未找到流程定义');
      }

      const elements: ProcessElement[] = [];
      const sequenceFlows: SequenceFlow[] = [];
      let startEventId = '';

      // 解析流程元素
      for (const flowElement of process.flowElements || []) {
        const type = flowElement.$type.replace('bpmn:', '');

        if (type === 'SequenceFlow') {
          sequenceFlows.push({
            id: flowElement.id,
            sourceRef: flowElement.sourceRef.id,
            targetRef: flowElement.targetRef.id,
            condition: flowElement.conditionExpression?.body
          });
        } else {
          const element: ProcessElement = {
            id: flowElement.id,
            name: flowElement.name,
            type,
            properties: this.extractProperties(flowElement),
            incoming: (flowElement.incoming || []).map((f: any) => f.id),
            outgoing: (flowElement.outgoing || []).map((f: any) => f.id)
          };

          elements.push(element);

          if (type === 'StartEvent') {
            startEventId = flowElement.id;
          }
        }
      }

      return { startEventId, elements, sequenceFlows };
    } catch (error: any) {
      console.error('BPMN 解析错误:', error);
      const errorMessage = error?.message || error?.toString() || '未知错误';
      throw new Error(`解析 BPMN XML 失败: ${errorMessage}`);
    }
  }

  private extractProperties(element: any): Record<string, any> {
    const props: Record<string, any> = {};

    // 调试：打印元素信息
    if (process.env.NODE_ENV === 'development') {
      console.log('解析元素:', {
        id: element.id,
        type: element.$type,
        attrs: element.$attrs,
        loopCharacteristics: element.loopCharacteristics,
        extensionElements: element.extensionElements?.values?.map((v: any) => v.$type),
        allKeys: Object.keys(element).filter(k => !k.startsWith('$') && !k.startsWith('_'))
      });
      
      // 特别标记 ScriptTask
      if (element.$type === 'bpmn:ScriptTask') {
        console.log('🔍 发现 ScriptTask!!!', element.id, element.name);
      }
    }

    // 提取 camunda:* 属性到 properties（例如 camunda:assignee）
    const attrs = element?.$attrs || {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!key.startsWith('camunda:')) {
        continue;
      }
      // 允许空字符串，因为有些属性可能确实是空的
      if (value === undefined || value === null) {
        continue;
      }
      const propKey = key.replace('camunda:', '');
      props[propKey] = value;
    }

    const setIfValue = (key: string, value: any) => {
      if (value !== undefined && value !== null && value !== '') {
        props[key] = value;
      }
    };

    // 常用 camunda 通用属性
    setIfValue('asyncBefore', attrs['camunda:asyncBefore']);
    setIfValue('asyncAfter', attrs['camunda:asyncAfter']);
    setIfValue('exclusive', attrs['camunda:exclusive']);
    setIfValue('jobPriority', attrs['camunda:jobPriority']);
    setIfValue('taskPriority', attrs['camunda:taskPriority']);
    setIfValue('priority', attrs['camunda:priority']);

    // 条件表达式（用于网关连线逻辑）
    if (element?.conditionExpression?.body) {
      props.condition = element.conditionExpression.body;
    }

    // 提取扩展属性
    if (element.extensionElements) {
      const values = element.extensionElements.values || [];
      for (const ext of values) {
        if (ext.$type === 'camunda:Properties') {
          for (const prop of ext.properties || []) {
            props[prop.name] = prop.value;
          }
        }
        // 提取其他扩展属性
        if (ext.$type === 'camunda:InputOutput') {
          props.inputParameters = (ext.inputParameters || []).map((param: any) => ({
            name: param.name,
            value: param.value,
            definition: param.definition,
            script: param.script?.value,
            expression: param.$attrs?.['camunda:expression'],
          }));
          props.outputParameters = (ext.outputParameters || []).map((param: any) => ({
            name: param.name,
            value: param.value,
            definition: param.definition,
            script: param.script?.value,
            expression: param.$attrs?.['camunda:expression'],
          }));
        }

        if (ext.$type === 'camunda:TaskListener' || ext.$type === 'camunda:ExecutionListener') {
          const listenersKey = ext.$type === 'camunda:TaskListener' ? 'taskListeners' : 'executionListeners';
          if (!Array.isArray(props[listenersKey])) {
            props[listenersKey] = [];
          }
          props[listenersKey].push({
            event: ext.event,
            class: ext.class,
            expression: ext.expression,
            delegateExpression: ext.delegateExpression,
            script: ext.script?.value,
          });
        }
      }
    }

    // 提取 Multi Instance（多实例/并行审批）配置
    if (element.loopCharacteristics) {
      const loop = element.loopCharacteristics;
      
      // 调试：查看 loopCharacteristics 的完整内容
      if (process.env.NODE_ENV === 'development') {
        console.log('  → loopCharacteristics 详情:', {
          isSequential: loop.isSequential,
          loopCardinality: loop.loopCardinality,
          collection: loop.collection,
          elementVariable: loop.elementVariable,
          completionCondition: loop.completionCondition,
          attrs: loop.$attrs,
          allKeys: Object.keys(loop).filter(k => !k.startsWith('$') && !k.startsWith('_'))
        });
      }
      
      const multiInstance: any = {
        isSequential: loop.isSequential || false, // false = 并行，true = 串行
      };
      
      // 只添加有值的字段
      if (loop.loopCardinality?.body) {
        multiInstance.loopCardinality = loop.loopCardinality.body;
      }
      // collection 和 elementVariable 直接在 loop 对象上，不在 $attrs 里
      if (loop.collection) {
        multiInstance.collection = loop.collection;
      }
      if (loop.elementVariable) {
        multiInstance.elementVariable = loop.elementVariable;
      }
      if (loop.completionCondition?.body) {
        multiInstance.completionCondition = loop.completionCondition.body;
      }
      
      props.multiInstance = multiInstance;
    }

    // UserTask 属性
    if (element.$type === 'bpmn:UserTask') {
      const assignee = element.assignee || element.$attrs?.['camunda:assignee'];
      const candidateGroups = element.candidateGroups || element.$attrs?.['camunda:candidateGroups'];
      const candidateUsers = element.candidateUsers || element.$attrs?.['camunda:candidateUsers'];
      const formKey = element.formKey || element.$attrs?.['camunda:formKey'];
      const formRef = element.$attrs?.['camunda:formRef'];
      const formRefBinding = element.$attrs?.['camunda:formRefBinding'];
      const formRefVersion = element.$attrs?.['camunda:formRefVersion'];
      const dueDate = element.dueDate || element.$attrs?.['camunda:dueDate'];
      const followUpDate = element.$attrs?.['camunda:followUpDate'];
      const priority = element.priority || element.$attrs?.['camunda:priority'];

      if (assignee) props.assignee = assignee;
      if (candidateGroups) props.candidateGroups = candidateGroups;
      if (candidateUsers) props.candidateUsers = candidateUsers;
      if (formKey) props.formKey = formKey;
      if (formRef) props.formRef = formRef;
      if (formRefBinding) props.formRefBinding = formRefBinding;
      if (formRefVersion) props.formRefVersion = formRefVersion;
      if (dueDate) props.dueDate = dueDate;
      if (followUpDate) props.followUpDate = followUpDate;
      if (priority) props.priority = priority;
    }

    // ServiceTask 属性
    if (element.$type === 'bpmn:ServiceTask') {
      const normalizeTextValue = (value: any) => {
        if (typeof value !== 'string') {
          return value;
        }

        return value.trim().replace(/^['\"]+|['\"]+$/g, '');
      };

      const className = normalizeTextValue(element.class || element.$attrs?.['camunda:class']);
      const methodName = normalizeTextValue(element.method || element.$attrs?.['camunda:method']);
      const delegateExpression = normalizeTextValue(
        element.delegateExpression || element.$attrs?.['camunda:delegateExpression'],
      );
      const expression = normalizeTextValue(
        element.expression || element.$attrs?.['camunda:expression'],
      );
      const resultVariable = normalizeTextValue(
        element.resultVariable || element.$attrs?.['camunda:resultVariable'],
      );
      const topic = normalizeTextValue(element.topic || element.$attrs?.['camunda:topic']);
      const rawType = normalizeTextValue(element.type || element.$attrs?.['camunda:type']);
      const type = topic ? 'external' : rawType;

      const normalizeDetailsValue = (value: any) => {
        if (typeof value !== 'string') {
          return value;
        }

        const trimmed = value.trim();
        if (!trimmed) {
          return value;
        }

        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            return JSON.parse(trimmed);
          } catch {
            return value;
          }
        }

        return value;
      };

      const getImplementationType = () => {
        if (topic) return 'external';
        if (type === 'external') return 'external';
        if (className) return 'class';
        if (delegateExpression) return 'delegateExpression';
        if (expression) return 'expression';
        if (type) return type;
        return undefined;
      };

      if (className) props.class = className;
      if (methodName) props.method = methodName;
      if (delegateExpression) props.delegateExpression = delegateExpression;
      if (expression) props.expression = expression;
      if (resultVariable) props.resultVariable = resultVariable;
      if (topic) props.topic = topic;

      const implementation = getImplementationType();
      if (implementation) {
        props.implementation = implementation;
      }

      // 兼容 ServiceTask 的 details 字段（可能来自普通属性、扩展属性、field、inputParameter、documentation）
      const directDetails =
        element.details ||
        element.$attrs?.details ||
        element.$attrs?.['camunda:details'];

      if (directDetails !== undefined && directDetails !== null && directDetails !== '') {
        props.details = normalizeDetailsValue(directDetails);
      }

      if (element.documentation && !props.details) {
        const docs = Array.isArray(element.documentation)
          ? element.documentation
          : [element.documentation];
        const docText = docs
          .map((doc: any) => doc?.text || doc?.body || doc?.value || '')
          .find((value: any) => value !== undefined && value !== null && value !== '');
        if (docText) {
          props.details = normalizeDetailsValue(docText);
        }
      }

      if (element.extensionElements && !props.details) {
        const extValues = element.extensionElements.values || [];
        for (const ext of extValues) {
          if (ext.$type === 'camunda:Properties') {
            const detailProp = (ext.properties || []).find(
              (p: any) => p?.name === 'details',
            );
            if (detailProp?.value) {
              props.details = normalizeDetailsValue(detailProp.value);
              break;
            }
          }

          if (ext.$type === 'camunda:InputOutput') {
            const detailInput = (ext.inputParameters || []).find(
              (p: any) => p?.name === 'details',
            );
            const detailValue =
              detailInput?.value ||
              detailInput?.definition ||
              detailInput?.script?.value ||
              detailInput?.$attrs?.['camunda:expression'];
            if (detailValue) {
              props.details = normalizeDetailsValue(detailValue);
              break;
            }
          }

          if (ext.$type === 'camunda:Field' && ext.name === 'details') {
            const detailValue =
              ext.string ||
              ext.expression ||
              ext.stringValue ||
              ext.$body;
            if (detailValue) {
              props.details = normalizeDetailsValue(detailValue);
              break;
            }
          }
        }
      }

      // 仅在 XML 明确提供 details 时才输出 props.details，避免自动注入额外结构
    }

    // ScriptTask 属性
    if (element.$type === 'bpmn:ScriptTask') {
      console.log('🚀 解析 ScriptTask 属性，元素详情:', {
        id: element.id,
        name: element.name,
        scriptFormat: element.scriptFormat,
        script: element.script,
        attrs: element.$attrs,
        allKeys: Object.keys(element).filter(k => !k.startsWith('$') && !k.startsWith('_'))
      });
      
      // 提取脚本格式（scriptFormat）
      const scriptFormat = 
        element.scriptFormat || 
        element.$attrs?.['scriptFormat'] || 
        element.$attrs?.['camunda:scriptFormat'] || 
        'javascript'; // 默认为 javascript
      
      props.scriptFormat = scriptFormat;
      console.log('  → scriptFormat:', scriptFormat);

      // 提取脚本内容（script）
      const scriptContent = 
        element.script?.value ||  // bpmn-moddle v6+ 格式
        element.script ||         // 直接文本
        '';
      
      console.log('  → script 内容长度:', scriptContent?.length || 0);
      console.log('  → script 前100字符:', scriptContent?.substring(0, 100));
      
      if (scriptContent) {
        props.script = scriptContent;
      }

      // 提取结果变量（可选）
      const resultVariable = 
        element.resultVariable || 
        element.$attrs?.['camunda:resultVariable'];
      
      if (resultVariable) {
        props.resultVariable = resultVariable;
      }

      // 提取资源路径（可选，用于外部脚本文件）
      const resource = 
        element.resource || 
        element.$attrs?.['camunda:resource'];
      
      if (resource) {
        props.resource = resource;
      }

      // 提取 details 字段（支持 JSON 格式解析）
      const normalizeDetailsValue = (value: any) => {
        if (typeof value !== 'string') {
          return value;
        }

        const trimmed = value.trim();
        if (!trimmed) {
          return value;
        }

        // 尝试解析 JSON 格式
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            return JSON.parse(trimmed);
          } catch {
            return value;
          }
        }

        return value;
      };

      // 从直接属性提取 details
      const directDetails =
        element.details ||
        element.$attrs?.details ||
        element.$attrs?.['camunda:details'];

      if (directDetails !== undefined && directDetails !== null && directDetails !== '') {
        props.details = normalizeDetailsValue(directDetails);
        console.log('  → details (直接属性):', props.details);
      }

      // 从 documentation 提取 details（如果直接属性没有）
      if (element.documentation && !props.details) {
        const docs = Array.isArray(element.documentation)
          ? element.documentation
          : [element.documentation];
        const docText = docs
          .map((doc: any) => doc?.text || doc?.body || doc?.value || '')
          .find((value: any) => value !== undefined && value !== null && value !== '');
        if (docText) {
          props.details = normalizeDetailsValue(docText);
          console.log('  → details (documentation):', props.details);
        }
      }

      // 从扩展元素提取 details（如果前面没有）
      if (element.extensionElements && !props.details) {
        const extValues = element.extensionElements.values || [];
        for (const ext of extValues) {
          // 从 camunda:Properties 提取
          if (ext.$type === 'camunda:Properties') {
            const detailProp = (ext.properties || []).find(
              (p: any) => p?.name === 'details',
            );
            if (detailProp?.value) {
              props.details = normalizeDetailsValue(detailProp.value);
              console.log('  → details (Properties):', props.details);
              break;
            }
          }

          // 从 camunda:InputOutput 提取
          if (ext.$type === 'camunda:InputOutput') {
            const detailInput = (ext.inputParameters || []).find(
              (p: any) => p?.name === 'details',
            );
            const detailValue =
              detailInput?.value ||
              detailInput?.definition ||
              detailInput?.script?.value ||
              detailInput?.$attrs?.['camunda:expression'];
            if (detailValue) {
              props.details = normalizeDetailsValue(detailValue);
              console.log('  → details (InputOutput):', props.details);
              break;
            }
          }

          // 从 camunda:Field 提取
          if (ext.$type === 'camunda:Field' && ext.name === 'details') {
            const detailValue =
              ext.string ||
              ext.expression ||
              ext.stringValue ||
              ext.$body;
            if (detailValue) {
              props.details = normalizeDetailsValue(detailValue);
              console.log('  → details (Field):', props.details);
              break;
            }
          }
        }
      }
    }

    // Gateway 属性（并行网关、排他网关等）
    if (element.$type === 'bpmn:ParallelGateway' || 
        element.$type === 'bpmn:ExclusiveGateway' || 
        element.$type === 'bpmn:InclusiveGateway' ||
        element.$type === 'bpmn:EventBasedGateway') {
      const defaultFlow = element.default?.id;
      if (defaultFlow) props.defaultFlow = defaultFlow;
    }

    // 调试：打印最终提取的 properties
    if (process.env.NODE_ENV === 'development' && Object.keys(props).length > 0) {
      console.log('  → 提取的 properties:', props);
    }

    return props;
  }
}
