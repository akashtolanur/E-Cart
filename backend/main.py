from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import uuid

from database import create_db_and_tables, engine
from models import OrderStatus, Product, User, Order

from pydantic import BaseModel
from auth import verify_google_token, create_jwt_token

import os
import stripe
from fastapi import Request, Header

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI E-Commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Database Session Dependency
def get_session():
    with Session(engine) as session:
        yield session

@app.get("/")
def root():
    return {"status": "API is live and Neon Database is connected!"}

# --- PRODUCT CRUD ENDPOINTS ---

@app.post("/products/", response_model=Product)
def create_product(product: Product, session: Session = Depends(get_session)):
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

@app.get("/products/", response_model=List[Product])
def get_all_products(session: Session = Depends(get_session)):
    products = session.exec(select(Product)).all()
    return products

@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: uuid.UUID, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/orders/", response_model=Order)
def create_order(order: Order, session: Session = Depends(get_session)):
    # Validate that the product exists
    product = session.get(Product, order.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Save the order to Neon
    session.add(order)
    session.commit()
    session.refresh(order)
    return order

# Model to accept the token from the frontend
class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/auth/google")
def google_login(request: GoogleAuthRequest, session: Session = Depends(get_session)):
    # 1. Verify token with Google
    google_user = verify_google_token(request.token)
    email = google_user.get("email")
    
    # 2. Check if user exists in the Neon database
    user = session.exec(select(User).where(User.email == email)).first()
    
    # 3. If new user, create their account automatically
    if not user:
        user = User(email=email)
        session.add(user)
        session.commit()
        session.refresh(user)
        
    # 4. Generate a JWT session token for API access
    jwt_token = create_jwt_token(user.id)
    
    return {
        "access_token": jwt_token, 
        "token_type": "bearer", 
        "user": {"id": user.id, "email": user.email, "role": user.role}
    }

@app.post("/orders/{order_id}/checkout-session")
def create_checkout_session(order_id: uuid.UUID, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
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
                    "unit_amount": int(order.total_price * 100), # Stripe uses cents
                },
                "quantity": order.quantity,
            }],
            success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/cart",
        )
        
        # Save the Stripe session ID to the order
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
            secret=webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Update order status if payment succeeded
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