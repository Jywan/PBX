from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from pbx_common.models import Company
from pbx_common.utils.crypto import encrypt_data, decrypt_data
from app.db.session import get_db
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate
from app.deps import get_current_user

router = APIRouter(prefix="/api/v1/companies", tags=["Companies"], dependencies=[Depends(get_current_user)])

@router.post("", response_model=CompanyResponse)
async def create_company(company_in: CompanyCreate, db: AsyncSession = Depends(get_db)):

    # 대표자 번호가 있으면 암호화
    encrypted_phone = encrypt_data(company_in.manager_phone) if company_in.manager_phone else None

    new_company = Company(
        company_name=company_in.company_name,
        manager_name=company_in.manager_name,
        manager_phone=encrypted_phone,
        use_callback=company_in.use_callback,
        is_active=company_in.is_active
    )
    
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)

    # 응답으로 나갈때는 대표자 번호를 복호화 해서 출력
    if new_company.manager_phone:
        new_company.manager_phone = decrypt_data(new_company.manager_phone)

    return new_company

@router.get("", response_model=List[CompanyResponse])
async def read_companies(db: AsyncSession = Depends(get_db)):
    query = select(Company).order_by(Company.id.desc())
    result = await db.execute(query)
    companies = result.scalars().all() # 1. 리스트 가져오기

    # 2. 리스트를 순회하며 전화번호 복호화
    for company in companies:
        if company.manager_phone:
            try:
                company.manager_phone = decrypt_data(company.manager_phone)
            except Exception:
                pass

    return companies


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: int, company_in: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="업체를 찾을 수 없습니다.")
    
    update_data = company_in.model_dump(exclude_unset=True)

    if "manager_phone" in update_data and update_data["manager_phone"]:
        update_data["manager_phone"] = encrypt_data(update_data["manager_phone"])

    for key, value in update_data.items():
        if hasattr(company, key):
            setattr(company, key, value)

    await db.commit()
    await db.refresh(company)

    if company.manager_phone:
        company.manager_phone = decrypt_data(company.manager_phone)

    return company
