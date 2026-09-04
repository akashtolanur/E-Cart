import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/store/useAuthStore';

export function LoginButton() {
  const { login, logout, user } = useAuthStore();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch('http://localhost:8000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      
      if (!res.ok) throw new Error('Login failed');
      
      const data = await res.json();
      login(data.access_token, data.user);
    } catch (error) {
      console.error(error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">{user.email}</span>
        <button onClick={logout} className="text-sm text-red-600 hover:underline">
          Logout
        </button>
      </div>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.error('Google Login Failed')}
      useOneTap
    />
  );
}