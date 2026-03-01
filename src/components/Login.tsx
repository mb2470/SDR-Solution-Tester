import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://sdr.onsiteaffiliate.com/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userEmail', email);
        if (response.data.orgId) {
          localStorage.setItem('orgId', response.data.orgId);
        }
        navigate('/dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials and CORS settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md border border-line p-8 bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">SDR Solution</h1>
          <p className="font-serif italic text-sm opacity-60">Authentication required for sdr.onsiteaffiliate.com</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex gap-3 items-start">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest opacity-50 block">Email Address</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-line focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono text-sm"
                placeholder="user@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest opacity-50 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-line focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono text-sm"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-ink text-bg py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-line/10 text-center">
          <p className="text-[10px] font-mono uppercase opacity-40">
            Secure connection to sdr.onsiteaffiliate.com
          </p>
        </div>
      </div>
    </div>
  );
}
