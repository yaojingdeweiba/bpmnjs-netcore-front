import React, { useEffect, useRef, useState } from 'react';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import './styles.less';

interface BpmnViewerProps {
  xml: string;
  height?: string | number;
  highlightedElements?: string[]; // 高亮的元素 ID（用于流程监控）
  completedElements?: string[]; // 已完成的元素 ID
}

const BpmnViewerComponent: React.FC<BpmnViewerProps> = ({
  xml,
  height = '100%',
  highlightedElements = [],
  completedElements = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<BpmnViewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const bpmnViewer = new BpmnViewer({
      container: containerRef.current,
    });

    setViewer(bpmnViewer);

    return () => {
      bpmnViewer.destroy();
    };
  }, []);

  useEffect(() => {
    if (viewer && xml) {
      viewer
        .importXML(xml)
        .then(() => {
          const canvas = viewer.get('canvas') as any;
          canvas.zoom('fit-viewport');

          // 清除之前的标记
          const elementRegistry = viewer.get('elementRegistry') as any;
          const elements = elementRegistry.getAll();
          elements.forEach((element: any) => {
            canvas.removeMarker(element.id, 'highlight');
            canvas.removeMarker(element.id, 'completed');
          });

          // 高亮当前元素
          if (highlightedElements.length > 0) {
            const overlays = viewer.get('overlays') as any;

            highlightedElements.forEach((elementId) => {
              const element = elementRegistry.get(elementId);
              if (element) {
                canvas.addMarker(elementId, 'highlight');

                // 添加覆盖层标记
                try {
                  overlays.add(elementId, {
                    position: { top: -12, right: 12 },
                    html: '<div class="bpmn-badge bpmn-badge-current">当前</div>',
                  });
                } catch (e) {
                  console.warn('添加覆盖层失败:', e);
                }
              }
            });
          }

          // 标记已完成元素
          if (completedElements.length > 0) {
            completedElements.forEach((elementId) => {
              const element = elementRegistry.get(elementId);
              if (element) {
                canvas.addMarker(elementId, 'completed');
              }
            });
          }
        })
        .catch((err: any) => {
          console.error('导入 BPMN 失败:', err);
        });
    }
  }, [xml, viewer, highlightedElements, completedElements]);

  return (
    <div className="bpmn-viewer-container" style={{ height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default BpmnViewerComponent;
