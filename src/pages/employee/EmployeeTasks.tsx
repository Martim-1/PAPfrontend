import React, { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, CheckCircle2, Clock, ClipboardList, ListTodo } from "lucide-react";

import { API_URL } from "@/api";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  employee: { _id: string; email: string };
  createdAt: string;
  updatedAt: string;
}

const EmployeeTasks: React.FC = () => {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletingTask, setIsCompletingTask] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // =========================
  // FETCH TASKS
  // =========================
  const fetchTasks = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      console.log('Fetching tasks...', isPolling ? '(polling)' : '');
      const token = localStorage.getItem("token");
      console.log('Token exists:', !!token);
      if (!token) {
        if (!isPolling) toast({ 
          title: "Erro", 
          description: "Token não encontrado", 
          variant: "destructive" 
        });
        return;
      }

      const res = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response status:', res.status);

      if (!res.ok) {
        throw new Error("Falha ao buscar tarefas");
      }

      const data: Task[] = await res.json();
      console.log('Fetched tasks:', data.length);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      if (!isPolling) toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
      });
    } finally {
      if (!isPolling) setIsLoading(false);
      console.log('Tasks loading finished');
    }
  }, [toast]);

  useEffect(() => {
    console.log('useEffect fetchTasks triggered');
    fetchTasks();
    intervalRef.current = setInterval(() => fetchTasks(true), 2000); // Poll every 2 seconds
  }, [fetchTasks]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // =========================
  // COMPLETE TASK
  // =========================
  const completeTask = useCallback(
    async (taskId: string) => {
      if (isCompletingTask) return;

      try {
        setIsCompletingTask(taskId);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token não encontrado");
        }

        const res = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Falha ao completar tarefa");
        }

        const updated: Task = await res.json();

        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? updated : t))
        );

        toast({
          title: "Sucesso",
          description: "Tarefa concluída com sucesso",
        });
      } catch (error) {
        console.error("Erro ao completar tarefa:", error);
        toast({
          title: "Erro",
          description: (error as Error).message || "Não foi possível completar a tarefa",
          variant: "destructive",
        });
      } finally {
        setIsCompletingTask(null);
      }
    },
    [isCompletingTask, toast]
  );

  // =========================
  // RENDER
  // =========================
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Minhas Tarefas</h1>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Carregando tarefas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        <h1 className="text-2xl font-bold">Minhas Tarefas</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tasks.length}</div>
              <CardDescription>tarefas atribuídas</CardDescription>
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

        {/* Empty State */}
        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">
                Nenhuma tarefa atribuída ainda. O gerente irá atribuir tarefas quando necessário.
              </p>
            </CardContent>
          </Card>
        )}

        {/* PENDING TASKS */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <CardTitle>Tarefas Pendentes</CardTitle>
              </div>
              <CardDescription>{pendingTasks.length} tarefas a aguardar conclusão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors bg-card"
                >
                  <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-warning-light text-warning">
                    <Clock className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge variant="secondary" className="bg-warning-light text-warning hover:bg-warning-light">
                        Pendente
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.description}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Atribuída em: {new Date(task.createdAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>

                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* COMPLETED TASKS */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle>Tarefas Concluídas</CardTitle>
              </div>
              <CardDescription>{completedTasks.length} tarefas finalizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-success-light bg-muted/20"
                >
                  <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-success-light text-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-muted-foreground line-through">
                        {task.title}
                      </h3>
                      <Badge variant="default" className="bg-success-light text-success hover:bg-success-light">
                        Concluída
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground line-through mb-2">
                        {task.description}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Concluída em: {new Date(task.updatedAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTasks;
