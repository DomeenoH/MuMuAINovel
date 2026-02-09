"""
结构蓝图数据模型 - Structure Blueprint Models

实现《诡秘之主》式的长篇结构管理：
- Thread (谜题线程) - 全书级真相线
- Clue (线索账本) - 可追踪线索
- Hub (枢纽场景) - 信息交换场景
- Milestone (进阶里程碑) - 成长节点
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class StructureThread(Base):
    """
    谜题线程 - 全书级真相线
    
    每条 Thread 是贯穿全书的核心谜题，逐步揭示答案。
    类似《诡秘之主》中的"真实历史"、"序列真相"等主线。
    """
    __tablename__ = "structure_threads"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 显示用 ID: T01, T02, ...
    thread_id = Column(String(10), nullable=False, comment="显示用ID如 T01, T02")
    title = Column(String(200), nullable=False, comment="线程标题")
    core_question = Column(Text, nullable=False, comment="核心问题")
    final_answer = Column(Text, comment="最终揭示（作者备忘，不对读者显示）")
    
    # 状态: pending/in_progress/revealed
    status = Column(String(20), default='pending', index=True, comment="状态: pending/in_progress/revealed")
    
    # 阶段揭示点 JSON: [{"volume": 1, "chapter": 10, "reveal": "..."}]
    reveal_schedule = Column(JSON, comment="阶段揭示点时间表")
    
    # 关联角色 ID 列表
    related_character_ids = Column(JSON, comment="关联角色ID列表")
    
    notes = Column(Text, comment="作者备注")
    color = Column(String(20), default="#3B82F6", comment="显示颜色")
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关联的线索
    clues = relationship("StructureClue", back_populates="thread", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<StructureThread({self.thread_id}: {self.title})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "thread_id": self.thread_id,
            "title": self.title,
            "core_question": self.core_question,
            "final_answer": self.final_answer,
            "status": self.status,
            "reveal_schedule": self.reveal_schedule or [],
            "related_character_ids": self.related_character_ids or [],
            "notes": self.notes,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StructureClue(Base):
    """
    线索账本 - 可追踪线索
    
    每条线索有「种下(Seed)→验证(Verify)→回收(Payoff)」的生命周期。
    载体必须具体化：录音、名单、监控帧、账本、残片、证词等。
    """
    __tablename__ = "structure_clues"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    thread_id = Column(String(36), ForeignKey("structure_threads.id", ondelete="SET NULL"), comment="关联的线程")
    
    # 显示用 ID: C01, C02, ...
    clue_id = Column(String(10), nullable=False, comment="显示用ID如 C01, C02")
    title = Column(String(200), nullable=False, comment="线索标题")
    description = Column(Text, comment="线索描述")
    
    # 载体：录音/名单/监控帧/账本/残片/证词
    carrier = Column(String(100), comment="线索载体（物证类型）")
    
    # 状态: seed/verified/payoff/red_herring
    status = Column(String(20), default='seed', index=True, comment="状态: seed/verified/payoff/red_herring")
    
    # 生命周期 JSON: {"seed": {"chapter": 3, "note": ""}, "verify": {...}, "payoff": {...}}
    lifecycle = Column(JSON, comment="生命周期记录")
    
    # 是否误导线索
    is_red_herring = Column(Boolean, default=False, comment="是否为误导线索")
    
    # 关联角色 ID 列表
    related_character_ids = Column(JSON, comment="关联角色ID列表")
    
    notes = Column(Text, comment="作者备注")
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 关联的线程
    thread = relationship("StructureThread", back_populates="clues")
    
    def __repr__(self):
        return f"<StructureClue({self.clue_id}: {self.title})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "thread_id": self.thread_id,
            "clue_id": self.clue_id,
            "title": self.title,
            "description": self.description,
            "carrier": self.carrier,
            "status": self.status,
            "lifecycle": self.lifecycle or {},
            "is_red_herring": self.is_red_herring,
            "related_character_ids": self.related_character_ids or [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StructureHub(Base):
    """
    枢纽场景 - 信息交换场景
    
    固定频率出现的场景，用于信息对账、交易、误导施放。
    类似《诡秘之主》中的"占卜屋"、"塔罗会"等。
    """
    __tablename__ = "structure_hubs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 显示用 ID: H01, H02, ...
    hub_id = Column(String(10), nullable=False, comment="显示用ID如 H01, H02")
    name = Column(String(200), nullable=False, comment="场景名称")
    location = Column(Text, comment="地点描述")
    
    # 出场频率: every_3_chapters / every_5_chapters / per_volume / as_needed
    frequency = Column(String(50), default='every_5_chapters', comment="出场频率")
    
    # 常驻角色 ID 列表
    resident_character_ids = Column(JSON, comment="常驻角色ID列表")
    
    # 功能列表: ["信息对账", "定价交易", "误导施放", "关系升级"]
    functions = Column(JSON, comment="功能列表")
    
    # 交易规则
    trading_rules = Column(Text, comment="交易规则")
    
    # 禁忌底线
    taboos = Column(Text, comment="禁忌底线")
    
    # 出场记录 JSON: [{"volume": 1, "chapter": 5, "summary": "..."}]
    appearances = Column(JSON, comment="出场记录")
    
    notes = Column(Text, comment="作者备注")
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<StructureHub({self.hub_id}: {self.name})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "hub_id": self.hub_id,
            "name": self.name,
            "location": self.location,
            "frequency": self.frequency,
            "resident_character_ids": self.resident_character_ids or [],
            "functions": self.functions or [],
            "trading_rules": self.trading_rules,
            "taboos": self.taboos,
            "appearances": self.appearances or [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StructureMilestone(Base):
    """
    进阶里程碑 - 成长节点
    
    每个里程碑必须有代价/后遗症，代价会反向制造新冲突。
    类似《诡秘之主》中的"进阶"机制。
    """
    __tablename__ = "structure_milestones"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 显示用 ID: M01, M02, ...
    milestone_id = Column(String(10), nullable=False, comment="显示用ID如 M01, M02")
    title = Column(String(200), nullable=False, comment="里程碑标题")
    description = Column(Text, comment="里程碑描述")
    
    # 达成条件清单 JSON: [{"item": "获得xxx", "met": false}]
    conditions = Column(JSON, comment="达成条件清单")
    
    # 代价
    cost = Column(Text, comment="代价描述")
    
    # 后遗症
    aftermath = Column(Text, comment="后遗症")
    
    # 状态: pending/in_progress/achieved
    status = Column(String(20), default='pending', index=True, comment="状态")
    
    # 目标章节
    target_chapter = Column(Integer, comment="目标达成章节")
    
    # 实际达成章节
    actual_chapter = Column(Integer, comment="实际达成章节")
    
    # 关联的线程 ID 列表
    related_thread_ids = Column(JSON, comment="关联线程ID列表")
    
    notes = Column(Text, comment="作者备注")
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    achieved_at = Column(DateTime, comment="达成时间")
    
    def __repr__(self):
        return f"<StructureMilestone({self.milestone_id}: {self.title})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "milestone_id": self.milestone_id,
            "title": self.title,
            "description": self.description,
            "conditions": self.conditions or [],
            "cost": self.cost,
            "aftermath": self.aftermath,
            "status": self.status,
            "target_chapter": self.target_chapter,
            "actual_chapter": self.actual_chapter,
            "related_thread_ids": self.related_thread_ids or [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "achieved_at": self.achieved_at.isoformat() if self.achieved_at else None,
        }
