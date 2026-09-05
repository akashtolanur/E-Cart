import os
import uuid
from typing import List
import stripe
import traceback
from fastapi import FastAPI, Depends, HTTPException, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select
from langchain_core.messages import HumanMessage

from database import create_db_and_tables, engine
from models import User, Product, Order, OrderStatus, UserRole
from agent import memory_graph
from auth import (
    create_jwt_token,
    get_current_user,
    require_role,
    verify_google_token,
)

app = FastAPI(title="AI E-Commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://e-cart-three-dun.vercel.app/","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

@app.get("/")
def root():
    return {"status": "API is live and Neon Database is connected!"}

# --- AUTH ENDPOINTS ---

class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/auth/google")
def google_login(request: GoogleAuthRequest, session: Session = Depends(get_session)):
    google_user = verify_google_token(request.token)
    email = google_user.get("email")

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(email=email, role=UserRole.customer)
        session.add(user)
        session.commit()
        session.refresh(user)

    jwt_token = create_jwt_token(user.id, user.role.value)
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role.value},
    }

# --- PRODUCT CRUD (WITH RBAC) ---

# Public: View all products
@app.get("/products/", response_model=List[Product])
def get_all_products(session: Session = Depends(get_session)):
    return session.exec(select(Product)).all()

# Public: View single product
@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: uuid.UUID, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Admin Only: Create product
@app.post("/products/", response_model=Product, dependencies=[Depends(require_role(UserRole.admin))])
def create_product(product: Product, session: Session = Depends(get_session)):
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

# --- ORDER APIS (WITH RBAC) ---

class OrderCreateRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int

@app.post("/orders/", response_model=Order)
def create_order(
    order_data: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    product = session.get(Product, order_data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < order_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    new_order = Order(
        user_id=current_user.id,
        product_id=product.id,
        quantity=order_data.quantity,
        total_price=product.price * order_data.quantity,
        status=OrderStatus.pending,
    )
    session.add(new_order)
    session.commit()
    session.refresh(new_order)
    return new_order

# User views their own orders
@app.get("/orders/user/{user_id}", response_model=List[Order])
def get_user_orders(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Non-admins can only inspect their own orders
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these orders")
    return session.exec(select(Order).where(Order.user_id == user_id)).all()

# --- CHECKOUT & WEBHOOK ---

@app.post("/orders/{order_id}/checkout-session")
def create_checkout_session(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    order = session.get(Order, order_id)
    if not order or (order.user_id != current_user.id and current_user.role != UserRole.admin):
        raise HTTPException(status_code=404, detail="Order not found")

    product = session.get(Product, order.product_id)

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            client_reference_id=str(order.id),
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": product.name},
                    "unit_amount": int(order.total_price * 100),
                },
                "quantity": order.quantity,
            }],
            success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/cart",
        )
        order.stripe_session_id = checkout_session.id
        session.add(order)
        session.commit()
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: Session = Depends(get_session)):
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    raw_body = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload=raw_body,
            sig_header=stripe_signature,
            secret=webhook_secret,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session_data = event["data"]["object"]
        order_id = session_data.get("client_reference_id")

        if order_id:
            order = db.get(Order, uuid.UUID(order_id))
            if order:
                order.status = OrderStatus.paid
                db.add(order)
                db.commit()

    return {"status": "success"}

# --- AI AGENT ENDPOINT ---

class ChatRequest(BaseModel):
    message: str

@app.post("/chat/")
def chat_with_agent(request: ChatRequest):
    try:
        result = memory_graph.invoke({"messages": [HumanMessage(content=request.message)]})
        ai_response = result["messages"][-1].content
        return {"response": ai_response}
    except Exception as e:
        traceback.print_exc()  # Prints the full stack trace to your uvicorn terminal
        raise HTTPException(status_code=500, detail=str(e))