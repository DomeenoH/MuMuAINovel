"""添加结构蓝图相关表结构

Revision ID: 8b2f5c7a9e3d
Revises: 421237957b27
Create Date: 2026-02-08 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b2f5c7a9e3d'
down_revision: Union[str, None] = '421237957b27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === StructureThread (谜题线程) ===
    op.create_table('structure_threads',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('thread_id', sa.String(length=10), nullable=False, comment='显示用ID如 T01, T02'),
        sa.Column('title', sa.String(length=200), nullable=False, comment='线程标题'),
        sa.Column('core_question', sa.Text(), nullable=False, comment='核心问题'),
        sa.Column('final_answer', sa.Text(), nullable=True, comment='最终揭示'),
        sa.Column('status', sa.String(length=20), nullable=True, comment='状态: pending/in_progress/revealed'),
        sa.Column('reveal_schedule', sa.JSON(), nullable=True, comment='阶段揭示点时间表'),
        sa.Column('related_character_ids', sa.JSON(), nullable=True, comment='关联角色ID列表'),
        sa.Column('notes', sa.Text(), nullable=True, comment='作者备注'),
        sa.Column('color', sa.String(length=20), nullable=True, comment='显示颜色'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_threads_project_id', 'structure_threads', ['project_id'], unique=False)
    op.create_index('idx_threads_status', 'structure_threads', ['status'], unique=False)

    # === StructureClue (线索账本) ===
    op.create_table('structure_clues',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('thread_id', sa.String(length=36), nullable=True, comment='关联的线程'),
        sa.Column('clue_id', sa.String(length=10), nullable=False, comment='显示用ID如 C01, C02'),
        sa.Column('title', sa.String(length=200), nullable=False, comment='线索标题'),
        sa.Column('description', sa.Text(), nullable=True, comment='线索描述'),
        sa.Column('carrier', sa.String(length=100), nullable=True, comment='线索载体'),
        sa.Column('status', sa.String(length=20), nullable=True, comment='状态: seed/verified/payoff/red_herring'),
        sa.Column('lifecycle', sa.JSON(), nullable=True, comment='生命周期记录'),
        sa.Column('is_red_herring', sa.Boolean(), nullable=True, comment='是否为误导线索'),
        sa.Column('related_character_ids', sa.JSON(), nullable=True, comment='关联角色ID列表'),
        sa.Column('notes', sa.Text(), nullable=True, comment='作者备注'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['thread_id'], ['structure_threads.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_clues_project_id', 'structure_clues', ['project_id'], unique=False)
    op.create_index('idx_clues_status', 'structure_clues', ['status'], unique=False)
    op.create_index('idx_clues_thread_id', 'structure_clues', ['thread_id'], unique=False)

    # === StructureHub (枢纽场景) ===
    op.create_table('structure_hubs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('hub_id', sa.String(length=10), nullable=False, comment='显示用ID如 H01, H02'),
        sa.Column('name', sa.String(length=200), nullable=False, comment='场景名称'),
        sa.Column('location', sa.Text(), nullable=True, comment='地点描述'),
        sa.Column('frequency', sa.String(length=50), nullable=True, comment='出场频率'),
        sa.Column('resident_character_ids', sa.JSON(), nullable=True, comment='常驻角色ID列表'),
        sa.Column('functions', sa.JSON(), nullable=True, comment='功能列表'),
        sa.Column('trading_rules', sa.Text(), nullable=True, comment='交易规则'),
        sa.Column('taboos', sa.Text(), nullable=True, comment='禁忌底线'),
        sa.Column('appearances', sa.JSON(), nullable=True, comment='出场记录'),
        sa.Column('notes', sa.Text(), nullable=True, comment='作者备注'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_hubs_project_id', 'structure_hubs', ['project_id'], unique=False)

    # === StructureMilestone (进阶里程碑) ===
    op.create_table('structure_milestones',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('milestone_id', sa.String(length=10), nullable=False, comment='显示用ID如 M01, M02'),
        sa.Column('title', sa.String(length=200), nullable=False, comment='里程碑标题'),
        sa.Column('description', sa.Text(), nullable=True, comment='里程碑描述'),
        sa.Column('conditions', sa.JSON(), nullable=True, comment='达成条件清单'),
        sa.Column('cost', sa.Text(), nullable=True, comment='代价描述'),
        sa.Column('aftermath', sa.Text(), nullable=True, comment='后遗症'),
        sa.Column('status', sa.String(length=20), nullable=True, comment='状态'),
        sa.Column('target_chapter', sa.Integer(), nullable=True, comment='目标达成章节'),
        sa.Column('actual_chapter', sa.Integer(), nullable=True, comment='实际达成章节'),
        sa.Column('related_thread_ids', sa.JSON(), nullable=True, comment='关联线程ID列表'),
        sa.Column('notes', sa.Text(), nullable=True, comment='作者备注'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('achieved_at', sa.DateTime(), nullable=True, comment='达成时间'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_milestones_project_id', 'structure_milestones', ['project_id'], unique=False)
    op.create_index('idx_milestones_status', 'structure_milestones', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_milestones_status', table_name='structure_milestones')
    op.drop_index('idx_milestones_project_id', table_name='structure_milestones')
    op.drop_table('structure_milestones')
    
    op.drop_index('idx_hubs_project_id', table_name='structure_hubs')
    op.drop_table('structure_hubs')
    
    op.drop_index('idx_clues_thread_id', table_name='structure_clues')
    op.drop_index('idx_clues_status', table_name='structure_clues')
    op.drop_index('idx_clues_project_id', table_name='structure_clues')
    op.drop_table('structure_clues')
    
    op.drop_index('idx_threads_status', table_name='structure_threads')
    op.drop_index('idx_threads_project_id', table_name='structure_threads')
    op.drop_table('structure_threads')
