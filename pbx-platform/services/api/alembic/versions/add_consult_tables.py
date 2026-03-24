"""add consultations and consult_categories tables

Revision ID: add_consult_tables
Revises: 90cd98a7506f
Create Date: 2026-03-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'add_consult_tables'
down_revision: Union[str, None] = '90cd98a7506f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. 카테고리 테이블 먼저 (consultations가 참조)
    op.create_table(
        'consult_categories',
        sa.Column('id',         sa.Integer(),  autoincrement=True, nullable=False),
        sa.Column('company_id', sa.Integer(),  nullable=False),
        sa.Column('parent_id',  sa.Integer(),  nullable=True),
        sa.Column('name',       sa.Text(),     nullable=False),
        sa.Column('depth',      sa.Integer(),  nullable=False),
        sa.Column('sort_order', sa.Integer(),  nullable=False, server_default='0'),
        sa.Column('is_active',  sa.Boolean(),  nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'],             ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'],  ['consult_categories.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_consult_categories_company_id', 'consult_categories', ['company_id'])
    op.create_index('idx_consult_categories_parent_id',  'consult_categories', ['parent_id'])
    op.create_index('idx_consult_categories_depth',      'consult_categories', ['depth'])

    # 2. 상담이력 테이블
    op.create_table(
        'consultations',
        sa.Column('id',          sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('call_id',     postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('agent_id',    sa.Integer(), nullable=False),
        sa.Column('company_id',  sa.Integer(), nullable=False),
        sa.Column('original_id', sa.BigInteger(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('category',    sa.Text(), nullable=True),
        sa.Column('memo',        sa.Text(), nullable=True),
        sa.Column('status',      sa.String(), nullable=False, server_default='ACTIVE'),
        sa.Column('started_at',  sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('ended_at',    sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at',  sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at',  sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['agent_id'],    ['user.id'],              ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['call_id'],     ['calls.id'],             ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['category_id'], ['consult_categories.id'],ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['company_id'],  ['company.id'],           ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['original_id'], ['consultations.id'],     ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_consultations_call_id',     'consultations', ['call_id'])
    op.create_index('idx_consultations_agent_id',    'consultations', ['agent_id'])
    op.create_index('idx_consultations_company_id',  'consultations', ['company_id'])
    op.create_index('idx_consultations_status',      'consultations', ['status'])
    op.create_index('idx_consultations_created_at',  'consultations', ['created_at'])
    op.create_index('idx_consultations_original_id', 'consultations', ['original_id'])
    op.create_index('idx_consultations_category_id', 'consultations', ['category_id'])


def downgrade() -> None:
    op.drop_table('consultations')
    op.drop_table('consult_categories')