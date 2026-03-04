import { Button, Card, message } from 'antd';
import { useState } from 'react';
import { BpmnParser } from '@/utils/bpmn-parser';

const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="bpmn_script_demo" name="测试脚本" isExecutable="true" camunda:versionTag="v0.0.1">
    <bpmn:startEvent id="StartEvent_1" name="开始">
      <bpmn:outgoing>Flow_0vq16jr</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sequenceFlow id="Flow_0vq16jr" sourceRef="StartEvent_1" targetRef="Activity_0cfdpwl" />
    <bpmn:scriptTask id="Activity_0cfdpwl" name="测试脚本" scriptFormat="jint">
      <bpmn:incoming>Flow_0vq16jr</bpmn:incoming>
      <bpmn:outgoing>Flow_0rus8mq</bpmn:outgoing>
      <bpmn:script>execution.setVariable("user1","zzz@cn.abb.com")</bpmn:script>
    </bpmn:scriptTask>
    <bpmn:sequenceFlow id="Flow_0rus8mq" sourceRef="Activity_0cfdpwl" targetRef="Activity_0xvx5w1" />
    <bpmn:endEvent id="Event_1obm9fx">
      <bpmn:incoming>Flow_02qxoll</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_02qxoll" sourceRef="Activity_0xvx5w1" targetRef="Event_1obm9fx" />
    <bpmn:userTask id="Activity_0xvx5w1" name="人员信息" camunda:assignee="\${user1}">
      <bpmn:incoming>Flow_0rus8mq</bpmn:incoming>
      <bpmn:outgoing>Flow_02qxoll</bpmn:outgoing>
    </bpmn:userTask>
  </bpmn:process>
</bpmn:definitions>`;

export default function TestParser() {
  const [result, setResult] = useState<any>(null);

  const handleParse = async () => {
    try {
      console.log('🔥🔥🔥 开始解析 ScriptTask XML...');
      const parser = new BpmnParser();
      const parsed = await parser.parse(testXml);
      
      console.log('✅ 解析完成，结果:', parsed);
      
      // 找到 ScriptTask 元素
      const scriptTask = parsed.elements.find(el => el.type === 'ScriptTask');
      console.log('📝 ScriptTask 元素:', scriptTask);
      
      setResult(parsed);
      message.success('解析成功！请查看浏览器控制台');
    } catch (error: any) {
      console.error('❌ 解析失败:', error);
      message.error(`解析失败: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="测试 ScriptTask 解析">
        <Button type="primary" onClick={handleParse}>
          点击解析 ScriptTask XML
        </Button>
        
        {result && (
          <div style={{ marginTop: 24 }}>
            <h3>解析结果：</h3>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              maxHeight: 600,
              overflow: 'auto'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
