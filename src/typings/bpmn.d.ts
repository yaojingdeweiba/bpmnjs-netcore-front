// BPMN相关类型声明
declare module 'bpmn-moddle' {
  export default class BpmnModdle {
    constructor(options?: any);
    fromXML(xml: string, callback: (err: any, definitions: any, context: any) => void): void;
    fromXML(xml: string, typeName: string, callback: (err: any, definitions: any, context: any) => void): void;
    toXML(element: any, options?: any): Promise<{ xml: string }>;
  }
}

declare module 'bpmn-js/lib/Modeler' {
  export default class Modeler {
    constructor(options: any);
    importXML(xml: string): Promise<{ warnings: any[] }>;
    saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
    saveSVG(): Promise<{ svg: string }>;
    get(name: string): any;
    on(event: string, callback: () => void): void;
    destroy(): void;
  }
}

declare module 'bpmn-js/lib/Viewer' {
  export default class Viewer {
    constructor(options: any);
    importXML(xml: string): Promise<{ warnings: any[] }>;
    get(name: string): any;
    destroy(): void;
  }
}

declare module 'bpmn-js-properties-panel' {
  export const BpmnPropertiesPanelModule: any;
  export const BpmnPropertiesProviderModule: any;
  export const CamundaPlatformPropertiesProviderModule: any;
}

declare module 'camunda-bpmn-moddle/resources/camunda.json' {
  const content: any;
  export default content;
}
