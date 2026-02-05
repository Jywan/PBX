from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from pbx_common.models import Company
from pbx_common.utils.crypto import encrypt_data, decrypt_data
from app.db.session import get_db
from app.schemas.company import CompanyCreate, CompanyResponse

router = APIRouter(prefix="/api/v1", tags=["Companies"], responses={404: {"description": "Not found"}})

@router.post("/companies", response_model=CompanyResponse)
async def create_company(company_in: CompanyCreate, db: AsyncSession = Depends(get_db)):

    # 대표자 번호가 있으면 암호화
    encrypted_phone = encrypt_data(company_in.ceo_phone) if company_in.ceo_phone else None

    new_company = Company(
        company_name=company_in.company_name,
        ceo_name=company_in.ceo_name,
        ceo_phone=encrypted_phone,
    )
    
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)

    # 응답으로 나갈때는 대표자 번호를 복호화 해서 출력
    if new_company.ceo_phone:
        new_company.ceo_phone = decrypt_data(new_company.ceo_phone)

    return new_company

@router.get("/companies", response_model=List[CompanyResponse])
async def read_companies(db: AsyncSession = Depends(get_db)):
    query = select(Company).order_by(Company.id.desc())
    result = await db.execute(query)
    return result.scalars().all()