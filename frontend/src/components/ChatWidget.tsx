import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send } from 'lucide-react';
import { API_BASE_URL } from '@/api/products';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hi! I can help you find products or check your order status.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)} className="h-12 w-12 rounded-full shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 shadow-xl sm:w-96">
          <CardHeader className="flex flex-row items-center justify-between border-b p-4">
            <CardTitle className="text-lg">Support Agent</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex h-80 flex-col gap-4 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'self-end bg-slate-900 text-white' : 'self-start bg-slate-100 text-slate-900'}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="self-start text-xs text-slate-500">Agent is typing...</div>}
          </CardContent>
          <CardFooter className="border-t p-4">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }} 
              className="flex w-full items-center gap-2"
            >
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask about products..." 
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}