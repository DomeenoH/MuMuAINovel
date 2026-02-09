# TSC2 Prompt 结构分析报告

## 1. Prompt 统一结构

每个 TSC2 prompt 都遵循相同的 5 段结构：

| 章节 | 作用 |
|------|------|
| **系统角色** | 定义 AI 角色身份和能力 |
| **思维链指令** | 分层级的执行步骤（第零层→第N层） |
| **输出要求** | JSON 或结构化输出格式 |
| **输入插槽** | 声明需要的输入变量及其说明 |
| **输出插槽** | 声明输出的变量名 |

## 2. 变量系统

### 2.1 变量格式
```
{{variable_name}}
```

### 2.2 已发现的变量列表

| 变量名 | 含义 | 使用场景 |
|--------|------|----------|
| `project_brief` | 项目立项单 | 宏观层-通用输入 |
| `inspiration_pool` | 灵感池 | 灵感捕捉 |
| `market_analysis` | 市场分析结果 | 市场定位 |
| `target_reader_profile` | 目标读者画像 | 市场定位 |
| `substitute_core_concept` | 核心概念 | 核心梗设计 |
| `substitute_outline` | 大纲 | 中观层输入 |
| `substitute_female_lead` | 女主设定 | 中观-女主塑造 |
| `substitute_male_lead` | 男主设定 | 中观-男主塑造 |
| `substitute_relationship_network` | 关系网络 | 中观-关系网络 |
| `substitute_emotional_development` | 情感发展 | 中观-情感发展 |

### 2.3 变量依赖链
```
灵感捕捉 → 市场定位 → 核心梗设计 → 大纲制作
                          ↓
                    人物塑造、关系网络、情感发展
                          ↓
                    微观层（正文、细节）
```

## 3. Prompt 执行模式

每个 prompt 的工作流程：
1. **输入验证**（第零层）：检查 `{{输入变量}}` 是否完整
2. **分析理解**（第一层）：理解输入内容
3. **策略生成**（中间层）：按思维链执行
4. **结果输出**：生成 JSON 格式的结构化输出

## 4. 设计启示

### 4.1 正确的使用方式
1. 将 prompt_content 作为 **System Prompt** 发送给 AI
2. 提取 `{{variable}}` 作为**用户需要填写的表单字段**
3. 替换变量后，将**用户输入作为 User Message** 发送
4. AI 返回结构化 JSON 输出
5. 输出可作为**下一个 prompt 的输入**

### 4.2 流水线模式
```
[用户输入] → [Prompt A] → [输出 A]
                            ↓
              [输出 A 作为输入] → [Prompt B] → [输出 B]
```
