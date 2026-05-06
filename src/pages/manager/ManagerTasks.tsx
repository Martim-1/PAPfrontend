import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash,
  Check,
  Pen,
  ListTodo,
  Clock,
  CheckCircle2,
  ClipboardList,
  Users,
  X,
} from "lucide-react";

import { API_URL } from "@/api";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  employee: { _id: string; email: string };
}

interface Employee {
  _id: string;
  email: string;
}

const ManagerTasks: React.FC = () => {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    employee: "",
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // =========================
  // FETCH
  // =========================
  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTasks(data);
  };

  const fetchEmployees = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/manager/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEmployees(data);
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) { fetchTasks(); fetchEmployees(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // =========================
  // CREATE / EDIT
  // =========================
  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const method = editingTask ? "PUT" : "POST";
    const url = editingTask
      ? `${API_URL}/tasks/${editingTask._id}`
      : `${API_URL}/tasks`;

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    toast({ title: "Tarefa guardada" });
    setShowModal(false);
    setEditingTask(null);
    setForm({ title: "", description: "", employee: "" });
    fetchTasks();
  };

  // =========================
  // DELETE
  // =========================
  const deleteTask = async (id: string) => {
    if (!confirm("Remover tarefa?")) return;

    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  // =========================
  // COMPLETE
  // =========================
  const completeTask = async (id: string) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    const updated = await res.json();

    setTasks((prev) =>
      prev.map((t) => (t._id === id ? updated : t))
    );
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tasks.length}</div>
              <CardDescription>tarefas criadas</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{pendingTasks.length}</div>
              <CardDescription>a aguardar conclusão</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{completedTasks.length}</div>
              <CardDescription>tarefas finalizadas</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Lista de Tarefas</CardTitle>
            </div>
            <CardDescription>Gerir todas as tarefas atribuídas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma tarefa criada ainda.</p>
              </div>
            )}

            {tasks.map((task) => (
              <div
                key={task._id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  task.status === "completed"
                    ? "bg-muted/20 border-success-light"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                {/* Status Icon */}
                <div className={`flex-shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center ${
                  task.status === "completed"
                    ? "bg-success-light text-success"
                    : "bg-warning-light text-warning"
                }`}>
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <Badge variant={task.status === "completed" ? "default" : "secondary"} className={
                      task.status === "completed"
                        ? "bg-success-light text-success hover:bg-success-light"
                        : "bg-warning-light text-warning hover:bg-warning-light"
                    }>
                      {task.status === "completed" ? "Concluída" : "Pendente"}
                    </Badge>
                  </div>
                  <p className={`text-sm text-muted-foreground ${task.status === "completed" ? "line-through" : ""}`}>
                    {task.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{task.employee?.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {task.status !== "completed" && (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingTask(task);
                          setForm({
                            title: task.title,
                            description: task.description,
                            employee: task.employee._id,
                          });
                          setShowModal(true);
                        }}
                      >
                        <Pen className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-success hover:text-success hover:bg-success-light"
                        onClick={() => completeTask(task._id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTask(task._id)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <Card className="w-[420px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                      setForm({ title: "", description: "", employee: "" });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {editingTask ? "Alterar os dados da tarefa" : "Preencha os dados para criar uma tarefa"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="Título"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="Descrição"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Funcionário <span className="text-destructive">*</span></label>
                  <select
                    className="w-full border border-input rounded-md p-2 bg-background text-sm"
                    value={form.employee}
                    onChange={(e) => setForm({ ...form, employee: e.target.value })}
                  >
                    <option value="">Selecionar funcionário</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleSave}>
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                      setForm({ title: "", description: "", employee: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ManagerTasks;