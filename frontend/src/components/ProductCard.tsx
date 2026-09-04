import { useState } from 'react';
import type { Product } from '@/api/products';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [open, setOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  return (
    <>
      <Card className="flex flex-col justify-between overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
            <span className={`text-xs font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex-1 gap-1">
            <Eye className="h-4 w-4" /> View
          </Button>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 gap-1"
          >
            <ShoppingCart className="h-4 w-4" /> Add
          </Button>
        </CardFooter>
      </Card>

      {/* Product Details Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Product ID: {product.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Unit Price</span>
              <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Inventory Status</span>
              <span className={product.stock > 0 ? 'font-medium text-emerald-600' : 'font-medium text-red-500'}>
                {product.stock > 0 ? `${product.stock} units available` : 'Sold out'}
              </span>
            </div>
            <p className="pt-2 text-slate-600">
              High-quality formulation designed for daily grooming and styling. Free from harsh chemicals.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                handleAddToCart();
                setOpen(false);
              }}
              disabled={product.stock === 0}
              className="w-full gap-2"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}