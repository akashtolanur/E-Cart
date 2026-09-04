import uuid
from sqlmodel import Field, SQLModel
from enum import Enum
from datetime import datetime
from typing import Optional

class Role(str, Enum):
    customer = "customer"
    admin = "admin"

class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    role: Role = Field(default=Role.customer)

class Product(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    price: float
    stock: int = Field(default=0)

class Order(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    product_id: uuid.UUID = Field(foreign_key="product.id")
    quantity: int
    total_price: float
    status: OrderStatus = Field(default=OrderStatus.pending)
    stripe_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    