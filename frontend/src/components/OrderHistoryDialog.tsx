import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { API_BASE_URL } from '@/api/products';

interface Order {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
}

export function OrderHistoryDialog() {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/orders/user/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(data))
      .catch((err) => console.error('Failed to load orders', err))
      .finally(() => setLoading(false));
  }, [open, user, token]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
          <Clock className="h-4 w-4" />
          Orders
        </Button>
      } />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your Order History</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No orders placed yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell className="font-semibold">${order.total_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}