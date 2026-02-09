import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Steps, Button, Typography, Space, message, Spin,
  Row, Col, Input, List, Tag, Empty, Divider, Form, Alert
} from 'antd';
import {
  ArrowLeftOutlined, ArrowRightOutlined,
  SaveOutlined, RobotOutlined
} from '@ant-design/icons';
import { getWorkflowById, type Workflow, type WorkflowStep } from '../config/workflowConfig';
import { parsePromptSlots, resolvePrompt, validateVariables, extractOutputVariables, type ParsedVariable } from '../utils/promptParser';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  prompt_content: string;
  category: string;
  tags: string[];
}

interface StepResult {
  stepId: string;
  templateId?: string;
  templateName?: string;
  variables?: Record<string, string>;
  aiOutput?: string;
  completed: boolean;
}

// 工作流上下文，用于保存各步骤的输出供后续步骤使用
interface WorkflowContext {
  [key: string]: string;
}

export default function StructuredWizard() {
  const navigate = useNavigate();
  const { workflowId } = useParams<{ workflowId: string }>();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // 新增状态
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [parsedVariables, setParsedVariables] = useState<ParsedVariable[]>([]);
  const [expectedOutputs, setExpectedOutputs] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [workflowContext, setWorkflowContext] = useState<WorkflowContext>({});
  const [aiOutput, setAiOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionPhase, setExecutionPhase] = useState<'select' | 'input' | 'execute' | 'result' | 'form'>('select');
  
  // 纯表单步骤的表单值
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 加载工作流配置
  useEffect(() => {
    if (workflowId) {
      const wf = getWorkflowById(workflowId);
      if (wf) {
        setWorkflow(wf);
        setStepResults(wf.steps.map(s => ({
          stepId: s.id,
          completed: false
        })));
      } else {
        message.error('未找到该工作流');
        navigate('/wizard/structured');
      }
    }
  }, [workflowId, navigate]);

  // 加载当前步骤的模板或进入表单模式
  useEffect(() => {
    if (workflow && workflow.steps[currentStepIndex]) {
      const step = workflow.steps[currentStepIndex];
      
      // 根据步骤类型决定行为
      if (step.type === 'form') {
        // 纯表单步骤：直接进入表单模式
        setExecutionPhase('form');
        setSelectedTemplate(null);
        // 从 context 预填已有值
        const prefilled: Record<string, string> = {};
        step.fields?.forEach(field => {
          if (workflowContext[field.name]) {
            prefilled[field.name] = workflowContext[field.name];
          }
        });
        setFormValues(prefilled);
      } else {
        // AI 执行步骤：加载模板
        fetchTemplates(step);
        setExecutionPhase('select');
        setSelectedTemplate(null);
        setAiOutput('');
      }
    }
  }, [workflow, currentStepIndex, workflowContext]);

  const fetchTemplates = async (step: WorkflowStep) => {
    setLoadingTemplates(true);
    try {
      const response = await fetch(`/api/prompt-workshop/items?limit=600`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const allItems = data.data?.items || data.items || [];
        
        // 按 category 筛选
        const category = step.templateCategory || '';
        let filtered = allItems.filter((t: TemplateItem) => 
          t.category?.includes(category) ||
          category.includes(t.category || '') ||
          t.category === category
        );
        
        // keyword 进一步筛选
        if (step.templateKeywords && step.templateKeywords.length > 0 && filtered.length > 5) {
          const keywordFiltered = filtered.filter((t: TemplateItem) =>
            step.templateKeywords!.some((kw: string) =>
              t.name?.includes(kw) || t.description?.includes(kw)
            )
          );
          if (keywordFiltered.length > 0) {
            filtered = keywordFiltered;
          }
        }
        
        setTemplates(filtered.length > 0 ? filtered.slice(0, 12) : allItems.slice(0, 8));
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // 选择模板后解析输入/输出插槽
  const handleSelectTemplate = useCallback((template: TemplateItem) => {
    setSelectedTemplate(template);
    
    // 使用新的 parsePromptSlots 区分输入/输出
    const slots = parsePromptSlots(template.prompt_content);
    setParsedVariables(slots.inputSlots);  // 只使用输入插槽作为表单字段
    setExpectedOutputs(slots.outputSlots); // 记录预期输出变量
    
    // 尝试从上下文自动填充变量
    const autoFilled: Record<string, string> = {};
    slots.inputSlots.forEach(v => {
      if (workflowContext[v.name]) {
        autoFilled[v.name] = workflowContext[v.name];
      }
    });
    setVariableValues(autoFilled);
    setExecutionPhase('input');
  }, [workflowContext]);

  // 执行 AI 对话
  const executePrompt = async () => {
    if (!selectedTemplate) return;
    
    // 验证变量
    const validation = validateVariables(parsedVariables, variableValues);
    if (!validation.valid) {
      message.warning(`请填写必需字段：${validation.missing.join('、')}`);
      return;
    }
    
    setIsExecuting(true);
    setExecutionPhase('execute');
    setAiOutput('');
    
    try {
      // 解析 prompt，替换变量
      const resolvedPrompt = resolvePrompt(selectedTemplate.prompt_content, variableValues);
      
      // 构造用户消息（变量值的摘要）
      const userMessage = Object.entries(variableValues)
        .map(([key, value]) => `【${key}】:\n${value}`)
        .join('\n\n');
      
      // 调用 AI API（流式）
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [
            { role: 'system', content: resolvedPrompt },
            { role: 'user', content: userMessage || '请开始执行任务' }
          ],
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error('AI 请求失败');
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');
      
      const decoder = new TextDecoder();
      let fullOutput = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // 解析 SSE 格式
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullOutput += data.content;
                setAiOutput(fullOutput);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
      
      setExecutionPhase('result');
      message.success('AI 执行完成！');
      
    } catch (error) {
      console.error('执行失败:', error);
      message.error('AI 执行失败，请重试');
      setExecutionPhase('input');
    } finally {
      setIsExecuting(false);
    }
  };

  // 保存输出到上下文并进入下一步
  const saveAndNext = () => {
    if (!workflow) return;
    
    const newContext = { ...workflowContext };
    const currentStep = workflow.steps[currentStepIndex];
    
    if (currentStep) {
      // 保存完整输出
      newContext[`${currentStep.id}_output`] = aiOutput;
      
      // 使用 extractOutputVariables 提取预期输出变量
      const extracted = extractOutputVariables(aiOutput, expectedOutputs);
      Object.assign(newContext, extracted);
    }
    
    setWorkflowContext(newContext);
    
    // 更新步骤结果
    const newResults = [...stepResults];
    newResults[currentStepIndex] = {
      stepId: currentStep?.id || '',
      templateId: selectedTemplate?.id,
      templateName: selectedTemplate?.name,
      variables: variableValues,
      aiOutput,
      completed: true
    };
    setStepResults(newResults);
    
    // 进入下一步
    if (currentStepIndex < workflow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleFinish();
    }
  };

  // 保存纯表单步骤的值到上下文
  const saveFormAndNext = () => {
    if (!workflow) return;
    
    const currentStep = workflow.steps[currentStepIndex];
    if (!currentStep) return;
    
    // 验证必填字段
    const missingFields: string[] = [];
    currentStep.fields?.forEach(field => {
      if (field.required && !formValues[field.name]?.trim()) {
        missingFields.push(field.label);
      }
    });
    
    if (missingFields.length > 0) {
      message.warning(`请填写必填字段：${missingFields.join('、')}`);
      return;
    }
    
    // 保存到上下文
    const newContext = { ...workflowContext, ...formValues };
    setWorkflowContext(newContext);
    
    // 更新步骤结果
    const newResults = [...stepResults];
    newResults[currentStepIndex] = {
      stepId: currentStep.id,
      variables: formValues,
      completed: true
    };
    setStepResults(newResults);
    
    message.success(`${currentStep.name} 已保存！`);
    
    // 进入下一步
    if (currentStepIndex < workflow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkipStep = () => {
    if (!workflow) return;
    const currentStep = workflow.steps[currentStepIndex];
    
    if (currentStep?.isOptional) {
      const newResults = [...stepResults];
      newResults[currentStepIndex] = {
        stepId: currentStep.id,
        completed: true
      };
      setStepResults(newResults);
      
      if (currentStepIndex < workflow.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const handleFinish = async () => {
    try {
      // 从 workflowContext 中提取项目信息
      const projectTitle = workflowContext['project_brief'] 
        ? `${workflow?.name || '替身文'}项目` 
        : `${workflow?.name || '新项目'} - ${new Date().toLocaleDateString()}`;
      
      const projectData = {
        title: projectTitle,
        description: workflowContext['project_brief'] || workflowContext['inspiration_pool'] || '',
        theme: workflowContext['substitute_theme_positioning'] || workflow?.name || '',
        genre: '替身文',
      };
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(projectData),
      });
      
      if (response.ok) {
        const project = await response.json();
        message.success('🎉 工作流完成！项目已保存');
        navigate(`/projects/${project.id}`);
      } else {
        throw new Error('保存项目失败');
      }
    } catch (error) {
      console.error('保存项目失败:', error);
      message.warning('工作流完成，但项目保存失败');
      navigate('/');
    }
  };


  const currentStep = workflow?.steps[currentStepIndex];

  if (!workflow) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg-base)' }}>
      {/* 顶部标题栏 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: workflow.color,
        boxShadow: 'var(--shadow-header)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: isMobile ? '12px 16px' : '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/wizard/structured')}
            style={{ color: '#fff' }}
          >
            返回选择
          </Button>
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            {workflow.icon} {workflow.name}
          </Title>
          <div style={{ width: 100 }} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {/* 步骤进度条 */}
        <Card style={{ marginBottom: 24 }}>
          <Steps
            current={currentStepIndex}
            size={isMobile ? 'small' : 'default'}
            direction={isMobile ? 'vertical' : 'horizontal'}
          >
            {workflow.steps.map((step, index) => (
              <Step
                key={step.id}
                title={step.name}
                description={isMobile ? undefined : step.description}
                status={
                  stepResults[index]?.completed ? 'finish' :
                  index === currentStepIndex ? 'process' : 'wait'
                }
              />
            ))}
          </Steps>
        </Card>

        {/* 当前步骤内容 */}
        <Card>
          <Title level={4}>
            {workflow.icon} 第 {currentStepIndex + 1} 步: {currentStep?.name}
          </Title>
          <Paragraph type="secondary">{currentStep?.description}</Paragraph>
          
          <Divider />

          {/* Phase 1: 选择模板 */}
          {executionPhase === 'select' && (
            <>
              <Title level={5}>选择 Prompt 模板</Title>
              {loadingTemplates ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin tip="加载模板中..." />
                </div>
              ) : templates.length === 0 ? (
                <Empty description="暂无匹配的模板" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
                  dataSource={templates}
                  renderItem={template => (
                    <List.Item>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => handleSelectTemplate(template)}
                        style={{ height: '100%' }}
                      >
                        <Card.Meta
                          title={<Text strong style={{ fontSize: 14 }}>{template.name}</Text>}
                          description={
                            <div>
                              <Paragraph
                                type="secondary"
                                ellipsis={{ rows: 2 }}
                                style={{ fontSize: 12, marginBottom: 8 }}
                              >
                                {template.description}
                              </Paragraph>
                              <Space size={4} wrap>
                                {template.tags?.slice(0, 3).map(tag => (
                                  <Tag key={tag} style={{ fontSize: 11 }}>{tag}</Tag>
                                ))}
                              </Space>
                            </div>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              )}
              
              {currentStep?.isOptional && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Button onClick={handleSkipStep}>跳过此步骤</Button>
                </div>
              )}
            </>
          )}

          {/* 纯表单步骤 */}
          {executionPhase === 'form' && currentStep?.fields && (
            <>
              <Alert
                message="请填写以下信息"
                description="这些信息将作为后续 AI 创作的基础输入"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              
              <Form layout="vertical">
                {currentStep.fields.map(field => (
                  <Form.Item
                    key={field.name}
                    label={
                      <Space>
                        <Text strong>{field.label}</Text>
                        {field.required && <Text type="danger">*</Text>}
                      </Space>
                    }
                    help={field.description}
                  >
                    {field.type === 'textarea' ? (
                      <TextArea
                        rows={4}
                        placeholder={field.placeholder}
                        value={formValues[field.name] || ''}
                        onChange={e => setFormValues(prev => ({
                          ...prev,
                          [field.name]: e.target.value
                        }))}
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={formValues[field.name] || ''}
                        onChange={e => setFormValues(prev => ({
                          ...prev,
                          [field.name]: e.target.value
                        }))}
                      />
                    )}
                  </Form.Item>
                ))}
              </Form>
              
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={saveFormAndNext}
                >
                  保存并继续下一步
                </Button>
              </div>
            </>
          )}

          {/* Phase 2: 填写变量 */}
          {executionPhase === 'input' && selectedTemplate && (
            <>
              <Alert
                message={`使用模板: ${selectedTemplate.name}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button size="small" onClick={() => setExecutionPhase('select')}>
                    更换模板
                  </Button>
                }
              />
              
              <Title level={5}>填写输入变量</Title>
              
              {parsedVariables.length === 0 ? (
                <Alert
                  message="此模板无需填写变量"
                  description="可以直接执行 AI 对话"
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Form layout="vertical">
                  {parsedVariables.map(variable => (
                    <Form.Item
                      key={variable.name}
                      label={
                        <Space>
                          <Text strong>{variable.displayName}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>({variable.name})</Text>
                        </Space>
                      }
                      help={variable.description}
                      required={variable.required}
                    >
                      {variable.type === 'textarea' || variable.type === 'json' ? (
                        <TextArea
                          rows={4}
                          placeholder={`请输入${variable.displayName}...`}
                          value={variableValues[variable.name] || ''}
                          onChange={e => setVariableValues(prev => ({
                            ...prev,
                            [variable.name]: e.target.value
                          }))}
                        />
                      ) : (
                        <Input
                          placeholder={`请输入${variable.displayName}...`}
                          value={variableValues[variable.name] || ''}
                          onChange={e => setVariableValues(prev => ({
                            ...prev,
                            [variable.name]: e.target.value
                          }))}
                        />
                      )}
                      {workflowContext[variable.name] && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setVariableValues(prev => ({
                            ...prev,
                            [variable.name]: workflowContext[variable.name]
                          }))}
                        >
                          从上下文填充
                        </Button>
                      )}
                    </Form.Item>
                  ))}
                </Form>
              )}
              
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<RobotOutlined />}
                  onClick={executePrompt}
                  loading={isExecuting}
                >
                  🚀 执行 AI 对话
                </Button>
              </div>
            </>
          )}

          {/* Phase 3: 执行中 */}
          {executionPhase === 'execute' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Spin size="large" tip="AI 正在思考中..." />
              </div>
              
              {aiOutput && (
                <>
                  <Title level={5}>AI 输出 (实时)</Title>
                  <Card
                    style={{
                      background: '#f5f5f5',
                      maxHeight: 400,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      fontFamily: 'monospace',
                      fontSize: 13
                    }}>
                      {aiOutput}
                    </pre>
                  </Card>
                </>
              )}
            </>
          )}

          {/* Phase 4: 结果展示 */}
          {executionPhase === 'result' && (
            <>
              <Alert
                message="AI 执行完成！"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Title level={5}>AI 输出结果</Title>
              <Card
                style={{
                  background: '#f5f5f5',
                  maxHeight: 500,
                  overflow: 'auto',
                  marginBottom: 24
                }}
              >
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: 13
                }}>
                  {aiOutput}
                </pre>
              </Card>
              
              <Row gutter={16} justify="center">
                <Col>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setExecutionPhase('input')}
                  >
                    重新填写
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveAndNext}
                  >
                    保存并进入下一步 <ArrowRightOutlined />
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Card>

        {/* 上下文预览（调试用，可选显示） */}
        {Object.keys(workflowContext).length > 0 && (
          <Card title="工作流上下文" size="small" style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              已保存 {Object.keys(workflowContext).length} 个变量，可供后续步骤使用
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}
