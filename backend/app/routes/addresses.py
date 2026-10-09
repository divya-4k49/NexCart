from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.customer import Customer
from app.models.address import Address
from app.schemas.address import (
    AddressCreateRequest,
    AddressUpdateRequest,
    AddressResponse,
)
from app.schemas.auth import MessageResponse
from app.utils.dependencies import get_current_customer

router = APIRouter(prefix="/api/addresses", tags=["Customer Address Book"])


@router.get("", response_model=List[AddressResponse], summary="List all saved addresses for current customer")
def get_customer_addresses(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Returns all active saved delivery destinations for the customer.
    Default address is returned first.
    """
    return (
        db.query(Address)
        .filter(
            Address.customer_id == current_customer.customer_id,
            Address.is_active == True
        )
        .order_by(Address.is_default.desc(), Address.address_id.desc())
        .all()
    )


@router.get("/{address_id}", response_model=AddressResponse, summary="Get single address by ID")
def get_address_by_id(
    address_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Retrieves a specific address if owned by the logged-in customer.
    """
    address = db.query(Address).filter(
        Address.address_id == address_id,
        Address.customer_id == current_customer.customer_id,
        Address.is_active == True
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Address #{address_id} not found."
        )

    return address


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED, summary="Add a new delivery address")
def create_address(
    payload: AddressCreateRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Adds a new address to the customer's address book:
    - If marked as default or customer's first address, sets as default and unsets others.
    """
    # Count current active addresses
    active_count = db.query(Address).filter(
        Address.customer_id == current_customer.customer_id,
        Address.is_active == True
    ).count()

    should_be_default = payload.is_default or (active_count == 0)

    if should_be_default:
        db.query(Address).filter(
            Address.customer_id == current_customer.customer_id
        ).update({"is_default": False})

    new_address = Address(
        customer_id=current_customer.customer_id,
        address_type=payload.address_type.strip(),
        recipient_name=payload.recipient_name.strip(),
        phone=payload.phone.strip(),
        street_address=payload.street_address.strip(),
        city=payload.city.strip(),
        state=payload.state.strip(),
        postal_code=payload.postal_code.strip(),
        country=payload.country.strip(),
        is_default=should_be_default,
        is_active=True
    )

    db.add(new_address)
    db.commit()
    db.refresh(new_address)

    return new_address


@router.put("/{address_id}", response_model=AddressResponse, summary="Update an existing address")
def update_address(
    address_id: int,
    payload: AddressUpdateRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Updates an address belonging to the customer.
    """
    address = db.query(Address).filter(
        Address.address_id == address_id,
        Address.customer_id == current_customer.customer_id,
        Address.is_active == True
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Address #{address_id} not found."
        )

    # If setting to default, clear other default flags
    if payload.is_default is True:
        db.query(Address).filter(
            Address.customer_id == current_customer.customer_id
        ).update({"is_default": False})
        address.is_default = True

    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None and hasattr(address, field):
            setattr(address, field, val.strip() if isinstance(val, str) else val)

    db.commit()
    db.refresh(address)

    return address


@router.put("/{address_id}/default", response_model=AddressResponse, summary="Set an address as default")
def set_default_address(
    address_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Sets a specific address as the customer's default delivery address.
    """
    address = db.query(Address).filter(
        Address.address_id == address_id,
        Address.customer_id == current_customer.customer_id,
        Address.is_active == True
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Address #{address_id} not found."
        )

    db.query(Address).filter(
        Address.customer_id == current_customer.customer_id
    ).update({"is_default": False})

    address.is_default = True
    db.commit()
    db.refresh(address)

    return address


@router.delete("/{address_id}", response_model=MessageResponse, summary="Soft-delete a delivery address")
def delete_address(
    address_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Soft-deletes an address (`is_active = FALSE`):
    - Preserves foreign key referential integrity with historical orders in `orders.address_id`.
    - If the deleted address was default, marks another active address as default.
    """
    address = db.query(Address).filter(
        Address.address_id == address_id,
        Address.customer_id == current_customer.customer_id,
        Address.is_active == True
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Address #{address_id} not found."
        )

    was_default = address.is_default
    address.is_active = False
    address.is_default = False

    if was_default:
        next_address = db.query(Address).filter(
            Address.customer_id == current_customer.customer_id,
            Address.address_id != address_id,
            Address.is_active == True
        ).first()
        if next_address:
            next_address.is_default = True

    db.commit()

    return MessageResponse(
        message=f"Address #{address_id} has been removed from your address book.",
        status="success"
    )
