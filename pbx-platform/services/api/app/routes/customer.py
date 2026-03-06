from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from pbx_common.models import Customer, CustomerGroup
from app.db.session import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.deps import get_current_user, require_permission

router = APIRouter(
    prefix="/api/v1/customers",
    tags=["Customers"],
    dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=List[CustomerResponse])
async def read_customers(
    group:  Optional[str] = None,
    search: Optional[str] = None,
    skip:   int = 0,
    limit:  int = 200,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("customer-search"))
):
    query = select(Customer).where(Customer.is_active == True).order_by(Customer.created_at.desc())

    if group and group != "all":
        try:
            query = query.where(Customer.group == CustomerGroup(group))
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 그룹입니다.")

    result = await db.execute(query.offset(skip).limit(limit))
    customers = result.scalars().all()

    if search:
        q = search.lower()
        customers = [
            c for c in customers
            if q in c.name.lower()
            or q in c.phone.lower()
            or (c.company_name and q in c.company_name.lower())
        ]

    return customers


@router.post("", response_model=CustomerResponse)
async def create_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("customer-create"))
):
    try:
        group = CustomerGroup(customer_in.group)
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 그룹입니다.")

    new_customer = Customer(
        name=customer_in.name,
        phone=customer_in.phone,
        email=customer_in.email,
        company_id=customer_in.company_id,
        group=group,
        memo=customer_in.memo,
    )
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    return new_customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("customer-update"))
):
    customer = await db.get(Customer, customer_id)
    if not customer or not customer.is_active:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")

    update_data = customer_in.model_dump(exclude_unset=True)

    if "group" in update_data:
        try:
            update_data["group"] = CustomerGroup(update_data["group"])
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 그룹입니다.")

    for key, value in update_data.items():
        setattr(customer, key, value)

    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_permission("customer-delete"))
):
    customer = await db.get(Customer, customer_id)
    if not customer or not customer.is_active:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")

    customer.is_active = False
    customer.deactivated_at = datetime.now(timezone.utc)
    await db.commit()