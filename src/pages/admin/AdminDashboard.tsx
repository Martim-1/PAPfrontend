import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, UserPlus, Users, Trash2, ShieldCheck } from "lucide-react";

interface UserRow {
  _id: string;
  name: string | null;
  email: string;
  role: string;
  storeName: string | null;
  status: string | null;
  createdAt: string;
}

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  employee: "Funcionário",
  customer: "Cliente",
};

const roleBadge: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  manager: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  employee: "bg-green-500/20 text-green-300 border border-green-500/30",
  customer: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
};

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", storeName: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: UserRow[] = await res.json();
      setUsers(data);
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar utilizadores", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Erro", description: "Nome, email e password são obrigatórios", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao criar gerente");
      toast({ title: "Gerente criado", description: `Conta de ${data.name} criada com sucesso` });
      setShowCreateModal(false);
      setForm({ name: "", email: "", password: "", storeName: "" });
      fetchUsers();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string | null) => {
    if (!confirm(`Tens a certeza que queres eliminar a conta de ${name || "este utilizador"}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast({ title: "Eliminado", description: "Conta eliminada com sucesso" });
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  const filtered = filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    manager: users.filter((u) => u.role === "manager").length,
    employee: users.filter((u) => u.role === "employee").length,
    customer: users.filter((u) => u.role === "customer").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Painel de Administração</h1>
            <p className="text-xs text-slate-400">MarketFind — Gestão Global</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-slate-400 hover:text-white gap-2"
        >
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Gerentes", count: counts.manager, color: "text-blue-400" },
            { label: "Funcionários", count: counts.employee, color: "text-green-400" },
            { label: "Clientes", count: counts.customer, color: "text-slate-400" },
            { label: "Total", count: counts.total, color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Actions + Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {["all", "admin", "manager", "employee", "customer"].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterRole === r
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {r === "all" ? "Todos" : roleLabel[r]}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            size="sm"
          >
            <UserPlus className="w-4 h-4" /> Criar Gerente
          </Button>
        </div>

        {/* Table */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2 text-sm text-slate-300">
            <Users className="w-4 h-4" />
            <span className="font-medium">Utilizadores ({filtered.length})</span>
          </div>
          {loadingUsers ? (
            <div className="p-8 text-center text-slate-400 text-sm">A carregar...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Nenhum utilizador encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Nome</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Role</th>
                    <th className="text-left px-5 py-3">Loja</th>
                    <th className="text-left px-5 py-3">Criado em</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{u.name || "—"}</td>
                      <td className="px-5 py-3 text-slate-300">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] || roleBadge.customer}`}>
                          {roleLabel[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{u.storeName || "—"}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-5 py-3">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
                            title="Eliminar conta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Criar Gerente */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Criar conta de Gerente</h2>
            <p className="text-sm text-slate-400 mb-5">O gerente irá receber acesso à plataforma com estas credenciais.</p>
            <form onSubmit={handleCreateManager} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="mgr-name" className="text-slate-300 text-sm">Nome *</Label>
                <Input
                  id="mgr-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome do gerente"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mgr-email" className="text-slate-300 text-sm">Email *</Label>
                <Input
                  id="mgr-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="gerente@loja.pt"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mgr-password" className="text-slate-300 text-sm">Password *</Label>
                <Input
                  id="mgr-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mgr-store" className="text-slate-300 text-sm">Nome da Loja <span className="text-slate-500">(opcional)</span></Label>
                <Input
                  id="mgr-store"
                  value={form.storeName}
                  onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                  placeholder="Ex: Supermercado Central"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 border border-slate-600 text-slate-300 hover:text-white"
                  onClick={() => { setShowCreateModal(false); setForm({ name: "", email: "", password: "", storeName: "" }); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isCreating ? "A criar..." : "Criar Gerente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
