import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X } from 'lucide-react';

export function CartDrawer() {
    const { items, removeItem, totalAmount } = useCartStore();
    const { user, token } = useAuthStore();

    const handleCheckout = async () => {
        if (!user || !token) {
            alert("Please sign in with Google first to checkout.");
            return;
        }

        try {
            // 1. Create the Order in the database
            const orderRes = await fetch('http://localhost:8000/orders/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    product_id: items[0].product_id, // Simplified for single-item checkout
                    quantity: items[0].quantity,
                    total_price: totalAmount(),
                })
            });
            const order = await orderRes.json();

            // 2. Trigger Stripe Checkout
            const stripeRes = await fetch(`http://localhost:8000/orders/${order.id}/checkout-session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { checkout_url } = await stripeRes.json();

            // Redirect user to Stripe's hosted checkout
            window.location.href = checkout_url;
        } catch (error) {
            console.error("Checkout failed", error);
        }
    };

    return (
        <Sheet>
            <SheetTrigger render={<Button variant="outline" className="gap-2 rounded-full px-4">
                <ShoppingBag className="h-4 w-4" />
                <span>{items.length} items</span>
            </Button>} />
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.product_id)}>
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {items.length > 0 ? (
                        <div className="mt-4">
                            <div className="mb-4 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>${totalAmount().toFixed(2)}</span>
                            </div>
                            <Button onClick={handleCheckout} className="w-full">
                                Checkout with Stripe
                            </Button>
                        </div>
                    ) : (
                        <p className="text-center text-slate-500">Your cart is empty.</p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}