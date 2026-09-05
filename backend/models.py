import uuid
from enum import Enum
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship


class UserRole(str, Enum):
    customer = "customer"
    admin = "admin"


class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    role: UserRole = Field(default=UserRole.customer)

    orders: List["Order"] = Relationship(back_populates="user")


class Product(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    price: float
    stock: int = Field(default=0)

    orders: List["Order"] = Relationship(back_populates="product")


class Order(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    product_id: uuid.UUID = Field(foreign_key="product.id")
    quantity: int = Field(default=1)
    total_price: float
    status: OrderStatus = Field(default=OrderStatus.pending)
    stripe_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="orders")
    product: Optional[Product] = Relationship(back_populates="orders")