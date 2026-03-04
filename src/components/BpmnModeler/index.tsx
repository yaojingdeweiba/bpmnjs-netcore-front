import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';

// 导入属性面板模块（ v0.46.0 版本的导入方式）
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';

// 导入样式
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css';
import './styles.less';

interface BpmnModelerProps {
  xml?: string;
  onXmlChange?: (xml: string) => void;
  height?: string | number;
}

export interface BpmnModelerRef {
  getXML: () => Promise<string>;
  getSVG: () => Promise<string>;
  importXML: (xml: string) => Promise<void>;
}

const emptyBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds x="186" y="202" width="22" height="14"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const BpmnModelerComponent = forwardRef<BpmnModelerRef, BpmnModelerProps>(
  ({ xml, onXmlChange, height = '100%' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const propertiesRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<BpmnModeler | null>(null);
    const isImportingRef = useRef(false);
    const lastImportedXmlRef = useRef<string>('');

    // 安全的导入函数
    const safeImportXML = async (xmlToImport: string) => {
      if (!modelerRef.current || isImportingRef.current) {
        console.log('⏭️ 跳过导入：modeler未就绪或正在导入中');
        return;
      }

      // 如果XML相同，跳过导入
      if (xmlToImport === lastImportedXmlRef.current) {
        console.log('⏭️ 跳过导入：XML内容相同');
        return;
      }

      console.log('📥 开始导入 XML，长度:', xmlToImport?.length || 0);
      isImportingRef.current = true;
      try {
        await modelerRef.current.importXML(xmlToImport);
        const canvas = modelerRef.current.get('canvas') as any;
        canvas.zoom('fit-viewport');
        lastImportedXmlRef.current = xmlToImport;
        console.log('✅ XML 导入成功');
      } catch (err: any) {
        console.error('❌ 导入 BPMN 失败:', err);
      } finally {
        isImportingRef.current = false;
      }
    };

    // 初始化 Modeler（只运行一次）
    useEffect(() => {
      if (!containerRef.current || !propertiesRef.current) return;

      const bpmnModeler = new BpmnModeler({
        container: containerRef.current,
        propertiesPanel: {
          parent: propertiesRef.current,
        },
        additionalModules: [
          propertiesPanelModule,
          propertiesProviderModule,
        ],
        moddleExtensions: {
          camunda: camundaModdleDescriptor,
        },
        keyboard: {
          bindTo: document,
        },
      });

      modelerRef.current = bpmnModeler;

      // 导入初始 XML（异步执行，不阻塞）
      const initialXml = xml || emptyBpmn;
      setTimeout(() => {
        safeImportXML(initialXml);
      }, 0);

      // 监听变化
      bpmnModeler.on('commandStack.changed', () => {
        if (onXmlChange) {
          bpmnModeler.saveXML({ format: true }).then((result: any) => {
            onXmlChange(result.xml);
          });
        }
      });

      return () => {
        isImportingRef.current = false;
        lastImportedXmlRef.current = '';
        bpmnModeler.destroy();
        modelerRef.current = null;
      };
    }, []);

    // 当外部 XML 变化时重新导入
    useEffect(() => {
      if (xml && modelerRef.current) {
        console.log('🔄 检测到外部 XML 更新，长度:', xml?.length || 0);
        safeImportXML(xml);
      }
    }, [xml]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getXML: async () => {
        if (!modelerRef.current) {
          throw new Error('建模器未初始化');
        }
        const { xml: bpmnXml } = await modelerRef.current.saveXML({ format: true });
        return bpmnXml || '';
      },
      getSVG: async () => {
        if (!modelerRef.current) {
          throw new Error('建模器未初始化');
        }
        const { svg } = await modelerRef.current.saveSVG();
        return svg;
      },
      importXML: async (xmlStr: string) => {
        await safeImportXML(xmlStr);
      },
    }));

    return (
      <div className="bpmn-modeler-container" style={{ height }}>
        <div className="bpmn-canvas" ref={containerRef} />
        <div className="bpmn-properties-panel" ref={propertiesRef} />
      </div>
    );
  },
);

export default BpmnModelerComponent;
