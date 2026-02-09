#!/usr/bin/env python3
"""
批量导入 fanfic-generator 提示词模板到 MuMuAINovel 提示词工坊

使用方法:
    # 在 Docker 容器内运行
    docker exec -it mumuainovel-app python /app/scripts/import_fanfic_prompts.py
    
    # 或在虚拟环境中运行
    cd /Volumes/drive/MuMuAINovel/backend
    source venv/bin/activate  # 如果有的话
    python scripts/import_fanfic_prompts.py
"""

import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path

# 需要在 backend 目录下运行
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.database import Base
from app.models.prompt_workshop import PromptWorkshopItem

# 创建独立的 session maker
engine = create_async_engine(settings.database_url, echo=False)
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# fanfic-generator prompts 目录
FANFIC_PROMPTS_DIR = Path("/Volumes/drive/fanfic-generator/prompts/system_prompts")
# JSON 数据文件
JSON_DATA_FILE = Path(__file__).parent / "fanfic_prompts_data.json"


# 定义要导入的提示词模板
PROMPTS_TO_IMPORT = [
    {
        "name": "一句话企划生成器",
        "description": "只需输入书名，即可自动生成一套原创长篇网文的完整企划与设定文件。专为现代都市神秘方向设计，支持类《诡秘之主》结构方法。",
        "category": "urban",
        "tags": ["企划", "现代都市", "神秘", "自动生成"],
        "source_file": "auto_generator.md",
    },
    {
        "name": "章节 Beats 生成器", 
        "description": "将卷纲和结构蓝图翻译成可执行的章节指令（Beats），确保每章有结算、线索载体化、代价落地。",
        "category": "general",
        "tags": ["大纲", "Beats", "结构化", "章节规划"],
        "source_file": "beat_generator.md",
    },
    {
        "name": "章节正文生成器",
        "description": "根据 Beats 和设定生成符合番茄平台规范的章节正文（2000-2500字），每章有结算、开头钩子、结尾悬念。",
        "category": "general",
        "tags": ["正文", "章节", "番茄", "写作"],
        "source_file": "chapter_generator.md",
    },
    {
        "name": "角色自动生成系统",
        "description": "自动生成支持50-100万字长篇的角色体系与组织生态。强调角色DNA、面具身份、秘密与代价、组织关系网。",
        "category": "general",
        "tags": ["角色", "人设", "组织", "关系网"],
        "source_file": "character_generator.md",
    },
    {
        "name": "黄金规则指南",
        "description": "定义网文最关键的留存规则：黄金前500字、黄金三章与结尾钩子。避免水与空话，让读者欲罢不能。",
        "category": "general",
        "tags": ["开头", "结尾", "钩子", "留存"],
        "source_file": "golden_rules.md",
    },
    {
        "name": "去AI化写作指南",
        "description": "让AI生成的文字更像人类写的：消除翻译腔、禁用AI高频词、拒绝导游式结构、建立对话感。",
        "category": "general",
        "tags": ["去AI", "人味", "风格", "质量"],
        "source_file": "humanizer.md",
    },
    {
        "name": "类《诡秘之主》结构解构",
        "description": "把《诡秘之主》最能跑长篇的叙事结构抽象成蓝图规则：三层谜题、枢纽场景、线索账本、阶段揭示、进阶里程碑。",
        "category": "horror",
        "tags": ["结构", "诡秘", "长篇", "方法论"],
        "source_file": "lom_structure_guide.md",
    },
    {
        "name": "角色一致性检测",
        "description": "检测章节是否出现角色崩坏（OOC），从语言指纹、行为模式、底线禁忌、关系一致性四个维度审核。",
        "category": "general",
        "tags": ["审核", "OOC", "一致性", "角色"],
        "source_file": "ooc_checker.md",
    },
    {
        "name": "大纲生成系统",
        "description": "为50-100万字级别长篇设计完整叙事结构：总纲、卷纲、线索账本、枢纽场景、进阶里程碑。",
        "category": "general",
        "tags": ["大纲", "总纲", "卷纲", "结构"],
        "source_file": "outline_generator.md",
    },
    {
        "name": "节奏与结算控制指南",
        "description": "定义长篇节奏控制方法：小结算（每章）、大结算（每3章）、卷末结算。让读者感觉每章都有东西。",
        "category": "general",
        "tags": ["节奏", "结算", "爽点", "pacing"],
        "source_file": "pacing_guide.md",
    },
    {
        "name": "情感描写规范",
        "description": "色而不淫，止于至善。允许暧昧与心动，禁止露骨内容。包含多女主出场时间表与感情线节奏控制。",
        "category": "romance",
        "tags": ["情感", "言情", "感情线", "规范"],
        "source_file": "romance_guide.md",
    },
    {
        "name": "结构蓝图生成器",
        "description": "生成全书的结构约束层：Threads（谜题线程）、Clues（线索账本）、Hubs（枢纽场景）、Milestones（进阶里程碑）。",
        "category": "horror",
        "tags": ["蓝图", "结构", "线索", "里程碑"],
        "source_file": "structure_blueprint_generator.md",
    },
    {
        "name": "AI味检测系统",
        "description": "检测文本中的AI生成痕迹：禁用词汇、翻译腔、儿化音、导游式结构。输出检测报告与AI味指数。",
        "category": "general",
        "tags": ["审核", "AI检测", "风格", "质量"],
        "source_file": "style_checker.md",
    },
    {
        "name": "番茄平台写作指南",
        "description": "针对番茄小说平台的专门规范：2000-2500字、手机阅读适配、开头禁忌、结尾钩子、去AI感技巧。",
        "category": "general",
        "tags": ["番茄", "平台规范", "手机阅读", "字数"],
        "source_file": "tomato_platform_guide.md",
    },
]

# fanfic-generator prompts 目录
FANFIC_PROMPTS_DIR = Path("/Volumes/drive/fanfic-generator/prompts/system_prompts")


async def import_prompts():
    """导入所有提示词模板"""
    async with async_session_maker() as session:
        imported_count = 0
        skipped_count = 0
        
        for prompt_info in PROMPTS_TO_IMPORT:
            source_file = FANFIC_PROMPTS_DIR / prompt_info["source_file"]
            
            # 读取模板内容
            if not source_file.exists():
                print(f"⚠️  文件不存在: {source_file}")
                skipped_count += 1
                continue
            
            prompt_content = source_file.read_text(encoding="utf-8")
            
            # 创建 PromptWorkshopItem
            item = PromptWorkshopItem(
                id=str(uuid.uuid4()),
                name=prompt_info["name"],
                description=prompt_info["description"],
                prompt_content=prompt_content,
                category=prompt_info["category"],
                tags=prompt_info["tags"],
                author_id="fanfic-generator:system",
                author_name="Fanfic-Generator 方法论",
                source_instance="fanfic-generator",
                is_official=True,  # 标记为官方提示词
                download_count=0,
                like_count=0,
                status="active",
            )
            
            session.add(item)
            imported_count += 1
            print(f"✅ 已导入: {prompt_info['name']} ({prompt_info['category']})")
        
        # 提交事务
        await session.commit()
        
        print(f"\n📊 导入完成:")
        print(f"   - 成功: {imported_count}")
        print(f"   - 跳过: {skipped_count}")


if __name__ == "__main__":
    print("🚀 开始导入 fanfic-generator 提示词模板...")
    print(f"📂 源目录: {FANFIC_PROMPTS_DIR}")
    print()
    asyncio.run(import_prompts())
