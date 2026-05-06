export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const loginUser = async (
  email: string,
  password: string
) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Credenciais inválidas");
  }

  return res.json(); // { token, user }
};

export const registerUser = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name?: string;
}) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erro ao criar utilizador');
  }

  return res.json();
};
