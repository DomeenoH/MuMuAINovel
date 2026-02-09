# TSC2 Prompt 输入/输出插槽审计报告

## 🔍 核心发现

TSC2 prompt 有**明确区分的输入插槽和输出插槽**，不应将所有 `{{变量}}` 都当作用户输入。

---

## 📊 插槽映射表

| Prompt 名称 | 输入插槽 (用户/前序提供) | 输出插槽 (AI 产出) |
|-------------|--------------------------|-------------------|
| **灵感捕捉** | inspiration_pool, market_analysis, target_reader_profile | substitute_inspiration_list, inspiration_summary |
| **市场定位** | project_brief, market_analysis, target_reader_profile, substitute_inspiration_list | substitute_market_positioning, creation_direction |
| **主题定位** | project_brief, substitute_market_positioning, substitute_inspiration_list | substitute_theme_positioning, theme_layers |
| **核心梗设计** | project_brief, substitute_market_positioning, substitute_theme_positioning, substitute_inspiration_list | substitute_core_concept, emotional_line, triangle_relationship |
| **大纲制作** | project_brief, substitute_story_frame, substitute_rhythm_design | substitute_outline, main_plot_outline, chapter_outline |

---

## ❌ 当前实现的问题

1. **输出变量被当作输入表单**
   - `substitute_inspiration_list` 是灵感捕捉的**输出**
   - 但 `promptParser.ts` 把它解析成了**输入字段**让用户填写

2. **输入变量没有来源**
   - "灵感捕捉"需要 `inspiration_pool`、`market_analysis`、`target_reader_profile`
   - 但这些应该来自更前面的步骤，目前没有这些前序步骤

3. **步骤顺序不对**
   - 当前步骤：灵感捕捉 → 市场定位 → 核心梗设计
   - 正确顺序：需要先有"灵感收集"、"市场分析"等基础步骤

---

## ✅ 正确的逻辑

### 输入插槽的 3 种来源

1. **用户手动输入**：如 `project_brief`（项目立项单）
2. **前序步骤输出**：如 `substitute_inspiration_list` 来自"灵感捕捉"的输出
3. **系统预填充**：从上下文自动获取

### 变量解析器应该区分

```typescript
// 只解析输入插槽中的变量作为表单字段
// 输出插槽中的变量不应该出现在表单中
```

---

## 📋 TSC2 正确的工作流顺序

根据插槽依赖关系，正确的步骤应该是：

```
0. 项目立项 (用户填写 project_brief)
   ↓
1. 灵感收集 (用户填写 inspiration_pool)
   ↓
2. 市场分析 (AI 生成 market_analysis, target_reader_profile)
   ↓
3. 灵感捕捉 (TSC2 Prompt，使用上述输入)
   → 输出: substitute_inspiration_list
   ↓
4. 市场定位 (使用 substitute_inspiration_list)
   → 输出: substitute_market_positioning
   ↓
5. 主题定位
   ↓
6. 核心梗设计
   ↓
7. 大纲制作
```
