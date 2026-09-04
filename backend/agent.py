import os
from typing import Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from sqlmodel import Session, select
from database import engine
from models import Product, Order

load_dotenv()

# Define the state graph structure
class State(TypedDict):
    messages: Annotated[list, add_messages]

# Tool 1: Fetch active products for the user
@tool
def get_shop_products(query: str = "") -> str:
    """Retrieves available products and stock levels from the store."""
    with Session(engine) as session:
        products = session.exec(select(Product)).all()
        if not products:
            return "No products currently available in the shop."
        return "\n".join([f"- {p.name}: ${p.price} ({p.stock} in stock)" for p in products])

# Tool 2: Check user order status
@tool
def get_order_status(order_id: str) -> str:
    """Checks the payment and fulfillment status of a specific order ID."""
    with Session(engine) as session:
        order = session.get(Order, order_id)
        if not order:
            return f"Order with ID {order_id} could not be found."
        return f"Order {order.id} status: {order.status} (Total: ${order.total_price})"

tools = [get_shop_products, get_order_status]

# Groq OpenAI-compatible model with active model ID
model = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
    temperature=0
).bind_tools(tools)

# Define chatbot node
def chatbot(state: State):
    system_prompt = SystemMessage(
        content="You are a helpful customer support assistant for Mini E-Commerce. Use the provided tools to fetch products or check orders when requested."
    )
    return {"messages": [model.invoke([system_prompt] + state["messages"])]}

# Build LangGraph workflow with tool execution support
workflow = StateGraph(State)
workflow.add_node("chatbot", chatbot)
workflow.add_node("tools", ToolNode(tools))

workflow.add_edge(START, "chatbot")
workflow.add_conditional_edges("chatbot", tools_condition)
workflow.add_edge("tools", "chatbot")

memory_graph = workflow.compile()