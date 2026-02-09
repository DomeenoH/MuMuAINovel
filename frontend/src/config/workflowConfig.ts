/**
 * 创作工作流配置
 * 定义 fanfic-generator 和 TSC2 的分步创作流程
 */

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'prompt' | 'form';  // prompt=AI执行, form=纯表单
  templateCategory?: string;  // 对应 prompt_workshop_items.category
  templateName?: string;      // 精确匹配的模板名称
  templateKeywords?: string[];  // 用于搜索匹配的关键词
  isOptional: boolean;
  fields?: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required: boolean;
    placeholder?: string;
    description?: string;
  }[];
  // 输出变量：这些变量会被保存到上下文供后续步骤使用
  outputVariables?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  steps: WorkflowStep[];
}

export const WORKFLOWS: Workflow[] = [
  {
    id: 'fanfic-generator',
    name: '诡秘之主式结构',
    description: '类《诡秘之主》的结构化悬疑写法，适合长篇悬疑/都市神秘题材',
    icon: '🔮',
    color: '#722ed1',
    steps: [
      {
        id: 'inspiration',
        name: '一句话企划',
        description: '用一句话描述你的故事核心创意',
        type: 'form',
        templateCategory: 'urban',
        templateKeywords: ['一句话', '企划', '生成器'],
        isOptional: false,
        fields: [
          { name: 'concept', label: '核心创意', type: 'textarea', required: true, placeholder: '例：一个普通上班族发现自己的邻居都是来自异世界的神秘存在...' }
        ]
      },
      {
        id: 'characters',
        name: '角色塑造',
        description: '生成核心角色设定',
        type: 'prompt',
        templateCategory: 'general',
        templateKeywords: ['角色', '生成', '系统'],
        isOptional: false,
        fields: [
          { name: 'protagonist', label: '主角特点', type: 'textarea', required: true, placeholder: '描述主角的背景、性格、目标...' },
          { name: 'characterCount', label: '配角数量', type: 'select', required: true }
        ]
      },
      {
        id: 'worldbuilding',
        name: '世界观设计',
        description: '构建故事的世界观和规则体系',
        type: 'prompt',
        templateCategory: 'general',
        templateKeywords: ['黄金', '规则', '指南'],
        isOptional: false,
        fields: [
          { name: 'worldSetting', label: '世界设定', type: 'textarea', required: true, placeholder: '描述故事发生的世界...' }
        ]
      },
      {
        id: 'blueprint',
        name: '结构蓝图',
        description: '设计全书级别的谜题线程和关键场景',
        type: 'prompt',
        templateCategory: 'horror',
        templateKeywords: ['结构', '蓝图', '生成器'],
        isOptional: false,
        fields: [
          { name: 'mainMystery', label: '核心谜题', type: 'textarea', required: true, placeholder: '全书最核心的悬念是什么？' },
          { name: 'volumeCount', label: '预计卷数', type: 'select', required: true }
        ]
      },
      {
        id: 'outline',
        name: '大纲生成',
        description: '生成详细的章节大纲',
        type: 'prompt',
        templateCategory: 'general',
        templateKeywords: ['大纲', '生成', '系统'],
        isOptional: false
      }
    ]
  },
  {
    id: 'tishen',
    name: '替身文流程',
    description: 'TSC2 替身文完整创作工作流，从灵感到大纲',
    icon: '🎭',
    color: '#eb2f96',
    steps: [
      // ===== 步骤 0: 项目立项（纯表单）=====
      {
        id: 'project-init',
        name: '项目立项',
        description: '填写项目基本信息',
        type: 'form',
        isOptional: false,
        fields: [
          { 
            name: 'project_brief', 
            label: '项目简介', 
            type: 'textarea', 
            required: true, 
            placeholder: '简要描述你的替身文创意，包括故事类型、风格、预计字数等...',
            description: '这是整个创作流程的起点，请认真填写'
          }
        ],
        outputVariables: ['project_brief']
      },
      // ===== 步骤 1: 基础信息（纯表单）=====
      {
        id: 'basic-info',
        name: '基础信息收集',
        description: '填写灵感、市场分析和目标读者信息',
        type: 'form',
        isOptional: false,
        fields: [
          { 
            name: 'inspiration_pool', 
            label: '灵感池', 
            type: 'textarea', 
            required: true, 
            placeholder: '列出你的创意灵感、参考作品、想要融入的元素等...',
            description: '不需要完整，零散的想法也可以'
          },
          { 
            name: 'market_analysis', 
            label: '市场分析', 
            type: 'textarea', 
            required: false, 
            placeholder: '目标平台是什么？当前热门的替身文有哪些特点？',
            description: '可选，如不填写 AI 会基于通用市场情况分析'
          },
          { 
            name: 'target_reader_profile', 
            label: '目标读者画像', 
            type: 'textarea', 
            required: false, 
            placeholder: '你的理想读者是什么人群？她们喜欢什么样的故事？',
            description: '可选，如不填写 AI 会基于替身文通用读者分析'
          }
        ],
        outputVariables: ['inspiration_pool', 'market_analysis', 'target_reader_profile']
      },
      // ===== 步骤 2: 灵感捕捉（AI）=====
      {
        id: 'inspiration',
        name: '灵感捕捉',
        description: '由 AI 整理和提炼你的创意灵感',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-灵感捕捉',
        isOptional: false,
        outputVariables: ['substitute_inspiration_list', 'inspiration_summary']
      },
      // ===== 步骤 3: 市场定位（AI）=====
      {
        id: 'market',
        name: '市场定位',
        description: '确定目标读者和市场定位',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-市场定位',
        isOptional: false,
        outputVariables: ['substitute_market_positioning', 'creation_direction']
      },
      // ===== 步骤 4: 主题定位（AI）=====
      {
        id: 'theme',
        name: '主题定位',
        description: '确定故事的核心主题和层次',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-主题定位',
        isOptional: false,
        outputVariables: ['substitute_theme_positioning', 'theme_layers']
      },
      // ===== 步骤 5: 核心梗设计（AI）=====
      {
        id: 'core',
        name: '核心梗设计',
        description: '设计替身文的核心梗概和三角关系',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-核心梗设计',
        isOptional: false,
        outputVariables: ['substitute_core_concept', 'emotional_line', 'triangle_relationship']
      },
      // ===== 步骤 6: 世界观构建（AI）=====
      {
        id: 'world',
        name: '世界观构建',
        description: '构建故事背景和世界观',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-世界观构建',
        isOptional: false,
        outputVariables: ['substitute_world_setting', 'space_scenes']
      },
      // ===== 步骤 7: 故事框架（AI）=====
      {
        id: 'framework',
        name: '故事框架',
        description: '搭建故事的整体框架和情节节点',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-故事框架',
        isOptional: false,
        outputVariables: ['substitute_story_frame', 'main_plot', 'sub_plots', 'plot_nodes']
      },
      // ===== 步骤 8: 节奏设计（AI）=====
      {
        id: 'rhythm',
        name: '节奏设计',
        description: '设计情感曲线和节奏把控',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-节奏设计',
        isOptional: false,
        outputVariables: ['substitute_rhythm_design', 'emotional_curve', 'core_nodes']
      },
      // ===== 步骤 9: 大纲制作（AI）=====
      {
        id: 'outline',
        name: '大纲制作',
        description: '生成完整的故事大纲',
        type: 'prompt',
        templateCategory: '替身文系列',
        templateName: '替身文-宏观-大纲制作',
        isOptional: false,
        outputVariables: ['substitute_outline', 'main_plot_outline', 'chapter_outline']
      }
    ]
  },
  {
    id: 'duoziduofu',
    name: '多子多福流程',
    description: 'TSC2 多子多福完整创作工作流',
    icon: '👶',
    color: '#fa8c16',
    steps: [
      {
        id: 'inspiration',
        name: '灵感捕捉',
        description: '捕捉多子多福创意灵感',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['灵感', '捕捉'],
        isOptional: false
      },
      {
        id: 'market',
        name: '市场定位',
        description: '确定目标读者',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['市场', '定位'],
        isOptional: true
      },
      {
        id: 'core',
        name: '核心梗设计',
        description: '设计核心梗概',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['核心', '梗'],
        isOptional: false
      },
      {
        id: 'goldfinger',
        name: '金手指设计',
        description: '设计主角的金手指系统',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['金手指'],
        isOptional: false
      },
      {
        id: 'world',
        name: '世界观设定',
        description: '设定世界观和背景',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['世界观', '设定'],
        isOptional: false
      },
      {
        id: 'characters',
        name: '人物设定',
        description: '设计角色',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['人物', '设定'],
        isOptional: false
      },
      {
        id: 'system',
        name: '系统设计',
        description: '设计等级/天赋系统',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['系统', '设计'],
        isOptional: true
      },
      {
        id: 'framework',
        name: '框架阶段',
        description: '故事线和章节纲',
        type: 'prompt',
        templateCategory: '多子多福系列',
        templateKeywords: ['框架', '故事线'],
        isOptional: false
      }
    ]
  },
  {
    id: 'dark-duoziduofu',
    name: '黑暗多子多福',
    description: 'TSC2 黑暗系多子多福创作流程 (18+)',
    icon: '🌑',
    color: '#434343',
    steps: [
      {
        id: 'system-role',
        name: '系统角色',
        description: '定义 AI 角色定位',
        type: 'prompt',
        templateCategory: '黑暗多子多福系列',
        templateKeywords: ['系统', '角色'],
        isOptional: false
      },
      {
        id: 'workflow',
        name: '创作流程',
        description: '了解完整创作流程',
        type: 'prompt',
        templateCategory: '黑暗多子多福系列',
        templateKeywords: ['创作', '流程'],
        isOptional: false
      },
      {
        id: 'macro',
        name: '宏观设定',
        description: '宏观层面设计',
        type: 'prompt',
        templateCategory: '黑暗多子多福系列',
        templateKeywords: ['宏观'],
        isOptional: false
      },
      {
        id: 'meso',
        name: '中观设定',
        description: '中观层面设计',
        type: 'prompt',
        templateCategory: '黑暗多子多福系列',
        templateKeywords: ['中观'],
        isOptional: false
      },
      {
        id: 'micro',
        name: '微观技法',
        description: '微观写作技法',
        type: 'prompt',
        templateCategory: '黑暗多子多福系列',
        templateKeywords: ['微观'],
        isOptional: false
      }
    ]
  }
];

export const getWorkflowById = (id: string): Workflow | undefined => {
  return WORKFLOWS.find(w => w.id === id);
};

export default WORKFLOWS;
