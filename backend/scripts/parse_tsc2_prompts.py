#!/usr/bin/env python3
"""
TSC2 模板解析与导入脚本
将 286 个结构化写作 Prompt 模板导入到 MuMuAINovel 提示词工坊
"""

import os
import re
import json
import uuid
from datetime import datetime
from pathlib import Path

# TSC2 模板目录
TSC2_DIR = "/Users/mac_domino/Documents/tsc2"
OUTPUT_FILE = "/Volumes/drive/MuMuAINovel/backend/scripts/tsc2_prompts_data.json"

# 题材映射
GENRE_MAPPING = {
    "替身文": {"range": (200, 254), "genre_code": "tishen"},
    "多子多福": {"range": (255, 344), "genre_code": "duoziduofu"},
    "欲念描写专家": {"range": (346, 389), "genre_code": "yunian"},
    "黑暗多子多福": {"range": (390, 524), "genre_code": "dark_duoziduofu"},
}

# 层级映射
LEVEL_KEYWORDS = {
    "宏观": "macro",
    "中观": "meso", 
    "微观": "micro",
    "进阶": "advanced",
    "辅助": "auxiliary",
    "创意阶段": "creative",
    "设定阶段": "setting",
    "框架阶段": "framework",
    "创作阶段": "writing",
    "进阶技巧": "advanced_technique",
    "辅助工具": "auxiliary_tool",
    "设定": "setting",
    "势力": "force",
}


def extract_number(filename: str) -> int:
    """从文件名提取编号"""
    match = re.match(r"^(\d+)", filename)
    return int(match.group(1)) if match else 0


def determine_genre(number: int) -> tuple:
    """根据编号确定题材"""
    for genre_name, info in GENRE_MAPPING.items():
        start, end = info["range"]
        if start <= number <= end:
            return genre_name, info["genre_code"]
    return "其他", "other"


def extract_level(filename: str) -> str:
    """从文件名提取层级"""
    for keyword, level_code in LEVEL_KEYWORDS.items():
        if keyword in filename:
            return level_code
    return "general"


def parse_markdown(filepath: str) -> dict:
    """解析 markdown 文件提取模板信息"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 提取标题
    title_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else Path(filepath).stem
    
    # 提取系统角色
    role_match = re.search(r"## 系统角色\s*\n+(.+?)(?=\n## |\Z)", content, re.DOTALL)
    system_role = role_match.group(1).strip() if role_match else ""
    
    # 提取思维链指令
    cot_match = re.search(r"## 思维链指令\s*\n+(.+?)(?=\n## 输出要求|\n## 输入插槽|\Z)", content, re.DOTALL)
    chain_of_thought = cot_match.group(1).strip() if cot_match else ""
    
    # 提取输出要求（JSON 格式）
    output_match = re.search(r"## 输出要求\s*\n+(.+?)(?=\n## 输入插槽|\Z)", content, re.DOTALL)
    output_format = output_match.group(1).strip() if output_match else ""
    
    # 提取输入插槽
    input_match = re.search(r"## 输入插槽\s*\n+(.+?)(?=\n## 输出插槽|\n## 优化建议|\Z)", content, re.DOTALL)
    input_slots = input_match.group(1).strip() if input_match else ""
    
    # 提取输出插槽
    output_slot_match = re.search(r"## 输出插槽\s*\n+(.+?)(?=\n## 优化建议|\Z)", content, re.DOTALL)
    output_slots = output_slot_match.group(1).strip() if output_slot_match else ""
    
    return {
        "title": title,
        "system_role": system_role,
        "chain_of_thought": chain_of_thought,
        "output_format": output_format,
        "input_slots": input_slots,
        "output_slots": output_slots,
        "full_content": content
    }


def build_prompt_content(parsed: dict) -> str:
    """构建完整的 prompt 内容"""
    parts = []
    
    if parsed["system_role"]:
        parts.append(f"## 系统角色\n\n{parsed['system_role']}")
    
    if parsed["chain_of_thought"]:
        parts.append(f"## 思维链指令\n\n{parsed['chain_of_thought']}")
    
    if parsed["output_format"]:
        parts.append(f"## 输出要求\n\n{parsed['output_format']}")
    
    if parsed["input_slots"]:
        parts.append(f"## 输入插槽\n\n{parsed['input_slots']}")
    
    if parsed["output_slots"]:
        parts.append(f"## 输出插槽\n\n{parsed['output_slots']}")
    
    return "\n\n".join(parts) if parts else parsed["full_content"]


def main():
    """主函数"""
    templates = []
    files = sorted(Path(TSC2_DIR).glob("*.md"), key=lambda x: extract_number(x.name))
    
    print(f"📂 扫描目录: {TSC2_DIR}")
    print(f"📄 发现文件: {len(files)} 个")
    
    for filepath in files:
        filename = filepath.name
        number = extract_number(filename)
        
        if number == 0:
            continue
        
        genre_name, genre_code = determine_genre(number)
        level = extract_level(filename)
        
        try:
            parsed = parse_markdown(str(filepath))
        except Exception as e:
            print(f"⚠️ 解析失败: {filename} - {e}")
            continue
        
        # 清理标题（移除编号前缀）
        clean_title = re.sub(r"^\d+-", "", parsed["title"]).strip()
        
        template = {
            "id": str(uuid.uuid4()),
            "name": clean_title,
            "description": parsed["system_role"][:500] if parsed["system_role"] else f"TSC2 - {clean_title}",
            "content": build_prompt_content(parsed),
            "category": "tsc2_" + genre_code,
            "genre": genre_name,
            "level": level,
            "template_number": number,
            "source": "tsc2",
            "source_file": filename,
            "tags": [genre_name, level.replace("_", " ")],
            "variables": [],  # 可扩展：解析 {{变量}}
            "is_system": True,
            "usage_count": 0,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        templates.append(template)
        print(f"✅ [{number:03d}] {genre_name}/{level}: {clean_title[:40]}")
    
    # 按编号排序
    templates.sort(key=lambda x: x["template_number"])
    
    # 统计
    genre_stats = {}
    for t in templates:
        g = t["genre"]
        genre_stats[g] = genre_stats.get(g, 0) + 1
    
    print(f"\n📊 统计:")
    for genre, count in genre_stats.items():
        print(f"   - {genre}: {count} 个")
    print(f"   - 总计: {len(templates)} 个")
    
    # 保存 JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(templates, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 已保存: {OUTPUT_FILE}")
    return templates


if __name__ == "__main__":
    main()
