import { useAuth } from '@/contexts/AuthContext';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const useApi = () => {
  const { logout } = useAuth();

  const makeRequest = async <T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        // Token expirado - apenas fazer logout se for uma rota crítica
        const criticalEndpoints = ['/auth/me', '/auth/refresh', '/auth/verify'];
        if (criticalEndpoints.some(ep => endpoint.includes(ep))) {
          await logout();
          throw new Error('Sessão expirada');
        }
        // Para outras rotas, retornar array vazio ou erro silenciosamente
        if (endpoint.includes('requests') || endpoint.includes('list')) {
          return [];
        }
        throw new Error('Não autorizado');
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || `Erro ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  };

  return { makeRequest };
};
