"""结构蓝图 Pydantic Schema"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ===== Thread (谜题线程) =====

class ThreadBase(BaseModel):
    """线程基础字段"""
    thread_id: str = Field(..., description="显示用ID如 T01")
    title: str = Field(..., max_length=200, description="线程标题")
    core_question: str = Field(..., description="核心问题")
    final_answer: Optional[str] = Field(None, description="最终揭示")
    status: str = Field("pending", description="状态: pending/in_progress/revealed")
    reveal_schedule: Optional[List[Dict[str, Any]]] = Field(None, description="阶段揭示点")
    related_character_ids: Optional[List[str]] = Field(None, description="关联角色ID")
    notes: Optional[str] = Field(None, description="备注")
    color: Optional[str] = Field("#3B82F6", description="显示颜色")


class ThreadCreate(ThreadBase):
    """创建线程"""
    project_id: str


class ThreadUpdate(BaseModel):
    """更新线程"""
    thread_id: Optional[str] = None
    title: Optional[str] = None
    core_question: Optional[str] = None
    final_answer: Optional[str] = None
    status: Optional[str] = None
    reveal_schedule: Optional[List[Dict[str, Any]]] = None
    related_character_ids: Optional[List[str]] = None
    notes: Optional[str] = None
    color: Optional[str] = None


class ThreadResponse(ThreadBase):
    """线程响应"""
    id: str
    project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Clue (线索) =====

class ClueBase(BaseModel):
    """线索基础字段"""
    clue_id: str = Field(..., description="显示用ID如 C01")
    title: str = Field(..., max_length=200, description="线索标题")
    description: Optional[str] = Field(None, description="描述")
    carrier: Optional[str] = Field(None, description="线索载体")
    status: str = Field("seed", description="状态: seed/verified/payoff/red_herring")
    lifecycle: Optional[Dict[str, Any]] = Field(None, description="生命周期")
    is_red_herring: bool = Field(False, description="是否误导")
    related_character_ids: Optional[List[str]] = Field(None, description="关联角色")
    notes: Optional[str] = Field(None, description="备注")
    thread_id: Optional[str] = Field(None, description="关联线程ID")


class ClueCreate(ClueBase):
    """创建线索"""
    project_id: str


class ClueUpdate(BaseModel):
    """更新线索"""
    clue_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    carrier: Optional[str] = None
    status: Optional[str] = None
    lifecycle: Optional[Dict[str, Any]] = None
    is_red_herring: Optional[bool] = None
    related_character_ids: Optional[List[str]] = None
    notes: Optional[str] = None
    thread_id: Optional[str] = None


class ClueResponse(ClueBase):
    """线索响应"""
    id: str
    project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Hub (枢纽场景) =====

class HubBase(BaseModel):
    """枢纽基础字段"""
    hub_id: str = Field(..., description="显示用ID如 H01")
    name: str = Field(..., max_length=200, description="场景名称")
    location: Optional[str] = Field(None, description="地点描述")
    frequency: str = Field("every_5_chapters", description="出场频率")
    resident_character_ids: Optional[List[str]] = Field(None, description="常驻角色")
    functions: Optional[List[str]] = Field(None, description="功能列表")
    trading_rules: Optional[str] = Field(None, description="交易规则")
    taboos: Optional[str] = Field(None, description="禁忌")
    appearances: Optional[List[Dict[str, Any]]] = Field(None, description="出场记录")
    notes: Optional[str] = Field(None, description="备注")


class HubCreate(HubBase):
    """创建枢纽"""
    project_id: str


class HubUpdate(BaseModel):
    """更新枢纽"""
    hub_id: Optional[str] = None
    name: Optional[str] = None
    location: Optional[str] = None
    frequency: Optional[str] = None
    resident_character_ids: Optional[List[str]] = None
    functions: Optional[List[str]] = None
    trading_rules: Optional[str] = None
    taboos: Optional[str] = None
    appearances: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


class HubResponse(HubBase):
    """枢纽响应"""
    id: str
    project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Milestone (里程碑) =====

class MilestoneBase(BaseModel):
    """里程碑基础字段"""
    milestone_id: str = Field(..., description="显示用ID如 M01")
    title: str = Field(..., max_length=200, description="标题")
    description: Optional[str] = Field(None, description="描述")
    conditions: Optional[List[Dict[str, Any]]] = Field(None, description="达成条件")
    cost: Optional[str] = Field(None, description="代价")
    aftermath: Optional[str] = Field(None, description="后遗症")
    status: str = Field("pending", description="状态")
    target_chapter: Optional[int] = Field(None, description="目标章节")
    actual_chapter: Optional[int] = Field(None, description="实际章节")
    related_thread_ids: Optional[List[str]] = Field(None, description="关联线程")
    notes: Optional[str] = Field(None, description="备注")


class MilestoneCreate(MilestoneBase):
    """创建里程碑"""
    project_id: str


class MilestoneUpdate(BaseModel):
    """更新里程碑"""
    milestone_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    cost: Optional[str] = None
    aftermath: Optional[str] = None
    status: Optional[str] = None
    target_chapter: Optional[int] = None
    actual_chapter: Optional[int] = None
    related_thread_ids: Optional[List[str]] = None
    notes: Optional[str] = None


class MilestoneResponse(MilestoneBase):
    """里程碑响应"""
    id: str
    project_id: str
    achieved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Blueprint 总览 =====

class BlueprintOverview(BaseModel):
    """结构蓝图总览"""
    project_id: str
    threads: List[ThreadResponse]
    clues: List[ClueResponse]
    hubs: List[HubResponse]
    milestones: List[MilestoneResponse]
    stats: Dict[str, Any]
