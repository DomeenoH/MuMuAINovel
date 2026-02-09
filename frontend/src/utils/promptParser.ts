/**
 * Prompt 变量解析器 (修正版)
 * 解析 TSC2 prompt 中的输入/输出插槽，只将输入插槽作为表单字段
 */

export interface ParsedVariable {
  name: string;           // 变量名（英文）
  displayName: string;    // 显示名称（中文）
  description?: string;   // 描述
  type: 'text' | 'textarea' | 'json';  // 输入类型
  required: boolean;
  source?: 'user' | 'context' | 'auto';  // 来源类型
}

export interface PromptSlots {
  inputSlots: ParsedVariable[];   // 输入插槽（需要用户/上下文提供）
  outputSlots: string[];          // 输出插槽（AI 产出）
}

// 变量名到中文名的映射
const VARIABLE_DISPLAY_NAMES: Record<string, string> = {
  // 宏观层 - 输入类
  'project_brief': '项目立项单',
  'inspiration_pool': '灵感池',
  'market_analysis': '市场分析结果',
  'target_reader_profile': '目标读者画像',
  
  // 宏观层 - 输出类（由 AI 生成）
  'substitute_inspiration_list': '替身文灵感列表',
  'inspiration_summary': '灵感汇总',
  'substitute_market_positioning': '市场定位结果',
  'creation_direction': '创作方向',
  'substitute_theme_positioning': '主题定位结果',
  'theme_layers': '主题层次',
  'substitute_core_concept': '核心梗设定',
  'emotional_line': '情感线',
  'triangle_relationship': '三角关系',
  'substitute_outline': '替身文大纲',
  'main_plot_outline': '主线大纲',
  'chapter_outline': '章节大纲',
  'substitute_story_frame': '故事框架',
  'substitute_rhythm_design': '节奏设计',
  'substitute_world_setting': '世界观设定',
  
  // 中观层
  'substitute_female_lead': '女主角设定',
  'substitute_male_lead': '男主角设定',
  'substitute_white_moon': '白月光设定',
  'substitute_relationship_network': '人物关系网络',
  'substitute_emotional_development': '情感发展设计',
  'main_relationships': '主要人物关系',
  'conflict_design': '冲突设计',
  'growth_arc': '成长弧线',
  'transformation_arc': '转变弧线',
  'pursuit_process': '追妻过程',
  'emotion_stages': '情感阶段',
  'true_false_emotion': '真假情感对比',
  
  // 微观层 - 正文描写相关
  'scene_setting': '场景设定',
  'dialogue_context': '对话上下文',
  'emotional_tone': '情感基调',
  'chapter_beats': '章节节拍',
  'previous_chapter': '前一章内容',
  'character_states': '角色状态',
  
  // 微观层 - TSC2 输入插槽（截图中显示的变量）
  'detail_outline_guide': '细纲指南',
  'scene_material_prep': '场景素材准备',
  'key_description_points': '关键描写要点',
  'chapter_outline_detail': '章节细纲详情',
  'emotion_description_guide': '情感描写指南',
  'dialogue_subtext_guide': '对话潜台词指南',
  'pacing_control_guide': '节奏控制指南',
  'foreshadowing_guide': '伏笔设计指南',
  'tension_build_guide': '张力构建指南',
  'scene_transition_guide': '场景转换指南',
  'action_description_guide': '动作描写指南',
  'inner_monologue_guide': '内心独白指南',
  'atmosphere_build_guide': '氛围营造指南',
  
  // 通用输入
  'user_input': '用户输入',
  'context': '上下文信息',
  'world_setting': '世界观设定',
  'character_info': '角色信息',
  'plot_summary': '剧情摘要',
  'current_scene': '当前场景',
  'writing_style': '写作风格',
};


// 变量名到描述的映射
const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  'project_brief': '包含故事主题、风格、目标字数等基本信息',
  'inspiration_pool': '收集的灵感素材和创意点子（可以是零散的想法）',
  'market_analysis': '目标平台的市场调研结果',
  'target_reader_profile': '理想读者的画像描述',
  'substitute_core_concept': '替身文的核心设定和卖点',
  'substitute_outline': '完整的故事大纲结构',
  'substitute_female_lead': '女主角的详细人设',
  'substitute_male_lead': '男主角的详细人设',
  'substitute_white_moon': '白月光角色的设定',
  'chapter_outline': '当前章节的详细大纲',
  'previous_chapter': '前一章的内容摘要（用于保持连贯性）',
};

// 需要用户手动输入的基础变量（不依赖其他步骤）
const USER_INPUT_VARIABLES = new Set([
  'project_brief',
  'inspiration_pool',
  'user_input',
]);

/**
 * 解析 prompt 的输入/输出插槽
 * 核心改进：区分输入插槽和输出插槽
 */
export function parsePromptSlots(promptContent: string): PromptSlots {
  // 提取输入插槽部分
  const inputSlotsMatch = promptContent.match(/## 输入插槽[\s\S]*?(?=## |$)/);
  const outputSlotsMatch = promptContent.match(/## 输出插槽[\s\S]*?(?=## |$)/);
  
  // 从输入插槽表格中提取变量
  const inputSlots: ParsedVariable[] = [];
  if (inputSlotsMatch) {
    const inputVars = inputSlotsMatch[0].match(/\{\{([^}]+)\}\}/g) || [];
    const uniqueInputVars = [...new Set(inputVars.map(v => v.replace(/\{\{|\}\}/g, '').trim()))];
    
    inputSlots.push(...uniqueInputVars.map(name => ({
      name,
      displayName: VARIABLE_DISPLAY_NAMES[name] || formatVariableName(name),
      description: VARIABLE_DESCRIPTIONS[name],
      type: inferVariableType(name),
      required: true,
      source: USER_INPUT_VARIABLES.has(name) ? 'user' as const : 'context' as const,
    })));
  }
  
  // 从输出插槽表格中提取变量名
  const outputSlots: string[] = [];
  if (outputSlotsMatch) {
    const outputVars = outputSlotsMatch[0].match(/\{\{([^}]+)\}\}/g) || [];
    outputSlots.push(...new Set(outputVars.map(v => v.replace(/\{\{|\}\}/g, '').trim())));
  }
  
  return { inputSlots, outputSlots };
}

/**
 * 旧版函数（保留兼容性，但标记为废弃）
 * @deprecated 使用 parsePromptSlots 代替
 */
export function parseVariables(promptContent: string): ParsedVariable[] {
  // 优先使用新的插槽解析
  const slots = parsePromptSlots(promptContent);
  if (slots.inputSlots.length > 0) {
    return slots.inputSlots;
  }
  
  // 回退：如果没有明确的输入/输出插槽定义，解析所有变量
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = promptContent.matchAll(variableRegex);
  
  const variableNames = new Set<string>();
  for (const match of matches) {
    variableNames.add(match[1].trim());
  }
  
  return Array.from(variableNames).map(name => ({
    name,
    displayName: VARIABLE_DISPLAY_NAMES[name] || formatVariableName(name),
    description: VARIABLE_DESCRIPTIONS[name],
    type: inferVariableType(name),
    required: true,
  }));
}

/**
 * 根据变量名推断输入类型
 */
function inferVariableType(name: string): 'text' | 'textarea' | 'json' {
  // JSON 类型的变量（列表、数组等）
  if (name.includes('list') || name.includes('array') || name.includes('_list')) {
    return 'json';
  }
  
  // 长文本类型
  const longTextKeywords = [
    'content', 'outline', 'brief', 'description', 'analysis',
    'profile', 'concept', 'design', 'development', 'chapter',
    'lead', 'pool', 'context', 'states', 'beats', 'arc',
    'summary', 'positioning', 'direction', 'frame', 'network'
  ];
  
  if (longTextKeywords.some(kw => name.toLowerCase().includes(kw))) {
    return 'textarea';
  }
  
  return 'text';
}

/**
 * 格式化变量名为可读的显示名称
 */
function formatVariableName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 用实际值替换 prompt 中的变量占位符
 */
export function resolvePrompt(
  template: string, 
  values: Record<string, string>
): string {
  let resolved = template;
  
  for (const [name, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
    resolved = resolved.replace(regex, value || `[未提供: ${name}]`);
  }
  
  return resolved;
}

/**
 * 检查是否所有必需变量都已填写
 */
export function validateVariables(
  variables: ParsedVariable[],
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const variable of variables) {
    if (variable.required && !values[variable.name]?.trim()) {
      missing.push(variable.displayName);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * 从 AI 输出中提取 JSON 变量（用于保存到上下文）
 */
export function extractOutputVariables(
  aiOutput: string,
  expectedOutputs: string[]
): Record<string, string> {
  const extracted: Record<string, string> = {};
  
  // 尝试提取 JSON 块
  const jsonMatch = aiOutput.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      for (const key of expectedOutputs) {
        if (parsed[key] !== undefined) {
          extracted[key] = typeof parsed[key] === 'string' 
            ? parsed[key] 
            : JSON.stringify(parsed[key], null, 2);
        }
      }
    } catch {
      // JSON 解析失败，忽略
    }
  }
  
  // 如果没有找到 JSON，将整个输出作为第一个输出变量的值
  if (Object.keys(extracted).length === 0 && expectedOutputs.length > 0) {
    extracted[expectedOutputs[0]] = aiOutput;
  }
  
  return extracted;
}

/**
 * 从 prompt 内容中提取章节信息
 */
export function extractPromptSections(promptContent: string): {
  systemRole: string;
  thinkingChain: string;
  outputRequirements: string;
  inputSlots: string;
  outputSlots: string;
} {
  const sections: Record<string, string> = {};
  const sectionRegex = /^##\s+(.+)$/gm;
  
  let lastSection = '';
  let lastIndex = 0;
  let match;
  
  while ((match = sectionRegex.exec(promptContent)) !== null) {
    if (lastSection) {
      sections[lastSection] = promptContent.slice(lastIndex, match.index).trim();
    }
    lastSection = match[1];
    lastIndex = match.index + match[0].length;
  }
  
  // 最后一个 section
  if (lastSection) {
    sections[lastSection] = promptContent.slice(lastIndex).trim();
  }
  
  return {
    systemRole: sections['系统角色'] || '',
    thinkingChain: sections['思维链指令'] || '',
    outputRequirements: sections['输出要求'] || '',
    inputSlots: sections['输入插槽'] || '',
    outputSlots: sections['输出插槽'] || '',
  };
}
