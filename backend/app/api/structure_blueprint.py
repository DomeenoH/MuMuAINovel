"""结构蓝图 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional, List

from app.database import get_db
from app.api.common import verify_project_access
from app.models.structure_blueprint import (
    StructureThread, StructureClue, StructureHub, StructureMilestone
)
from app.schemas.structure_blueprint import (
    ThreadCreate, ThreadUpdate, ThreadResponse,
    ClueCreate, ClueUpdate, ClueResponse,
    HubCreate, HubUpdate, HubResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse,
    BlueprintOverview
)
from app.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/blueprint", tags=["structure_blueprint"])


# ===== Blueprint 总览 =====

@router.get("/projects/{project_id}", response_model=BlueprintOverview)
async def get_project_blueprint(
    project_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """获取项目完整结构蓝图"""
    try:
        user_id = getattr(request.state, 'user_id', None)
        await verify_project_access(project_id, user_id, db)
        
        # 获取所有数据
        threads_result = await db.execute(
            select(StructureThread).where(StructureThread.project_id == project_id)
        )
        threads = [t.to_dict() for t in threads_result.scalars().all()]
        
        clues_result = await db.execute(
            select(StructureClue).where(StructureClue.project_id == project_id)
        )
        clues = [c.to_dict() for c in clues_result.scalars().all()]
        
        hubs_result = await db.execute(
            select(StructureHub).where(StructureHub.project_id == project_id)
        )
        hubs = [h.to_dict() for h in hubs_result.scalars().all()]
        
        milestones_result = await db.execute(
            select(StructureMilestone).where(StructureMilestone.project_id == project_id)
        )
        milestones = [m.to_dict() for m in milestones_result.scalars().all()]
        
        # 统计
        stats = {
            "threads_total": len(threads),
            "threads_revealed": len([t for t in threads if t.get("status") == "revealed"]),
            "clues_total": len(clues),
            "clues_payoff": len([c for c in clues if c.get("status") == "payoff"]),
            "hubs_total": len(hubs),
            "milestones_total": len(milestones),
            "milestones_achieved": len([m for m in milestones if m.get("status") == "achieved"]),
        }
        
        return {
            "project_id": project_id,
            "threads": threads,
            "clues": clues,
            "hubs": hubs,
            "milestones": milestones,
            "stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取结构蓝图失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取结构蓝图失败: {str(e)}")


# ===== Thread (谜题线程) CRUD =====

@router.get("/threads/projects/{project_id}")
async def list_threads(
    project_id: str,
    request: Request,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取项目所有线程"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(project_id, user_id, db)
    
    query = select(StructureThread).where(StructureThread.project_id == project_id)
    if status:
        query = query.where(StructureThread.status == status)
    
    result = await db.execute(query)
    threads = result.scalars().all()
    return {"items": [t.to_dict() for t in threads], "total": len(threads)}


@router.post("/threads", response_model=ThreadResponse)
async def create_thread(
    data: ThreadCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """创建线程"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(data.project_id, user_id, db)
    
    thread = StructureThread(
        project_id=data.project_id,
        thread_id=data.thread_id,
        title=data.title,
        core_question=data.core_question,
        final_answer=data.final_answer,
        status=data.status,
        reveal_schedule=data.reveal_schedule,
        related_character_ids=data.related_character_ids,
        notes=data.notes,
        color=data.color
    )
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread.to_dict()


@router.put("/threads/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: str,
    data: ThreadUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """更新线程"""
    result = await db.execute(select(StructureThread).where(StructureThread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="线程不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(thread.project_id, user_id, db)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(thread, key, value)
    
    await db.commit()
    await db.refresh(thread)
    return thread.to_dict()


@router.delete("/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """删除线程"""
    result = await db.execute(select(StructureThread).where(StructureThread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="线程不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(thread.project_id, user_id, db)
    
    await db.delete(thread)
    await db.commit()
    return {"message": "线程删除成功", "id": thread_id}


# ===== Clue (线索) CRUD =====

@router.get("/clues/projects/{project_id}")
async def list_clues(
    project_id: str,
    request: Request,
    status: Optional[str] = None,
    thread_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取项目所有线索"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(project_id, user_id, db)
    
    query = select(StructureClue).where(StructureClue.project_id == project_id)
    if status:
        query = query.where(StructureClue.status == status)
    if thread_id:
        query = query.where(StructureClue.thread_id == thread_id)
    
    result = await db.execute(query)
    clues = result.scalars().all()
    return {"items": [c.to_dict() for c in clues], "total": len(clues)}


@router.post("/clues", response_model=ClueResponse)
async def create_clue(
    data: ClueCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """创建线索"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(data.project_id, user_id, db)
    
    clue = StructureClue(
        project_id=data.project_id,
        thread_id=data.thread_id,
        clue_id=data.clue_id,
        title=data.title,
        description=data.description,
        carrier=data.carrier,
        status=data.status,
        lifecycle=data.lifecycle,
        is_red_herring=data.is_red_herring,
        related_character_ids=data.related_character_ids,
        notes=data.notes
    )
    db.add(clue)
    await db.commit()
    await db.refresh(clue)
    return clue.to_dict()


@router.put("/clues/{clue_id}", response_model=ClueResponse)
async def update_clue(
    clue_id: str,
    data: ClueUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """更新线索"""
    result = await db.execute(select(StructureClue).where(StructureClue.id == clue_id))
    clue = result.scalar_one_or_none()
    if not clue:
        raise HTTPException(status_code=404, detail="线索不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(clue.project_id, user_id, db)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(clue, key, value)
    
    await db.commit()
    await db.refresh(clue)
    return clue.to_dict()


@router.delete("/clues/{clue_id}")
async def delete_clue(
    clue_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """删除线索"""
    result = await db.execute(select(StructureClue).where(StructureClue.id == clue_id))
    clue = result.scalar_one_or_none()
    if not clue:
        raise HTTPException(status_code=404, detail="线索不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(clue.project_id, user_id, db)
    
    await db.delete(clue)
    await db.commit()
    return {"message": "线索删除成功", "id": clue_id}


# ===== Hub (枢纽场景) CRUD =====

@router.get("/hubs/projects/{project_id}")
async def list_hubs(
    project_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """获取项目所有枢纽"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(project_id, user_id, db)
    
    result = await db.execute(
        select(StructureHub).where(StructureHub.project_id == project_id)
    )
    hubs = result.scalars().all()
    return {"items": [h.to_dict() for h in hubs], "total": len(hubs)}


@router.post("/hubs", response_model=HubResponse)
async def create_hub(
    data: HubCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """创建枢纽"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(data.project_id, user_id, db)
    
    hub = StructureHub(
        project_id=data.project_id,
        hub_id=data.hub_id,
        name=data.name,
        location=data.location,
        frequency=data.frequency,
        resident_character_ids=data.resident_character_ids,
        functions=data.functions,
        trading_rules=data.trading_rules,
        taboos=data.taboos,
        appearances=data.appearances,
        notes=data.notes
    )
    db.add(hub)
    await db.commit()
    await db.refresh(hub)
    return hub.to_dict()


@router.put("/hubs/{hub_id}", response_model=HubResponse)
async def update_hub(
    hub_id: str,
    data: HubUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """更新枢纽"""
    result = await db.execute(select(StructureHub).where(StructureHub.id == hub_id))
    hub = result.scalar_one_or_none()
    if not hub:
        raise HTTPException(status_code=404, detail="枢纽不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(hub.project_id, user_id, db)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(hub, key, value)
    
    await db.commit()
    await db.refresh(hub)
    return hub.to_dict()


@router.delete("/hubs/{hub_id}")
async def delete_hub(
    hub_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """删除枢纽"""
    result = await db.execute(select(StructureHub).where(StructureHub.id == hub_id))
    hub = result.scalar_one_or_none()
    if not hub:
        raise HTTPException(status_code=404, detail="枢纽不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(hub.project_id, user_id, db)
    
    await db.delete(hub)
    await db.commit()
    return {"message": "枢纽删除成功", "id": hub_id}


# ===== Milestone (里程碑) CRUD =====

@router.get("/milestones/projects/{project_id}")
async def list_milestones(
    project_id: str,
    request: Request,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取项目所有里程碑"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(project_id, user_id, db)
    
    query = select(StructureMilestone).where(StructureMilestone.project_id == project_id)
    if status:
        query = query.where(StructureMilestone.status == status)
    
    result = await db.execute(query)
    milestones = result.scalars().all()
    return {"items": [m.to_dict() for m in milestones], "total": len(milestones)}


@router.post("/milestones", response_model=MilestoneResponse)
async def create_milestone(
    data: MilestoneCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """创建里程碑"""
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(data.project_id, user_id, db)
    
    milestone = StructureMilestone(
        project_id=data.project_id,
        milestone_id=data.milestone_id,
        title=data.title,
        description=data.description,
        conditions=data.conditions,
        cost=data.cost,
        aftermath=data.aftermath,
        status=data.status,
        target_chapter=data.target_chapter,
        actual_chapter=data.actual_chapter,
        related_thread_ids=data.related_thread_ids,
        notes=data.notes
    )
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone.to_dict()


@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: str,
    data: MilestoneUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """更新里程碑"""
    result = await db.execute(
        select(StructureMilestone).where(StructureMilestone.id == milestone_id)
    )
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=404, detail="里程碑不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(milestone.project_id, user_id, db)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(milestone, key, value)
    
    await db.commit()
    await db.refresh(milestone)
    return milestone.to_dict()


@router.delete("/milestones/{milestone_id}")
async def delete_milestone(
    milestone_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """删除里程碑"""
    result = await db.execute(
        select(StructureMilestone).where(StructureMilestone.id == milestone_id)
    )
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=404, detail="里程碑不存在")
    
    user_id = getattr(request.state, 'user_id', None)
    await verify_project_access(milestone.project_id, user_id, db)
    
    await db.delete(milestone)
    await db.commit()
    return {"message": "里程碑删除成功", "id": milestone_id}
