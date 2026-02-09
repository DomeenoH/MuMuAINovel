---
project: "Wizard UI 中文化 + 冒烟测试"
status: completed
current_phase: 3
current_task: "completed"
created_at: 2026-02-09T14:44:27+08:00
completed_at: 2026-02-09T14:55:00+08:00
---

# Work Plan: Wizard UI 中文化 + 冒烟测试

## 目标
将 Wizard 变量输入表单 UI 改为中文显示，并完成一次端到端冒烟测试。

## 角色映射

| Role | 当前模型是否胜任 | 建议模型 |
|------|------------------|----------|
| coder | YES | Claude (当前) |
| tester | YES | Claude (当前) |

---

## Task Queue

### Phase 1: 代码修改 (Role: coder) 💻
- [x] task-001: 检查 promptParser.ts 中的变量显示名称映射
  - input: `frontend/src/utils/promptParser.ts`
  - output: 已有中文映射，需扩展

- [x] task-002: 添加微观层变量中文映射（20+ 个）
  - input: `frontend/src/utils/promptParser.ts`
  - output: 完成更新

### Phase 2: 构建部署 (Role: coder) 💻
- [x] task-003: 构建前端并同步到服务器
  - output: 部署完成

### Phase 3: 冒烟测试 (Role: tester) 🧪
- [x] task-004: 完成 10 步流水线冒烟测试
  - output: 验证截图

---

## Execution Log

| Task | Role | Status | Completed By | Timestamp |
|------|------|--------|--------------|-----------|
| task-001 | coder | ✅ | Claude | 14:46 |
| task-002 | coder | ✅ | Claude | 14:48 |
| task-003 | coder | ✅ | Claude | 14:50 |
| task-004 | tester | ✅ | Claude | 14:55 |

