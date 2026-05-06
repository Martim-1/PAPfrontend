import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ApiEmployee } from "@/data/types";
import {
  Users, Plus, Trash2, UserPlus, Search, MoreHorizontal,
  UserX, Mail, Phone, Clock, ArrowLeftRight, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/api";

interface Section {
  id: string;
  name: string;
  color: string;
}

const ManagerEmployees: React.FC = () => {
  const { toast } = useToast();
  const { makeRequest } = useApi();
  const { user } = useAuth();

  const [employeeList, setEmployeeList] = useState<ApiEmployee[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "offline">("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{ emp: ApiEmployee } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<{ emp: ApiEmployee; fromSectionId: string } | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [isCreating, setIsCreating] = useState(false);

  // Assign / move
  const [targetSectionId, setTargetSectionId] = useState("");

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchEmployees = async () => {
    try {
      const data = await makeRequest("/manager/employees");
      setEmployeeList(data);
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar funcionários", variant: "destructive" });
    }
  };

  const fetchSections = async () => {
    if (!user?.storeId) return;
    try {
      const data = await makeRequest(`/map?storeId=${encodeURIComponent(user.storeId)}`);
      setSections(data?.sections ?? []);
    } catch {
      // sections not critical – ignore silently
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSections();
  }, []);

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) fetchEmployees(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getInitials = (emp: ApiEmployee) => {
    if (emp.name) return emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return emp.email.slice(0, 2).toUpperCase();
  };

  const getAvatarUrl = (emp: ApiEmployee) => {
    if (!emp.avatar) return undefined;
    const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
    return `${base}${emp.avatar}`;
  };

  const getSectionColor = (sectionId: string) =>
    sections.find(s => s.id === sectionId)?.color ?? "#888";

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return employeeList.filter(emp => {
      if (statusFilter !== "all") {
        if ((emp.status || "offline") !== statusFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !emp.name?.toLowerCase().includes(q) &&
          !emp.email.toLowerCase().includes(q) &&
          !emp.phone?.toLowerCase().includes(q) &&
          !emp.sections?.some(s => s.sectionName.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [employeeList, search, statusFilter]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const removeEmployee = async (id: string) => {
    if (!confirm("Tens a certeza que queres remover este funcionário da loja?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/manager/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro");
      setEmployeeList(prev => prev.filter(e => e._id !== id));
      toast({ title: "Funcionário removido", description: "Removido com sucesso" });
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  const removeSingleSection = async (empId: string, sectionId: string) => {
    setLoading(true);
    try {
      await makeRequest(`/manager/employees/${empId}/section/${sectionId}`, { method: "DELETE" });
      toast({ title: "Secção removida" });
      await fetchEmployees();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const removeAllSections = async (empId: string) => {
    const emp = employeeList.find(e => e._id === empId);
    if (!emp?.sections?.length) return;
    if (!confirm("Remover este funcionário de todas as secções?")) return;
    setLoading(true);
    try {
      for (const s of emp.sections) {
        await makeRequest(`/manager/employees/${empId}/section/${s.sectionId}`, { method: "DELETE" });
      }
      toast({ title: "Removido de todas as secções" });
      await fetchEmployees();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const assignToSection = async () => {
    if (!showAssignModal || !targetSectionId) return;
    const section = sections.find(s => s.id === targetSectionId);
    if (!section) return;
    setLoading(true);
    try {
      await makeRequest(`/manager/employees/${showAssignModal.emp._id}/section`, {
        method: "POST",
        body: JSON.stringify({ sectionId: section.id, sectionName: section.name }),
      });
      toast({ title: "Funcionário associado à secção" });
      setShowAssignModal(null);
      setTargetSectionId("");
      await fetchEmployees();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const moveToSection = async () => {
    if (!showMoveModal || !targetSectionId) return;
    const newSection = sections.find(s => s.id === targetSectionId);
    if (!newSection) return;
    setLoading(true);
    try {
      // Remove from current section
      await makeRequest(
        `/manager/employees/${showMoveModal.emp._id}/section/${showMoveModal.fromSectionId}`,
        { method: "DELETE" },
      );
      // Assign to new section
      await makeRequest(`/manager/employees/${showMoveModal.emp._id}/section`, {
        method: "POST",
        body: JSON.stringify({ sectionId: newSection.id, sectionName: newSection.name }),
      });
      toast({ title: "Funcionário movido com sucesso" });
      setShowMoveModal(null);
      setTargetSectionId("");
      await fetchEmployees();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const openInviteModal = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/manager/employees/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiEmployee[] = await res.json();
      setAvailableEmployees(data);
      setShowInviteModal(true);
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar funcionários disponíveis", variant: "destructive" });
    }
  };

  const requestAddEmployee = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/manager/employees/requests/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro");
      toast({ title: "Solicitação enviada", description: "O funcionário será notificado" });
      setShowInviteModal(false);
      fetchEmployees();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password } = createForm;
    if (!name || !email || !password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/manager/employees/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro");
      toast({ title: "Conta criada!", description: `Funcionário ${name} criado com sucesso.` });
      setCreateForm({ name: "", email: "", password: "" });
      setShowCreateModal(false);
      fetchEmployees();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setIsCreating(false); }
  };

  // ─── Computed counts ─────────────────────────────────────────────────────
  const onlineCount = employeeList.filter(e => e.status === "active").length;
  const offlineCount = employeeList.filter(e => !e.status || e.status === "offline").length;
  const assignedCount = employeeList.filter(e => e.sections && e.sections.length > 0).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Funcionários</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {employeeList.length} total &middot; {assignedCount} com secção
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openInviteModal}>
              <Plus className="w-4 h-4 mr-1.5" /> Convidar Existente
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus className="w-4 h-4 mr-1.5" /> Criar Conta
            </Button>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-card rounded-xl shadow border border-border">
          {/* Card header */}
          <div className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, email, secção…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchEmployees}
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
              {([
                { key: "all", label: "Todos", count: employeeList.length },
                { key: "active", label: "Online", count: onlineCount },
                { key: "offline", label: "Offline", count: offlineCount },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                    statusFilter === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs ${
                    statusFilter === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="p-2 sm:p-4">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[220px]">Funcionário</TableHead>
                    <TableHead className="hidden md:table-cell">Contacto</TableHead>
                    <TableHead>Secções</TableHead>
                    <TableHead className="hidden sm:table-cell w-[80px] text-center">Nº</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[60px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {search || statusFilter !== "all"
                          ? "Nenhum funcionário encontrado com esses filtros."
                          : "Ainda não tem funcionários associados."}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(emp => (
                    <TableRow key={emp._id}>
                      {/* Avatar + name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={getAvatarUrl(emp)} alt={emp.name || emp.email} />
                              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                {getInitials(emp)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                              emp.status === "active" ? "bg-emerald-500" : "bg-zinc-400"
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{emp.name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                          {emp.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Sections */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {emp.sections && emp.sections.length > 0 ? emp.sections.map(s => (
                            <Tooltip key={s.sectionId}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="gap-1.5 cursor-default text-[10px] sm:text-xs font-normal py-0.5"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getSectionColor(s.sectionId) }}
                                  />
                                  <span className="truncate max-w-[80px]">{s.sectionName}</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-medium text-xs">{s.sectionName}</p>
                                {s.assignedAt && (
                                  <p className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    Desde {new Date(s.assignedAt).toLocaleDateString("pt-PT")}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          )) : (
                            <span className="text-xs text-muted-foreground italic">Sem secção</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Count */}
                      <TableCell className="hidden sm:table-cell text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                          (emp.sections?.length || 0) === 0
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {emp.sections?.length || 0}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] sm:text-xs font-medium ${
                            emp.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            emp.status === "active" ? "bg-emerald-500" : "bg-zinc-400"
                          }`} />
                          {emp.status === "active" ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {/* Assign to section */}
                            <DropdownMenuItem
                              onClick={() => { setShowAssignModal({ emp }); setTargetSectionId(""); }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-2" />
                              Adicionar a secção
                            </DropdownMenuItem>

                            {/* Move from section */}
                            {emp.sections && emp.sections.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground px-2 py-1">
                                  Mover de secção
                                </DropdownMenuLabel>
                                {emp.sections.map(s => (
                                  <DropdownMenuItem
                                    key={s.sectionId}
                                    onClick={() => { setShowMoveModal({ emp, fromSectionId: s.sectionId }); setTargetSectionId(""); }}
                                    className="text-xs"
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                                    <span
                                      className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                                      style={{ backgroundColor: getSectionColor(s.sectionId) }}
                                    />
                                    {s.sectionName}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground px-2 py-1">
                                  Remover de secção
                                </DropdownMenuLabel>
                                {emp.sections.map(s => (
                                  <DropdownMenuItem
                                    key={s.sectionId}
                                    onClick={() => removeSingleSection(emp._id, s.sectionId)}
                                    disabled={loading}
                                    className="text-xs"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                      style={{ backgroundColor: getSectionColor(s.sectionId) }}
                                    />
                                    {s.sectionName}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  onClick={() => removeAllSections(emp._id)}
                                  disabled={loading}
                                  className="text-destructive focus:text-destructive text-xs"
                                >
                                  <UserX className="w-3.5 h-3.5 mr-2" />
                                  Remover de todas
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Fire */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => removeEmployee(emp._id)}
                              className="text-destructive focus:text-destructive text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Remover da loja
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-border text-xs text-muted-foreground">
              A mostrar {filtered.length} de {employeeList.length} funcionários
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Criar Conta ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Criar Conta de Funcionário</h3>
            </div>
            <form onSubmit={createEmployee} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="emp-name">Nome</Label>
                <Input
                  id="emp-name"
                  placeholder="Nome completo"
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emp-email">Email</Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="email@exemplo.pt"
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emp-password">Password</Label>
                <Input
                  id="emp-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isCreating}>
                  {isCreating ? "A criar…" : "Criar Funcionário"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowCreateModal(false); setCreateForm({ name: "", email: "", password: "" }); }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Convidar Existente ──────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Convidar Funcionário</h3>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {availableEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum funcionário disponível</p>
              ) : availableEmployees.map(emp => (
                <div key={emp._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(emp)} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(emp)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name || emp.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                  </div>
                  <Button size="sm" onClick={() => requestAddEmployee(emp._id)}>Convidar</Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowInviteModal(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {/* ── Modal: Adicionar a Secção ──────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-semibold text-lg">Adicionar a Secção</h3>
            <p className="text-sm text-muted-foreground">
              {showAssignModal.emp.name || showAssignModal.emp.email}
            </p>
            <div className="space-y-1">
              <Label>Secção</Label>
              <select
                value={targetSectionId}
                onChange={e => setTargetSectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground appearance-none"
              >
                <option value="">Selecione uma secção…</option>
                {sections
                  .filter(s => !showAssignModal.emp.sections?.some(es => es.sectionId === s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={assignToSection} disabled={!targetSectionId || loading}>
                {loading ? "A guardar…" : "Confirmar"}
              </Button>
              <Button variant="outline" onClick={() => setShowAssignModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Mover de Secção ────────────────────────────────────────── */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-semibold text-lg">Mover de Secção</h3>
            <p className="text-sm text-muted-foreground">
              {showMoveModal.emp.name || showMoveModal.emp.email} &nbsp;·&nbsp;
              De: <strong>{showMoveModal.emp.sections?.find(s => s.sectionId === showMoveModal.fromSectionId)?.sectionName}</strong>
            </p>
            <div className="space-y-1">
              <Label>Nova secção</Label>
              <select
                value={targetSectionId}
                onChange={e => setTargetSectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground appearance-none"
              >
                <option value="">Selecione uma secção…</option>
                {sections
                  .filter(s =>
                    s.id !== showMoveModal.fromSectionId &&
                    !showMoveModal.emp.sections?.some(es => es.sectionId === s.id)
                  )
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={moveToSection} disabled={!targetSectionId || loading}>
                {loading ? "A mover…" : "Mover"}
              </Button>
              <Button variant="outline" onClick={() => setShowMoveModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default ManagerEmployees;
