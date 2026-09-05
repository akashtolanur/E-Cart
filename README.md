# 🛒 AI-Powered Full-Stack E-Commerce Platform

A production-ready e-commerce platform built with **FastAPI**, **React (Vite + TypeScript)**, and **Neon PostgreSQL**. The system features Google OAuth 2.0 authentication, Role-Based Access Control (Admin vs. Customer), Stripe checkout integration with asynchronous webhook fulfillment, and an autonomous customer support AI agent powered by **LangGraph** and the **Groq API**.

---

## 🔗 Live Links

* **Live Frontend:** [https://e-cart-three-dun.vercel.app/](https://e-cart-three-dun.vercel.app/) 
* **GitHub Repository:** [https://github.com/akashtolanur/E-Cart](https://github.com/akashtolanur/E-Cart)

---

## ⚡ Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Modern, high-performance user interface |
| **Styling** | Tailwind CSS, Shadcn UI, Lucide Icons | Responsive layout & accessible UI components |
| **Client State** | Zustand | Cart state & JWT session management |
| **Backend API** | FastAPI, Uvicorn, Python 3.14 | Async REST API & RBAC middleware |
| **ORM & Models** | SQLModel (SQLAlchemy 2.0 + Pydantic v2) | Type-safe queries & relational data models |
| **Database** | Neon Serverless PostgreSQL | Cloud relational database |
| **Authentication** | Google OAuth 2.0, PyJWT | Single Sign-On & role-based token verification |
| **Payments** | Stripe API & Webhooks | Hosted Checkout sessions & payment state transitions |
| **AI Agent** | LangGraph, LangChain, Groq API | Function-calling agent querying real-time database |
| **Hosting** | Vercel (Frontend), Render (Backend) | Continuous deployment & global CDN delivery |

---

## ✨ Key Features

1. **Authentication & RBAC (Role-Based Access Control):**
   * Google Single Sign-On (SSO) with cryptographic server-side validation.
   * Auto-provisions customer accounts on first sign-in.
   * Signed JWT tokens carrying user IDs and roles (`customer` or `admin`).
   * Protected endpoints (`require_role`) allowing only admins to create or delete products.

2. **Product Catalog & Cart Management:**
   * Dynamic catalog fetching from Neon DB with real-time stock indicators.
   * Client-side persistent cart using Zustand.

3. **Stripe Payment Processing:**
   * Hosted Stripe Checkout session generation tied to unique order records.
   * Cryptographic webhook handler (`POST /webhook/stripe`) listening for `checkout.session.completed` to mark orders as `paid`.

4. **Autonomous AI Support Agent:**
   * Built with **LangGraph** state machines and hosted on Groq (`openai/gpt-oss-120b`).
   * Dynamic tool calling: `get_shop_products` (checks inventory) and `get_order_status` (tracks customer order IDs).

---

## 🗄️ Database Architecture

```text
+-----------------------------------+
|               USER                |
+-----------------------------------+
| PK  id       : UUID               |
|     email    : VARCHAR (Unique)   |
|     role     : userrole (Enum)    |
+-----------------------------------+
                  │
                  │ 1
                  │ has many
                  │ N
+-----------------------------------+       +-----------------------------------+
|               ORDER               |       |              PRODUCT              |
+-----------------------------------+       +-----------------------------------+
| PK  id                : UUID      |       | PK  id    : UUID                  |
| FK  user_id           : UUID ─────┼──────>│     name  : VARCHAR (Indexed)     |
| FK  product_id        : UUID ─────┼───────┼────>price : FLOAT                   |
|     quantity          : INTEGER   |       |     stock : INTEGER               |
|     total_price       : FLOAT     |       +-----------------------------------+
|     status            : Enum      |
|     stripe_session_id : VARCHAR   |
|     created_at        : TIMESTAMP |
+-----------------------------------+