import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.customer import Customer
from app.models.address import Address
from app.models.cart import Cart
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_detail import OrderDetail
from app.models.payment import Payment
from app.models.shipping import Shipping
from app.config.settings import get_settings
from app.schemas.order import (
    OrderCreateRequest,
    PhonePeConfigResponse,
    OrderDetailResponse,
    PaymentSummaryResponse,
    ShippingSummaryResponse,
    OrderAddressResponse,
    OrderListItemResponse,
    OrderDetailFullResponse,
    OrderPlacementSuccessResponse,
    OrderTrackingStep,
    OrderTrackingResponse,
)
from app.utils.dependencies import get_current_customer

router = APIRouter(prefix="/api/orders", tags=["Orders & Checkout"])


@router.post("/checkout", response_model=OrderPlacementSuccessResponse, status_code=status.HTTP_201_CREATED, summary="ACID Transactional Checkout")
def place_order_from_cart(
    payload: OrderCreateRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Executes an atomic ACID transaction for checkout:
    1. Validates selected delivery address belongs to customer and is active.
    2. Validates active cart has items.
    3. Acquires row-level pessimistic locks (SELECT FOR UPDATE) on inventory for each product.
    4. Validates real-time inventory stock >= requested quantity.
    5. Calculates subtotal and applies free shipping logic (free >= Rs. 999 else Rs. 99).
    6. Creates Order record in `orders`.
    7. Creates OrderDetail records in `order_details` freezing current unit prices.
    8. Decrements inventory stock in `inventory.quantity`.
    9. Creates 1:1 Payment record in `payment`.
    10. Creates 1:1 Shipping record with tracking number in `shipping`.
    11. Empties the customer's shopping `cart`.
    12. Commits transaction (or rolls back on error).
    """
    # 1. Validate Address
    address = db.query(Address).filter(
        Address.address_id == payload.address_id,
        Address.customer_id == current_customer.customer_id,
        Address.is_active == True
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Delivery address #{payload.address_id} was not found or is inactive."
        )

    # 2. Validate Cart
    cart_items = db.query(Cart).filter(
        Cart.customer_id == current_customer.customer_id
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your shopping cart is empty. Add products before checking out."
        )

    # ACID Transaction Execution
    try:
        subtotal = Decimal("0.00")
        order_lines = []

        # 3 & 4. Validate stock with row-level locks
        for item in cart_items:
            product = db.query(Product).filter(
                Product.product_id == item.product_id,
                Product.is_active == True
            ).first()

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product #{item.product_id} in your cart is no longer available."
                )

            # Row-level lock on inventory to prevent race conditions during concurrent checkouts
            inv = db.query(Inventory).filter(
                Inventory.product_id == product.product_id
            ).with_for_update().first()

            if not inv or inv.quantity < item.quantity:
                available = inv.quantity if inv else 0
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.product_name}'. Available: {available}, requested: {item.quantity}."
                )

            unit_price = Decimal(str(product.price))
            line_subtotal = (unit_price * item.quantity).quantize(Decimal("0.01"))
            subtotal += line_subtotal

            order_lines.append({
                "product": product,
                "inventory": inv,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "subtotal": line_subtotal
            })

        # 5. Financial Calculation (Free shipping if subtotal >= 999 else 99)
        shipping_fee = Decimal("0.00") if subtotal >= Decimal("999.00") else Decimal("99.00")
        total_amount = (subtotal + shipping_fee).quantize(Decimal("0.01"))

        # Order status determined by payment method
        is_instant_paid = payload.payment_method in ["Card Demo", "UPI Demo", "PhonePe"]
        initial_order_status = "Confirmed" if is_instant_paid else "Pending"

        # 6. Create Order header
        new_order = Order(
            customer_id=current_customer.customer_id,
            address_id=address.address_id,
            total_amount=total_amount,
            order_status=initial_order_status
        )
        db.add(new_order)
        db.flush()  # Generates new_order.order_id

        # 7 & 8. Create Order Details and decrement Inventory
        created_details_response = []
        for line in order_lines:
            detail = OrderDetail(
                order_id=new_order.order_id,
                product_id=line["product"].product_id,
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                subtotal=line["subtotal"]
            )
            db.add(detail)
            # Decrement stock in real-time
            line["inventory"].quantity -= line["quantity"]
            db.flush()

            created_details_response.append(OrderDetailResponse(
                order_detail_id=detail.order_detail_id,
                product_id=line["product"].product_id,
                product_name=line["product"].product_name,
                product_slug=line["product"].slug,
                product_image=line["product"].image_url,
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                subtotal=line["subtotal"]
            ))

        # 9. Create 1:1 Payment Record
        if payload.payment_method == "PhonePe":
            tx_reference = f"PHONEPE-{uuid.uuid4().hex[:10].upper()}"
        else:
            tx_reference = f"TXN-{uuid.uuid4().hex[:10].upper()}"

        payment = Payment(
            order_id=new_order.order_id,
            payment_method=payload.payment_method,
            payment_status="Completed" if is_instant_paid else "Pending",
            transaction_reference=tx_reference,
            amount=total_amount
        )
        db.add(payment)

        # 10. Create 1:1 Shipping Record
        tracking_number = f"NEX-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        estimated_delivery = (datetime.utcnow() + timedelta(days=4)).date()
        shipping = Shipping(
            order_id=new_order.order_id,
            shipping_status="Processing",
            tracking_number=tracking_number,
            carrier="SpeedShip Logistics",
            estimated_delivery=estimated_delivery
        )
        db.add(shipping)

        # 11. Clear Shopping Cart
        db.query(Cart).filter(Cart.customer_id == current_customer.customer_id).delete()

        # 12. Commit Transaction Atomically
        db.commit()
        db.refresh(new_order)
        db.refresh(payment)
        db.refresh(shipping)

        full_order = OrderDetailFullResponse(
            order_id=new_order.order_id,
            customer_id=new_order.customer_id,
            order_date=new_order.order_date,
            total_amount=new_order.total_amount,
            order_status=new_order.order_status,
            address=OrderAddressResponse(
                address_id=address.address_id,
                address_type=address.address_type,
                recipient_name=address.recipient_name,
                phone=address.phone,
                street_address=address.street_address,
                city=address.city,
                state=address.state,
                postal_code=address.postal_code,
                country=address.country
            ),
            items=created_details_response,
            payment=PaymentSummaryResponse(
                payment_id=payment.payment_id,
                payment_method=payment.payment_method,
                payment_status=payment.payment_status,
                transaction_reference=payment.transaction_reference,
                amount=payment.amount,
                payment_date=payment.payment_date
            ),
            shipping=ShippingSummaryResponse(
                shipping_id=shipping.shipping_id,
                shipping_status=shipping.shipping_status,
                tracking_number=shipping.tracking_number,
                carrier=shipping.carrier,
                estimated_delivery=shipping.estimated_delivery,
                shipped_at=shipping.shipped_at,
                delivered_at=shipping.delivered_at
            )
        )

        return OrderPlacementSuccessResponse(
            message=f"Order #{new_order.order_id} placed successfully with {payload.payment_method}!",
            order=full_order
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Checkout transaction failed: {str(exc)}"
        )


@router.get("", response_model=List[OrderListItemResponse], summary="List all orders for logged-in customer")
def get_customer_orders(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Returns order history for the logged-in customer, sorted latest first.
    Includes item counts, payment summary, and live tracking number.
    """
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.order_details),
            joinedload(Order.payment),
            joinedload(Order.shipping)
        )
        .filter(Order.customer_id == current_customer.customer_id)
        .order_by(Order.order_date.desc())
        .all()
    )

    results = []
    for ord_obj in orders:
        total_items = sum(item.quantity for item in ord_obj.order_details)
        results.append(OrderListItemResponse(
            order_id=ord_obj.order_id,
            order_date=ord_obj.order_date,
            total_amount=ord_obj.total_amount,
            order_status=ord_obj.order_status,
            total_items=total_items,
            payment_method=ord_obj.payment.payment_method if ord_obj.payment else None,
            payment_status=ord_obj.payment.payment_status if ord_obj.payment else None,
            shipping_status=ord_obj.shipping.shipping_status if ord_obj.shipping else None,
            tracking_number=ord_obj.shipping.tracking_number if ord_obj.shipping else None
        ))

    return results


@router.get("/{order_id}", response_model=OrderDetailFullResponse, summary="Get full order details by ID")
def get_order_by_id(
    order_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details for a specific order belonging to the customer:
    - Order header status and total
    - Delivery destination snapshot
    - Purchased products with unit price snapshots
    - Payment settlement record
    - Shipping and tracking progression
    """
    order = (
        db.query(Order)
        .options(
            joinedload(Order.address),
            joinedload(Order.order_details).joinedload(OrderDetail.product),
            joinedload(Order.payment),
            joinedload(Order.shipping)
        )
        .filter(
            Order.order_id == order_id,
            Order.customer_id == current_customer.customer_id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found."
        )

    items = []
    for detail in order.order_details:
        items.append(OrderDetailResponse(
            order_detail_id=detail.order_detail_id,
            product_id=detail.product_id,
            product_name=detail.product.product_name if detail.product else "Discontinued Product",
            product_slug=detail.product.slug if detail.product else None,
            product_image=detail.product.image_url if detail.product else None,
            quantity=detail.quantity,
            unit_price=detail.unit_price,
            subtotal=detail.subtotal
        ))

    return OrderDetailFullResponse(
        order_id=order.order_id,
        customer_id=order.customer_id,
        order_date=order.order_date,
        total_amount=order.total_amount,
        order_status=order.order_status,
        address=OrderAddressResponse(
            address_id=order.address.address_id,
            address_type=order.address.address_type,
            recipient_name=order.address.recipient_name,
            phone=order.address.phone,
            street_address=order.address.street_address,
            city=order.address.city,
            state=order.address.state,
            postal_code=order.address.postal_code,
            country=order.address.country
        ),
        items=items,
        payment=PaymentSummaryResponse(
            payment_id=order.payment.payment_id,
            payment_method=order.payment.payment_method,
            payment_status=order.payment.payment_status,
            transaction_reference=order.payment.transaction_reference,
            amount=order.payment.amount,
            payment_date=order.payment.payment_date
        ) if order.payment else None,
        shipping=ShippingSummaryResponse(
            shipping_id=order.shipping.shipping_id,
            shipping_status=order.shipping.shipping_status,
            tracking_number=order.shipping.tracking_number,
            carrier=order.shipping.carrier,
            estimated_delivery=order.shipping.estimated_delivery,
            shipped_at=order.shipping.shipped_at,
            delivered_at=order.shipping.delivered_at
        ) if order.shipping else None
    )


@router.put("/{order_id}/cancel", summary="Cancel an active order and restock inventory")
def cancel_order(
    order_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Cancels an order if it is in 'Pending' or 'Confirmed' status:
    1. Updates `orders.order_status = 'Cancelled'`.
    2. Restocks inventory by adding back line item quantities.
    3. If payment was 'Completed', updates `payment.payment_status = 'Refunded'`.
    4. Updates shipping status to 'Returned'.
    5. Commits transaction atomically.
    """
    order = (
        db.query(Order)
        .options(
            joinedload(Order.order_details),
            joinedload(Order.payment),
            joinedload(Order.shipping)
        )
        .filter(
            Order.order_id == order_id,
            Order.customer_id == current_customer.customer_id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found."
        )

    if order.order_status not in ["Pending", "Confirmed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order #{order_id} cannot be cancelled because it is already '{order.order_status}'."
        )

    try:
        # 1. Update order status
        order.order_status = "Cancelled"

        # 2. Restock inventory for each ordered item
        for item in order.order_details:
            inv = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if inv:
                inv.quantity += item.quantity

        # 3. Update payment status if prepaid
        if order.payment and order.payment.payment_status == "Completed":
            order.payment.payment_status = "Refunded"

        # 4. Update shipping status
        if order.shipping:
            order.shipping.shipping_status = "Returned"

        db.commit()

        return {
            "status": "success",
            "message": f"Order #{order_id} has been cancelled successfully and products have been restocked into inventory.",
            "order_id": order_id,
            "order_status": order.order_status,
            "payment_status": order.payment.payment_status if order.payment else None
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cancellation failed: {str(exc)}"
        )


def build_tracking_response(order: Order) -> OrderTrackingResponse:
    """
    Constructs a visual milestone stepper response from order, payment, and shipping data.
    """
    tracking_no = order.shipping.tracking_number if order.shipping else f"NEX-PENDING-{order.order_id}"
    carrier = order.shipping.carrier if order.shipping else "SpeedShip Logistics"
    shipping_status = order.shipping.shipping_status if order.shipping else "Pending"
    est_delivery = order.shipping.estimated_delivery if order.shipping else None

    # Handle cancellation
    if order.order_status == "Cancelled":
        steps = [
            OrderTrackingStep(
                step_name="Order Placed",
                status="completed",
                timestamp=order.order_date,
                description="Order was placed by the customer."
            ),
            OrderTrackingStep(
                step_name="Order Cancelled",
                status="cancelled",
                timestamp=order.updated_at,
                description="This order was cancelled. Reserved items have been restocked."
            )
        ]
        return OrderTrackingResponse(
            order_id=order.order_id,
            order_date=order.order_date,
            order_status=order.order_status,
            tracking_number=tracking_no,
            carrier=carrier,
            shipping_status=shipping_status,
            estimated_delivery=est_delivery,
            recipient_name=order.address.recipient_name if order.address else "Customer",
            shipping_city=order.address.city if order.address else "City",
            shipping_state=order.address.state if order.address else "State",
            current_step_index=1,
            steps=steps
        )

    # Progression level (0 to 5)
    if shipping_status == "Delivered" or order.order_status == "Delivered":
        current_stage = 5
    elif shipping_status == "Out for Delivery" or order.order_status == "Out for Delivery":
        current_stage = 4
    elif shipping_status == "Shipped" or order.order_status == "Shipped":
        current_stage = 3
    elif shipping_status == "Processing" or order.order_status == "Processing":
        current_stage = 2
    elif order.order_status == "Confirmed" or (order.payment and order.payment.payment_status == "Completed"):
        current_stage = 1
    else:
        current_stage = 0

    def get_status(target_stage: int) -> str:
        if target_stage < current_stage:
            return "completed"
        elif target_stage == current_stage:
            return "current"
        return "pending"

    steps = [
        OrderTrackingStep(
            step_name="Order Placed",
            status="completed",
            timestamp=order.order_date,
            description="Your order was received and verified."
        ),
        OrderTrackingStep(
            step_name="Payment Confirmed",
            status=get_status(1) if current_stage >= 1 else "pending",
            timestamp=order.payment.payment_date if (order.payment and order.payment.payment_status == "Completed") else None,
            description=f"Payment verified via {order.payment.payment_method if order.payment else 'Gateway'}."
        ),
        OrderTrackingStep(
            step_name="Warehouse Processing",
            status=get_status(2),
            timestamp=None,
            description="Items gathered, quality-checked, and packaged securely."
        ),
        OrderTrackingStep(
            step_name="Shipped with Courier",
            status=get_status(3),
            timestamp=order.shipping.shipped_at if order.shipping else None,
            description=f"Package is in transit with {carrier}."
        ),
        OrderTrackingStep(
            step_name="Out for Delivery",
            status=get_status(4),
            timestamp=None,
            description="Courier delivery executive has departed destination hub."
        ),
        OrderTrackingStep(
            step_name="Delivered",
            status="completed" if current_stage == 5 else "pending",
            timestamp=order.shipping.delivered_at if order.shipping else None,
            description="Package delivered to recipient."
        ),
    ]

    return OrderTrackingResponse(
        order_id=order.order_id,
        order_date=order.order_date,
        order_status=order.order_status,
        tracking_number=tracking_no,
        carrier=carrier,
        shipping_status=shipping_status,
        estimated_delivery=est_delivery,
        recipient_name=order.address.recipient_name if order.address else "Customer",
        shipping_city=order.address.city if order.address else "City",
        shipping_state=order.address.state if order.address else "State",
        current_step_index=current_stage,
        steps=steps
    )


@router.get("/track/{tracking_number}", response_model=OrderTrackingResponse, summary="Public shipment tracking by tracking number")
def track_shipment_public(
    tracking_number: str,
    db: Session = Depends(get_db)
):
    """
    Public tracking endpoint for customers, couriers, or recipients:
    - Finds shipment by tracking number (e.g. TRK-IND-202609-0001 or NEX-20260930-XXXXXX)
    - Returns full milestone stepper and transit details without requiring authentication.
    """
    shipping = (
        db.query(Shipping)
        .options(
            joinedload(Shipping.order).joinedload(Order.address),
            joinedload(Shipping.order).joinedload(Order.payment),
        )
        .filter(Shipping.tracking_number == tracking_number.strip())
        .first()
    )

    if not shipping or not shipping.order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tracking number '{tracking_number}' was not found in our logistics network."
        )

    return build_tracking_response(shipping.order)


@router.get("/{order_id}/tracking", response_model=OrderTrackingResponse, summary="Get order tracking stepper for authenticated customer")
def get_order_tracking(
    order_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Retrieves real-time tracking progression for the customer's order.
    """
    order = (
        db.query(Order)
        .options(
            joinedload(Order.address),
            joinedload(Order.shipping),
            joinedload(Order.payment)
        )
        .filter(
            Order.order_id == order_id,
            Order.customer_id == current_customer.customer_id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found."
        )

    return build_tracking_response(order)


@router.get(
    "/payment/phonepe/status",
    response_model=PhonePeConfigResponse,
    summary="PhonePe Payment Gateway Readiness & Configuration Status"
)
def get_phonepe_gateway_status():
    """
    Returns the real-time configuration status of the PhonePe Payment Gateway:
    - Reports whether running in Sandbox (UAT) or Live Production mode.
    - Explicitly details any missing production credentials (MID, Salt Key, Index).
    """
    cfg = get_settings()
    is_live = (cfg.PHONEPE_ENV.upper() == "PRODUCTION") and (cfg.PHONEPE_MERCHANT_ID != "PGTESTPAYUAT")

    missing = []
    if cfg.PHONEPE_MERCHANT_ID == "PGTESTPAYUAT":
        missing.append("Live Production Merchant ID (MID) - currently using default test sandbox: PGTESTPAYUAT")
    if "099eb0cd" in cfg.PHONEPE_SALT_KEY:
        missing.append("Live Production Salt Key & Salt Index - currently using default UAT test key")

    return PhonePeConfigResponse(
        gateway_status="UAT Sandbox Ready (Test Simulation Mode)" if not is_live else "Live Production Gateway Active",
        merchant_id=cfg.PHONEPE_MERCHANT_ID,
        environment=cfg.PHONEPE_ENV,
        is_live_configured=is_live,
        missing_configurations=missing,
        callback_url=cfg.PHONEPE_CALLBACK_URL
    )

