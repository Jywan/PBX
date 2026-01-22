from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from pbx_common.models import Company
from app.db.session import get_db
from app.schemas.company import CompanyCreate, CompanyResponse

router = APIRouter()

@router.post("/companies", response_model=CompanyResponse)
async def create_company(company_in: CompanyCreate, db: AsyncSession = Depends(get_db)):
    new_company = Company(
        company_name=company_in.company_name,
        ceo_name=company_in.ceo_name,
        ceo_phone=company_in.ceo_phone, # 암호화된 상태로 전달받는다고 가정
    )
    
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)
    return new_company

@router.get("/companies", response_model=List[CompanyResponse])
async def read_companies(db: AsyncSession = Depends(get_db)):
    query = select(Company).order_by(Company.id.desc())
    result = await db.execute(query)
    return result.scalars().all()