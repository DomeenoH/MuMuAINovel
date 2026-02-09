import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Space, Tag } from 'antd';
import { ArrowLeftOutlined, RocketOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { WORKFLOWS } from '../config/workflowConfig';

const { Title, Paragraph, Text } = Typography;

export default function WorkflowSelector() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg-base)' }}>
      {/* 顶部标题栏 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: 'var(--shadow-header)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '16px 24px',
        }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size={isMobile ? 'middle' : 'large'}
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
            }}
          >
            {isMobile ? '返回' : '返回首页'}
          </Button>

          <Title level={isMobile ? 4 : 2} style={{
            margin: 0,
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            结构化写作向导
          </Title>

          <div style={{ width: isMobile ? 60 : 120 }} />
        </div>
      </div>

      {/* 入口选择 */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: isMobile ? '16px 12px' : '32px 24px',
      }}>
        {/* 快速创建入口 */}
        <Card
          hoverable
          style={{ marginBottom: 24, borderWidth: 2 }}
          onClick={() => navigate('/wizard/new')}
        >
          <Row align="middle" gutter={16}>
            <Col flex="auto">
              <Space>
                <RocketOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>AI 快速创建</Title>
                  <Text type="secondary">填写基本信息，AI 自动生成世界观、角色和大纲</Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Tag color="blue">推荐新手</Tag>
            </Col>
          </Row>
        </Card>

        <Title level={4} style={{ marginBottom: 16 }}>
          <ThunderboltOutlined /> 结构化创作流程
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          选择一个创作方法论，按步骤完成从灵感到大纲的完整创作流程
        </Paragraph>

        {/* 工作流列表 */}
        <Row gutter={[16, 16]}>
          {WORKFLOWS.map(workflow => (
            <Col xs={24} sm={12} key={workflow.id}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderColor: workflow.color,
                  borderWidth: 2,
                }}
                onClick={() => navigate(`/wizard/structured/${workflow.id}`)}
              >
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 40 }}>{workflow.icon}</span>
                </div>
                <Title level={4} style={{ color: workflow.color, marginBottom: 8 }}>
                  {workflow.name}
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  {workflow.description}
                </Paragraph>
                <div>
                  <Tag color={workflow.color}>{workflow.steps.length} 个步骤</Tag>
                  {workflow.id === 'dark-duoziduofu' && <Tag color="red">18+</Tag>}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
