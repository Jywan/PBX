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

    # 암호화 대상 (대표자 전화번호, 사업자등록번호, 팩스번호)
    encrypted_phone = encrypt_data(company_in.manager_phone) if company_in.manager_phone else None
    encrypted_business_number = encrypt_data(company_in.business_number) if company_in.business_number else None
    encrypted_fax = encrypt_data(company_in.fax) if company_in.fax else None

    new_company = Company(
        company_name=company_in.company_name,
        manager_name=company_in.manager_name,
        manager_phone=encrypted_phone,
        use_callback=company_in.use_callback,
        is_active=company_in.is_active,
        business_number=encrypted_business_number,
        address=company_in.address,
        address_detail=company_in.address_detail,
        postal_code=company_in.postal_code,
        email=company_in.email,
        fax=encrypted_fax
    )
    
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)

    # 응답 시 민감 정보 복호화
    if new_company.manager_phone:
        new_company.manager_phone = decrypt_data(new_company.manager_phone)
    if new_company.business_number:
        new_company.business_number = decrypt_data(new_company.business_number)
    if new_company.fax:
        new_company.fax = decrypt_data(new_company.fax)

    return new_company

@router.get("", response_model=List[CompanyResponse])
async def read_companies(db: AsyncSession = Depends(get_db)):
    query = select(Company).order_by(Company.id.desc())
    result = await db.execute(query)
    companies = result.scalars().all()

    # 리스트를 순회하며 암호화된 필드 복호화
    for company in companies:
        if company.manager_phone:
            try:
                company.manager_phone = decrypt_data(company.manager_phone)
            except Exception:
                pass
        if company.business_number:
            try:
                company.business_number = decrypt_data(company.business_number)
            except Exception:
                pass
        if company.fax:
            try:
                company.fax = decrypt_data(company.fax)
            except Exception:
                pass

    return companies


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: int, company_in: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="업체를 찾을 수 없습니다.")
    
    update_data = company_in.model_dump(exclude_unset=True)

    # 민감 정보 암호화 처리
    if "manager_phone" in update_data and update_data["manager_phone"]:
        update_data["manager_phone"] = encrypt_data(update_data["manager_phone"])
    if "business_number" in update_data and update_data["business_number"]:
        update_data["business_number"] = encrypt_data(update_data["business_number"])
    if "fax" in update_data and update_data["fax"]:
        update_data["fax"] = encrypt_data(update_data["fax"])

    for key, value in update_data.items():
        if hasattr(company, key):
            setattr(company, key, value)

    await db.commit()
    await db.refresh(company)

    # 응답 시 민감 정보 복호화
    if company.manager_phone:
        company.manager_phone = decrypt_data(company.manager_phone)
    if company.business_number:
        company.business_number = decrypt_data(company.business_number)
    if company.fax:
        company.fax = decrypt_data(company.fax)

    return company

