# MuMuAINovel 提示词工坊分析

## 现有能力

### 数据模型 (`backend/app/models/prompt_workshop.py`)

| 模型 | 用途 |
|------|------|
| `PromptWorkshopItem` | 已审核通过的公开提示词（name, prompt_content, category, tags, download_count 等） |
| `PromptSubmission` | 用户提交的待审核提示词 |
| `PromptWorkshopLike` | 点赞记录 |

### 分类体系 (`backend/app/constants/prompt_categories.py`)

现有分类：
- general (通用)
- fantasy (玄幻/仙侠)
- martial (武侠)
- romance (言情)
- scifi (科幻)
- horror (悬疑/惊悚)
- history (历史)
- urban (都市)
- game (游戏/电竞)
- other (其他)

### API 能力 (`backend/app/api/prompt_workshop.py`)

**公开 API**:
- `GET /prompt-workshop/items` - 获取提示词列表
- `GET /prompt-workshop/items/{id}` - 获取单个详情
- `POST /prompt-workshop/items/{id}/import` - 导入到本地
- `POST /prompt-workshop/items/{id}/like` - 点赞
- `POST /prompt-workshop/submissions` - 提交新提示词

**管理 API**:
- `GET /prompt-workshop/admin/submissions` - 待审核列表
- `POST /prompt-workshop/admin/submissions/{id}/review` - 审核
- `POST /prompt-workshop/admin/items` - 添加官方提示词
- `PUT /prompt-workshop/admin/items/{id}` - 编辑
- `DELETE /prompt-workshop/admin/items/{id}` - 删除

### 前端组件 (`frontend/src/pages/PromptWorkshop.tsx`)

- 1433 行完整实现
- 支持分类筛选、搜索、排序
- 卡片式展示
- 点赞/导入交互
- 用户提交+管理员审核流程

---

## fanfic-generator 可移植资产

### 系统提示词模板 (14个)

| 文件 | 用途 | 建议分类 |
|------|------|----------|
| `auto_generator.md` | 一句话生成原创企划 | 通用/都市 |
| `beat_generator.md` | 章节 Beats 生成 | 通用 |
| `chapter_generator.md` | 章节正文生成 | 通用 |
| `character_generator.md` | 角色生成 | 通用 |
| `golden_rules.md` | 黄金写作规则 | 通用 |
| `humanizer.md` | 去AI化写作 | 通用 |
| `lom_structure_guide.md` | 类《诡秘之主》结构解构 | 悬疑/惊悚 |
| `ooc_checker.md` | OOC 检查 | 通用 |
| `outline_generator.md` | 大纲生成 | 通用 |
| `pacing_guide.md` | 节奏控制 | 通用 |
| `romance_guide.md` | 感情线指南 | 言情 |
| `structure_blueprint_generator.md` | 结构蓝图生成 | 悬疑/惊悚 |
| `style_checker.md` | 风格检查 | 通用 |
| `tomato_platform_guide.md` | 番茄平台规范 | 通用 |

### Beat 模板 (1个)
- `beat_template.md`

---

## 融合价值点

1. **填补内容空白**：MuMuAINovel 提示词工坊目前可能缺少高质量内置模板
2. **引入结构化写作方法论**：类《诡秘之主》的结构方法是 fanfic-generator 的核心卖点
3. **完善题材覆盖**：fanfic-generator 专注"现代都市神秘"，可补充 MuMuAINovel 的 horror/urban 类别
