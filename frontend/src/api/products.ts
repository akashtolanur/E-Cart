export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products/`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}