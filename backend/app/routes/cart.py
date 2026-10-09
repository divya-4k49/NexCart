from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.customer import Customer
from app.models.product import Product
from app.models.cart import Cart
from app.models.inventory import Inventory
from app.schemas.cart import (
    AddToCartRequest,
    UpdateCartItemRequest,
    CartItemResponse,
    CartSummaryResponse,
)
from app.utils.dependencies import get_current_customer

router = APIRouter(prefix="/api/cart", tags=["Shopping Cart"])

FREE_SHIPPING_THRESHOLD = Decimal("999.00")
STANDARD_SHIPPING_FEE = Decimal("99.00")


def calculate_cart_summary(customer_id: int, db: Session) -> CartSummaryResponse:
    """
    Computes real-time cart summary directly from MySQL tables:
    - Resolves 1:1 stock availability for each cart line item.
    - Calculates subtotal and applies free shipping logic.
    """
    cart_items = (
        db.query(Cart)
        .filter(Cart.customer_id == customer_id)
        .order_by(Cart.cart_id.asc())
        .all()
    )

    items_response = []
    subtotal = Decimal("0.00")
    total_qty = 0

    for item in cart_items:
        prod = item.product
        inv = prod.inventory
        stock = inv.quantity if inv else 0
        unit_price = Decimal(str(prod.price))
        item_total = unit_price * item.quantity
        is_sufficient = (stock >= item.quantity)

        subtotal += item_total
        total_qty += item.quantity

        items_response.append(
            CartItemResponse(
                cart_id=item.cart_id,
                product_id=prod.product_id,
                product_name=prod.product_name,
                product_slug=prod.slug,
                product_image=prod.image_url,
                category_name=prod.category.category_name,
                unit_price=unit_price,
                quantity=item.quantity,
                item_total=item_total,
                stock_available=stock,
                is_stock_sufficient=is_sufficient
            )
        )

    # Free shipping rule: Free for orders >= Rs. 999, else Rs. 99
    if total_qty == 0:
        shipping_fee = Decimal("0.00")
    elif subtotal >= FREE_SHIPPING_THRESHOLD:
        shipping_fee = Decimal("0.00")
    else:
        shipping_fee = STANDARD_SHIPPING_FEE

    grand_total = subtotal + shipping_fee

    return CartSummaryResponse(
        items=items_response,
        total_items=total_qty,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        grand_total=grand_total,
        free_shipping_threshold=FREE_SHIPPING_THRESHOLD
    )


# ==============================================================================
# 1. GET ACTIVE CART
# ==============================================================================
@router.get("", response_model=CartSummaryResponse, summary="Get current customer's shopping cart")
def get_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Retrieves the authenticated customer's database-backed cart with itemized totals.
    """
    return calculate_cart_summary(current_customer.customer_id, db)


# ==============================================================================
# 2. ADD ITEM TO CART
# ==============================================================================
@router.post("", response_model=CartSummaryResponse, status_code=status.HTTP_200_OK, summary="Add item to shopping cart")
def add_to_cart(
    payload: AddToCartRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Adds a product to the customer's cart:
    - Verifies product exists and is active.
    - Validates requested quantity against live stock in `inventory`.
    - If product already in cart, increments quantity.
    - Otherwise, creates a new cart row.
    """
    product = db.query(Product).filter(Product.product_id == payload.product_id).first()
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or currently unavailable"
        )

    # Check 1:1 stock
    inv = product.inventory
    stock_available = inv.quantity if inv else 0
    if stock_available <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{product.product_name}' is currently out of stock."
        )

    # Check if already in cart
    existing_item = db.query(Cart).filter(
        Cart.customer_id == current_customer.customer_id,
        Cart.product_id == payload.product_id
    ).first()

    if existing_item:
        new_quantity = existing_item.quantity + payload.quantity
        if new_quantity > stock_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add {payload.quantity} more units. Only {stock_available} units are in stock (you already have {existing_item.quantity} in cart)."
            )
        existing_item.quantity = new_quantity
    else:
        if payload.quantity > stock_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add {payload.quantity} units. Only {stock_available} units in stock."
            )
        new_cart_item = Cart(
            customer_id=current_customer.customer_id,
            product_id=payload.product_id,
            quantity=payload.quantity
        )
        db.add(new_cart_item)

    db.commit()
    return calculate_cart_summary(current_customer.customer_id, db)


# ==============================================================================
# 3. UPDATE ITEM QUANTITY
# ==============================================================================
@router.put("/{cart_id}", response_model=CartSummaryResponse, summary="Update quantity of an item in cart")
def update_cart_item_quantity(
    cart_id: int,
    payload: UpdateCartItemRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Updates the quantity of a specific cart row:
    - Validates ownership (must belong to authenticated customer).
    - Validates new quantity against live stock in `inventory`.
    """
    cart_item = db.query(Cart).filter(
        Cart.cart_id == cart_id,
        Cart.customer_id == current_customer.customer_id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item #{cart_id} not found in your cart."
        )

    stock_available = cart_item.product.inventory.quantity if cart_item.product.inventory else 0
    if payload.quantity > stock_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set quantity to {payload.quantity}. Only {stock_available} units available in stock."
        )

    cart_item.quantity = payload.quantity
    db.commit()

    return calculate_cart_summary(current_customer.customer_id, db)


# ==============================================================================
# 4. REMOVE SINGLE ITEM FROM CART
# ==============================================================================
@router.delete("/{cart_id}", response_model=CartSummaryResponse, summary="Remove an item from cart")
def remove_cart_item(
    cart_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Deletes an item from the customer's cart.
    """
    cart_item = db.query(Cart).filter(
        Cart.cart_id == cart_id,
        Cart.customer_id == current_customer.customer_id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item #{cart_id} not found in your cart."
        )

    db.delete(cart_item)
    db.commit()

    return calculate_cart_summary(current_customer.customer_id, db)


# ==============================================================================
# 5. CLEAR ENTIRE CART
# ==============================================================================
@router.delete("", response_model=CartSummaryResponse, summary="Clear all items in cart")
def clear_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Empties the customer's cart completely.
    """
    db.query(Cart).filter(Cart.customer_id == current_customer.customer_id).delete()
    db.commit()

    return calculate_cart_summary(current_customer.customer_id, db)
