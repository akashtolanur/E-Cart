import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { API_BASE_URL } from '@/api/products';

interface AdminProductDialogProps {
  onProductCreated?: () => void;
}

export function AdminProductDialog({ onProductCreated }: AdminProductDialogProps) {
  const { user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
        }),
      });

      if (!res.ok) throw new Error('Failed to create product');

      setName('');
      setPrice('');
      setStock('');
      setOpen(false);
      onProductCreated?.();
    } catch (err) {
      console.error(err);
      alert('Error creating product. Check admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="default" size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <PlusCircle className="h-4 w-4" /> Add Product
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product (Admin)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Product Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Styling Gel" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Price ($)</label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="19.99" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Initial Stock</label>
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required placeholder="50" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Save Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}