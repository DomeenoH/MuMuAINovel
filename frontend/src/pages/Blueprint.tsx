/**
 * 结构蓝图管理页面
 * 管理谜题线程、线索、枢纽场景、里程碑
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Tabs, Table, Button, Tag, Space, Modal, Form, Input, Select,
  message, Tooltip, Popconfirm, Statistic, Row, Col, Empty, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  BranchesOutlined, SearchOutlined, EnvironmentOutlined, FlagOutlined
} from '@ant-design/icons';
import { blueprintApi } from '../services/api';
import type {
  StructureThread, StructureClue, StructureHub, StructureMilestone, BlueprintOverview
} from '../types';

const { TextArea } = Input;
const { Option } = Select;

// 状态配置
const THREAD_STATUS = {
  pending: { label: '进行中', color: 'processing' },
  in_progress: { label: '展开中', color: 'warning' },
  revealed: { label: '已揭示', color: 'success' },
};

const CLUE_STATUS = {
  seed: { label: '种下', color: 'default' },
  verified: { label: '验证', color: 'processing' },
  payoff: { label: '回收', color: 'success' },
  red_herring: { label: '误导', color: 'error' },
};

const MILESTONE_STATUS = {
  pending: { label: '未达成', color: 'default' },
  in_progress: { label: '进行中', color: 'processing' },
  achieved: { label: '已达成', color: 'success' },
};

export default function Blueprint() {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<BlueprintOverview | null>(null);
  const [activeTab, setActiveTab] = useState('threads');
  
  // 模态框状态
  const [threadModal, setThreadModal] = useState(false);
  const [clueModal, setClueModal] = useState(false);
  const [hubModal, setHubModal] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form] = Form.useForm();

  // 加载蓝图数据
  const loadBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await blueprintApi.getOverview(projectId);
      setOverview(data);
    } catch (error) {
      console.error('加载蓝图失败:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBlueprint();
  }, [loadBlueprint]);

  // 生成下一个ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNextId = (prefix: string, items: any[]) => {
    const idKey = `${prefix.toLowerCase()}_id`;
    const nums = items.map((i: Record<string, string>) => {
      const idValue = i[idKey] || '';
      const match = idValue.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `${prefix}${String(max + 1).padStart(2, '0')}`;
  };

  // ===== Thread CRUD =====
  const handleThreadSave = async (values: any) => {
    try {
      if (currentItem) {
        await blueprintApi.updateThread(currentItem.id, values);
        message.success('线程更新成功');
      } else {
        await blueprintApi.createThread({
          ...values,
          project_id: projectId!,
          thread_id: values.thread_id || getNextId('T', overview?.threads || []),
        });
        message.success('线程创建成功');
      }
      setThreadModal(false);
      form.resetFields();
      setCurrentItem(null);
      loadBlueprint();
    } catch (error) {
      console.error('保存线程失败:', error);
    }
  };

  const deleteThread = async (id: string) => {
    try {
      await blueprintApi.deleteThread(id);
      message.success('线程删除成功');
      loadBlueprint();
    } catch (error) {
      console.error('删除线程失败:', error);
    }
  };

  // ===== Clue CRUD =====
  const handleClueSave = async (values: any) => {
    try {
      if (currentItem) {
        await blueprintApi.updateClue(currentItem.id, values);
        message.success('线索更新成功');
      } else {
        await blueprintApi.createClue({
          ...values,
          project_id: projectId!,
          clue_id: values.clue_id || getNextId('C', overview?.clues || []),
        });
        message.success('线索创建成功');
      }
      setClueModal(false);
      form.resetFields();
      setCurrentItem(null);
      loadBlueprint();
    } catch (error) {
      console.error('保存线索失败:', error);
    }
  };

  const deleteClue = async (id: string) => {
    try {
      await blueprintApi.deleteClue(id);
      message.success('线索删除成功');
      loadBlueprint();
    } catch (error) {
      console.error('删除线索失败:', error);
    }
  };

  // ===== Hub CRUD =====
  const handleHubSave = async (values: any) => {
    try {
      if (currentItem) {
        await blueprintApi.updateHub(currentItem.id, values);
        message.success('枢纽更新成功');
      } else {
        await blueprintApi.createHub({
          ...values,
          project_id: projectId!,
          hub_id: values.hub_id || getNextId('H', overview?.hubs || []),
        });
        message.success('枢纽创建成功');
      }
      setHubModal(false);
      form.resetFields();
      setCurrentItem(null);
      loadBlueprint();
    } catch (error) {
      console.error('保存枢纽失败:', error);
    }
  };

  const deleteHub = async (id: string) => {
    try {
      await blueprintApi.deleteHub(id);
      message.success('枢纽删除成功');
      loadBlueprint();
    } catch (error) {
      console.error('删除枢纽失败:', error);
    }
  };

  // ===== Milestone CRUD =====
  const handleMilestoneSave = async (values: any) => {
    try {
      if (currentItem) {
        await blueprintApi.updateMilestone(currentItem.id, values);
        message.success('里程碑更新成功');
      } else {
        await blueprintApi.createMilestone({
          ...values,
          project_id: projectId!,
          milestone_id: values.milestone_id || getNextId('M', overview?.milestones || []),
        });
        message.success('里程碑创建成功');
      }
      setMilestoneModal(false);
      form.resetFields();
      setCurrentItem(null);
      loadBlueprint();
    } catch (error) {
      console.error('保存里程碑失败:', error);
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      await blueprintApi.deleteMilestone(id);
      message.success('里程碑删除成功');
      loadBlueprint();
    } catch (error) {
      console.error('删除里程碑失败:', error);
    }
  };

  // 打开模态框
  const openModal = (type: string, item?: any) => {
    setCurrentItem(item || null);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
    }
    switch(type) {
      case 'thread': setThreadModal(true); break;
      case 'clue': setClueModal(true); break;
      case 'hub': setHubModal(true); break;
      case 'milestone': setMilestoneModal(true); break;
    }
  };

  // 列定义
  const threadColumns = [
    { title: 'ID', dataIndex: 'thread_id', width: 80 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '核心问题', dataIndex: 'core_question', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: keyof typeof THREAD_STATUS) => (
        <Badge status={THREAD_STATUS[s]?.color as any} text={THREAD_STATUS[s]?.label} />
      ),
    },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: StructureThread) => (
        <Space>
          <Tooltip title="编辑"><Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('thread', r)} /></Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => deleteThread(r.id)}>
            <Tooltip title="删除"><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const clueColumns = [
    { title: 'ID', dataIndex: 'clue_id', width: 80 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '载体', dataIndex: 'carrier', width: 150, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: keyof typeof CLUE_STATUS) => (
        <Tag color={CLUE_STATUS[s]?.color}>{CLUE_STATUS[s]?.label}</Tag>
      ),
    },
    {
      title: '误导', dataIndex: 'is_red_herring', width: 80,
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : null,
    },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: StructureClue) => (
        <Space>
          <Tooltip title="编辑"><Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('clue', r)} /></Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => deleteClue(r.id)}>
            <Tooltip title="删除"><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const hubColumns = [
    { title: 'ID', dataIndex: 'hub_id', width: 80 },
    { title: '场景名称', dataIndex: 'name', ellipsis: true },
    { title: '地点', dataIndex: 'location', ellipsis: true },
    { title: '出场频率', dataIndex: 'frequency', width: 150 },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: StructureHub) => (
        <Space>
          <Tooltip title="编辑"><Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('hub', r)} /></Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => deleteHub(r.id)}>
            <Tooltip title="删除"><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const milestoneColumns = [
    { title: 'ID', dataIndex: 'milestone_id', width: 80 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '代价', dataIndex: 'cost', ellipsis: true },
    { title: '目标章节', dataIndex: 'target_chapter', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: keyof typeof MILESTONE_STATUS) => (
        <Badge status={MILESTONE_STATUS[s]?.color as any} text={MILESTONE_STATUS[s]?.label} />
      ),
    },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: StructureMilestone) => (
        <Space>
          <Tooltip title="编辑"><Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal('milestone', r)} /></Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => deleteMilestone(r.id)}>
            <Tooltip title="删除"><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'threads',
      label: <><BranchesOutlined /> 谜题线程 ({overview?.threads.length || 0})</>,
      children: (
        <>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('thread')}>添加线程</Button>
          </div>
          <Table dataSource={overview?.threads} columns={threadColumns} rowKey="id" loading={loading}
            locale={{ emptyText: <Empty description="暂无线程" /> }} pagination={false} />
        </>
      ),
    },
    {
      key: 'clues',
      label: <><SearchOutlined /> 线索账本 ({overview?.clues.length || 0})</>,
      children: (
        <>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('clue')}>添加线索</Button>
          </div>
          <Table dataSource={overview?.clues} columns={clueColumns} rowKey="id" loading={loading}
            locale={{ emptyText: <Empty description="暂无线索" /> }} pagination={false} />
        </>
      ),
    },
    {
      key: 'hubs',
      label: <><EnvironmentOutlined /> 枢纽场景 ({overview?.hubs.length || 0})</>,
      children: (
        <>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('hub')}>添加枢纽</Button>
          </div>
          <Table dataSource={overview?.hubs} columns={hubColumns} rowKey="id" loading={loading}
            locale={{ emptyText: <Empty description="暂无枢纽" /> }} pagination={false} />
        </>
      ),
    },
    {
      key: 'milestones',
      label: <><FlagOutlined /> 里程碑 ({overview?.milestones.length || 0})</>,
      children: (
        <>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('milestone')}>添加里程碑</Button>
          </div>
          <Table dataSource={overview?.milestones} columns={milestoneColumns} rowKey="id" loading={loading}
            locale={{ emptyText: <Empty description="暂无里程碑" /> }} pagination={false} />
        </>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 统计卡片 */}
      {overview && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="线程" value={overview.stats.threads_total} suffix={`/ ${overview.stats.threads_revealed} 已揭示`} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="线索" value={overview.stats.clues_total} suffix={`/ ${overview.stats.clues_payoff} 已回收`} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="枢纽" value={overview.stats.hubs_total} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="里程碑" value={overview.stats.milestones_total} suffix={`/ ${overview.stats.milestones_achieved} 已达成`} />
            </Card>
          </Col>
          <Col span={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button icon={<ReloadOutlined spin={loading} />} onClick={loadBlueprint}>刷新</Button>
          </Col>
        </Row>
      )}

      {/* 标签页 */}
      <Card style={{ flex: 1, overflow: 'auto' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Thread 模态框 */}
      <Modal title={currentItem ? '编辑线程' : '添加线程'} open={threadModal} onCancel={() => { setThreadModal(false); setCurrentItem(null); form.resetFields(); }} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleThreadSave} initialValues={{ status: 'pending', color: '#3B82F6' }}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="thread_id" label="ID"><Input placeholder="自动生成" /></Form.Item></Col>
            <Col span={16}><Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="core_question" label="核心问题" rules={[{ required: true }]}><TextArea rows={2} /></Form.Item>
          <Form.Item name="final_answer" label="最终揭示"><TextArea rows={2} placeholder="作者备忘" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="status" label="状态"><Select><Option value="pending">进行中</Option><Option value="in_progress">展开中</Option><Option value="revealed">已揭示</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="color" label="颜色"><Input type="color" style={{ width: 80 }} /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Clue 模态框 */}
      <Modal title={currentItem ? '编辑线索' : '添加线索'} open={clueModal} onCancel={() => { setClueModal(false); setCurrentItem(null); form.resetFields(); }} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleClueSave} initialValues={{ status: 'seed', is_red_herring: false }}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="clue_id" label="ID"><Input placeholder="自动生成" /></Form.Item></Col>
            <Col span={16}><Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="carrier" label="载体"><Input placeholder="如: 信件、物证" /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="状态"><Select><Option value="seed">种下</Option><Option value="verified">验证</Option><Option value="payoff">回收</Option><Option value="red_herring">误导</Option></Select></Form.Item></Col>
          </Row>
          <Form.Item name="thread_id" label="关联线程">
            <Select allowClear placeholder="选择线程">
              {overview?.threads.map(t => <Option key={t.id} value={t.id}>{t.thread_id}: {t.title}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Hub 模态框 */}
      <Modal title={currentItem ? '编辑枢纽' : '添加枢纽'} open={hubModal} onCancel={() => { setHubModal(false); setCurrentItem(null); form.resetFields(); }} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleHubSave} initialValues={{ frequency: 'every_5_chapters' }}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="hub_id" label="ID"><Input placeholder="自动生成" /></Form.Item></Col>
            <Col span={16}><Form.Item name="name" label="场景名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="location" label="地点描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="frequency" label="出场频率">
            <Select><Option value="every_5_chapters">每5章</Option><Option value="every_10_chapters">每10章</Option><Option value="key_points">关键节点</Option></Select>
          </Form.Item>
          <Form.Item name="trading_rules" label="交易规则"><TextArea rows={2} /></Form.Item>
          <Form.Item name="taboos" label="禁忌底线"><TextArea rows={2} /></Form.Item>
          <Form.Item name="notes" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Milestone 模态框 */}
      <Modal title={currentItem ? '编辑里程碑' : '添加里程碑'} open={milestoneModal} onCancel={() => { setMilestoneModal(false); setCurrentItem(null); form.resetFields(); }} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleMilestoneSave} initialValues={{ status: 'pending' }}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="milestone_id" label="ID"><Input placeholder="自动生成" /></Form.Item></Col>
            <Col span={16}><Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="cost" label="代价"><TextArea rows={2} placeholder="达成此里程碑的代价" /></Form.Item></Col>
            <Col span={12}><Form.Item name="aftermath" label="后遗症"><TextArea rows={2} placeholder="达成后的持续影响" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="target_chapter" label="目标章节"><Input type="number" /></Form.Item></Col>
            <Col span={8}><Form.Item name="actual_chapter" label="实际章节"><Input type="number" /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="状态"><Select><Option value="pending">未达成</Option><Option value="in_progress">进行中</Option><Option value="achieved">已达成</Option></Select></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
