import { useEffect, useState } from 'react';
import { fetchProducts } from '@/api/products';
import type { Product } from '@/api/products';
import { ProductCard } from '@/components/ProductCard';
import { LoginButton } from '@/components/LoginButton';
import { CartDrawer } from '@/components/CartDrawer';
import { ChatWidget } from '@/components/ChatWidget';
import { OrderHistoryDialog } from '@/components/OrderHistoryDialog';
import { AdminProductDialog } from '@/components/AdminProductDialog';

export function ProductListingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight">E-CART</h1>
          <div className="flex items-center gap-4">
            <AdminProductDialog onProductCreated={fetchProducts} />
            <OrderHistoryDialog />
            <LoginButton />
            <CartDrawer />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-sm text-slate-500">Select items to add them to your cart.</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Error loading products: {error}. Ensure FastAPI is running on port 8000.
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center text-slate-500">
            No products found in the database. Use your FastAPI Swagger UI (`/docs`) to add a product.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <ChatWidget />
    </div>
  );
}