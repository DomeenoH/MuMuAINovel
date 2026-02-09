#!/usr/bin/env python3
"""
TSC2 模板数据库导入脚本 (v3)
将 286 个模板导入到 MuMuAINovel 的 prompt_workshop_items 表
"""

import json
from datetime import datetime
from sqlalchemy import create_engine, text

# 配置
JSON_FILE = "/tmp/tsc2_prompts_data.json"
DATABASE_URL = "postgresql://mumuai:mumuai123@postgres:5432/mumuai_novel"


def get_category_label(genre: str) -> str:
    """获取分类标签"""
    mapping = {
        "替身文": "替身文系列",
        "多子多福": "多子多福系列",
        "欲念描写专家": "欲念描写专家",
        "黑暗多子多福": "黑暗多子多福系列",
        "其他": "TSC2 工作流"
    }
    return mapping.get(genre, "TSC2 模板")


def get_level_label(level: str) -> str:
    """获取层级标签"""
    mapping = {
        "macro": "宏观",
        "meso": "中观",
        "micro": "微观",
        "advanced": "进阶",
        "auxiliary": "辅助工具",
        "creative": "创意阶段",
        "setting": "设定阶段",
        "framework": "框架阶段",
        "writing": "创作阶段",
        "force": "势力设定",
        "general": "通用"
    }
    return mapping.get(level, level)


def main():
    """主函数"""
    # 加载 JSON 数据
    print(f"📂 加载数据: {JSON_FILE}")
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        templates = json.load(f)
    
    print(f"📊 模板数量: {len(templates)}")
    
    # 连接数据库
    engine = create_engine(DATABASE_URL)
    
    # 批量插入
    inserted = 0
    skipped = 0
    errors = 0
    
    with engine.connect() as conn:
        for t in templates:
            try:
                # 检查是否已存在（通过 id）
                check_result = conn.execute(text("""
                    SELECT id FROM prompt_workshop_items WHERE id = :id
                """), {"id": t["id"]})
                
                if check_result.fetchone():
                    skipped += 1
                    continue
                
                # 构建标签
                tags = [
                    t["genre"],
                    get_level_label(t["level"]),
                    "TSC2",
                    f"编号{t['template_number']}"
                ]
                
                # 插入数据到 prompt_workshop_items 表
                conn.execute(text("""
                    INSERT INTO prompt_workshop_items (
                        id, name, description, prompt_content, category,
                        tags, author_id, author_name, source_instance,
                        is_official, download_count, like_count, status,
                        created_at, updated_at
                    ) VALUES (
                        :id, :name, :description, :prompt_content, :category,
                        :tags, :author_id, :author_name, :source_instance,
                        :is_official, :download_count, :like_count, :status,
                        :created_at, :updated_at
                    )
                """), {
                    "id": t["id"],
                    "name": t["name"],
                    "description": t["description"][:1000] if t["description"] else f"TSC2 - {t['name']}",
                    "prompt_content": t["content"],
                    "category": get_category_label(t["genre"]),
                    "tags": json.dumps(tags, ensure_ascii=False),
                    "author_id": "system",
                    "author_name": "TSC2 系统",
                    "source_instance": f"tsc2:{t['template_number']}:{t.get('source_file', '')}",
                    "is_official": True,
                    "download_count": 0,
                    "like_count": 0,
                    "status": "published",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })
                
                inserted += 1
                conn.commit()  # 每条都提交以避免事务失败
                
                if inserted % 50 == 0:
                    print(f"  ✅ 已导入: {inserted} 个")
                    
            except Exception as e:
                errors += 1
                if errors <= 3:  # 只显示前3个错误
                    print(f"  ❌ 导入失败 [{t['template_number']}]: {str(e)[:150]}")
                conn.rollback()
                continue
    
    print(f"\n📊 导入结果:")
    print(f"   - 新增: {inserted} 个")
    print(f"   - 跳过: {skipped} 个 (已存在)")
    print(f"   - 错误: {errors} 个")
    print(f"   - 总计: {len(templates)} 个")
    
    # 验证
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT category, COUNT(*) as count 
            FROM prompt_workshop_items 
            WHERE author_id = 'system'
            GROUP BY category
            ORDER BY count DESC
        """))
        
        print(f"\n📈 数据库统计:")
        for row in result:
            print(f"   - {row[0]}: {row[1]} 个")
        
        # 总数
        total = conn.execute(text("""
            SELECT COUNT(*) FROM prompt_workshop_items WHERE author_id = 'system'
        """)).scalar()
        print(f"\n   ✅ TSC2 模板总数: {total}")


if __name__ == "__main__":
    main()
