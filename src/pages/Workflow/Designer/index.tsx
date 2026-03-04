import React, { useEffect, useRef, useState } from 'react';
import { useParams, history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import { Button, message, Card } from 'antd';
import { SaveOutlined, SendOutlined, RollbackOutlined } from '@ant-design/icons';
import BpmnModeler, { BpmnModelerRef } from '@/components/BpmnModeler';
import { BpmnParser } from '@/utils/bpmn-parser';
import {
  getWorkflowDefinition,
  getWorkflowDraft,
  saveWorkflowDraft,
  publishWorkflowDraft,
} from '@/services/workflow/definition';

const Designer: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const modelerRef = useRef<BpmnModelerRef>(null);
  const [loading, setLoading] = useState(false);
  const [currentXml, setCurrentXml] = useState<string>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReadOnlyPublished, setIsReadOnlyPublished] = useState(false);
  const skipLoadRef = useRef(false); // 用于跳过首次保存后的重新加载

  useEffect(() => {
    if (id) {
      console.log('🎯 检测到 ID 变化:', id, '是否跳过加载:', skipLoadRef.current);
      setIsEditMode(true);
      // 如果是首次保存后跳转，跳过加载
      if (skipLoadRef.current) {
        console.log('⏭️ 跳过草稿加载（首次保存后跳转）');
        skipLoadRef.current = false;
        return;
      }
      loadDefinition(id);
    }
  }, [id]);

  const loadDefinition = async (definitionId: string) => {
    console.log('📂 开始加载草稿，ID:', definitionId);
    setLoading(true);
    try {
      const draft = await getWorkflowDraft(definitionId);
      console.log('✅ 草稿加载成功，XML 长度:', draft.bpmnXml?.length || 0);
      setCurrentXml(draft.bpmnXml);
    } catch (error: any) {
      try {
        const published = await getWorkflowDefinition(definitionId);
        if (published?.isPublished) {
          setIsReadOnlyPublished(true);
          message.info('已发布版本为只读，已切换到查看页面');
          history.replace(`/workflow/viewer/${definitionId}`);
          return;
        }
      } catch {
      }
      message.error('加载草稿失败: ' + (error?.message || error?.toString?.() || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isReadOnlyPublished) {
      message.warning('已发布版本只允许查看，请基于草稿进行修改');
      return;
    }

    if (!modelerRef.current) {
      message.error('建模器未初始化');
      return;
    }

    setLoading(true);
    try {
      const xml = await modelerRef.current.getXML();
      console.log('💾 准备保存，XML 长度:', xml?.length || 0);

      // 立即更新 currentXml，避免后续操作触发不必要的重新导入
      setCurrentXml(xml);
      console.log('✅ currentXml 已更新');

      // 解析 BPMN
      const parser = new BpmnParser();
      const processDefinition = await parser.parse(xml);
      
      // 调试：打印解析结果
      console.log('解析后的流程定义:', JSON.stringify(processDefinition, null, 2));
      
      // 从 BPMN XML 中提取流程信息
      const moddleParser = new DOMParser();
      const xmlDoc = moddleParser.parseFromString(xml, 'text/xml');
      const processElement = xmlDoc.querySelector('process, bpmn\\:process, bpmn2\\:process');
      
      if (!processElement) {
        message.error('未找到流程定义，请先在设计器中绘制流程');
        return;
      }
console.log('找到的 process 元素:', processElement);
      const processId = processElement.getAttribute('id');
      const processName = processElement.getAttribute('name')  || processId || 'Unnamed Process';
      const versionTag=processElement.getAttribute('camunda:versionTag') || '1.0';
      // 从扩展属性中获取 description 和 category（如果有的话）
      const documentation = xmlDoc.querySelector('documentation, bpmn\\:documentation');
      const description = documentation?.textContent?.trim() || '';
      
      // 可以从 extensionElements 中读取自定义属性
      const category = 'default'; // 默认分类

      // 新建模式下必须有 processId
      if (!id && !processId) {
        message.error('流程 ID（Key）不能为空！请执行以下步骤：\n1. 点击设计器空白处\n2. 在右侧属性面板找到"流程 ID"字段\n3. 输入唯一的流程标识（如：LeaveApproval）');
        return;
      }

      // 编辑模式下也验证 processId 的存在性，虽然不会提交
      if (id && !processId) {
        message.warning('流程 ID 为空，这可能导致问题。建议在属性面板中设置流程 ID');
      }

      const savedDraft = await saveWorkflowDraft({
        ...(id ? { id } : {}),
        definitionId: id,
          definitionKey: processId || 'default',
          serviceTypeId: processId|| 'default',
          serviceTypeName: processName|| 'Default Service',
          description: description,
          bpmnXml: xml,
          processJson: JSON.stringify(processDefinition),
          category: category,
          tags: versionTag,
          draftId: id,
      });

      console.log('✅ 保存成功，savedDraft:', savedDraft);
      message.success('草稿保存成功');
      if (!id && savedDraft?.id) {
        // 首次保存后跳转，设置标志跳过重新加载
        console.log('🔀 首次保存，准备跳转到:', `/workflow/designer/${savedDraft.id}`);
        setIsEditMode(true);
        skipLoadRef.current = true;
        history.replace(`/workflow/designer/${savedDraft.id}`);
      }
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('Key') || errorMsg.includes('key')) {
        message.error('保存失败：流程 Key 字段有误。请确保在属性面板中设置了唯一的流程 ID');
      } else {
        message.error('保存失败: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (isReadOnlyPublished) {
      message.warning('已发布版本不允许重复发布，请操作草稿版本');
      return;
    }
    if (!id) {
      message.warning('请先保存流程定义后再发布');
      return;
    }
    if (!modelerRef.current) {
      message.error('建模器未初始化');
      return;
    }
    setLoading(true);
    try {
      // 先保存当前修改
      await handleSave();
      // 再发布
      await publishWorkflowDraft(id);
      message.success('发布成功！流程定义已激活，可以创建流程实例');
      history.push('/workflow/published-list');
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('Key') || errorMsg.includes('key')) {
        message.error('发布失败：流程 Key 字段有误。请在属性面板中检查流程 ID 设置');
      } else {
        message.error('发布失败: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title={isEditMode ? '编辑流程' : '新建流程'}
      loading={loading}
      extra={[
        <Button
          key="back"
          icon={<RollbackOutlined />}
          onClick={() => history.push('/workflow/draft-list')}
        >
          返回
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          disabled={isReadOnlyPublished}
        >
          保存
        </Button>,
        <Button
          key="publish"
          type="primary"
          icon={<SendOutlined />}
          onClick={handlePublish}
          loading={loading}
          disabled={!id || isReadOnlyPublished}
        >
          发布
        </Button>,
      ]}
    >
      <Card 
        title={
          <span>
            流程设计器
            <span style={{ marginLeft: 16, fontSize: 12, color: '#999', fontWeight: 'normal' }}>
              提示：点击设计器空白处，在右侧属性面板中设置流程 ID（Key）和流程名称（Name），保存时将自动读取
            </span>
          </span>
        } 
        styles={{body: { padding: 0 }}}
      >
        <div style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
          <BpmnModeler ref={modelerRef} xml={currentXml} height="100%" />
        </div>
      </Card>
    </PageContainer>
  );
};

export default Designer;
