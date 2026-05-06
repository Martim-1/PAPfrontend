import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  Users,
  CheckCircle2,
  Medal,
  Crown,
  BarChart3,
  User,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { API_URL } from "@/api";

interface Ranking {
  employeeId: string;
  email: string;
  avatar?: string;
  totalCompleted: number;
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const BAR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const ManagerStatistics: React.FC = () => {
  const [ranking, setRanking] = useState<Ranking[]>([]);

  const fetchRanking = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/tasks/stats/ranking`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setRanking(data);
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const totalCompleted = ranking.reduce((sum, r) => sum + r.totalCompleted, 0);
  const topEmployee = ranking.length > 0 ? ranking[0] : null;

  const chartData = ranking.slice(0, 8).map((item) => ({
    name: item.email.split("@")[0],
    tarefas: item.totalCompleted,
  }));

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Estatísticas</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Tarefas Concluídas
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCompleted}</div>
              <CardDescription>por todos os funcionários</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Melhor Funcionário
              </CardTitle>
              <Crown className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {topEmployee ? topEmployee.email.split("@")[0] : "—"}
              </div>
              <CardDescription>
                {topEmployee
                  ? `${topEmployee.totalCompleted} tarefas concluídas`
                  : "Sem dados"}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Funcionários Ativos
              </CardTitle>
              <Users className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{ranking.length}</div>
              <CardDescription>com tarefas concluídas</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Tarefas por Funcionário</CardTitle>
              </div>
              <CardDescription>
                Distribuição de tarefas concluídas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="tarefas" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Ranking */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <CardTitle>Ranking de Funcionários</CardTitle>
            </div>
            <CardDescription>
              Classificação por tarefas concluídas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.map((item, index) => (
              <div
                key={item.employeeId}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  index < 3
                    ? "bg-accent/50 border-accent"
                    : "bg-muted/30 border-transparent"
                }`}
              >
                {/* Position */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index >= 3 ? "bg-muted text-muted-foreground" : ""
                  }`}
                  style={
                    index < 3
                      ? { backgroundColor: MEDAL_COLORS[index] + "30", color: MEDAL_COLORS[index] }
                      : undefined
                  }
                >
                  {index < 3 ? (
                    <Medal
                      className="h-5 w-5"
                      style={{ color: MEDAL_COLORS[index] }}
                    />
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {item.avatar ? (
                    <AvatarImage
                      src={`${API_URL.replace('/api', '')}${item.avatar}`}
                      alt={item.email}
                    />
                  ) : null}
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.totalCompleted} tarefas concluídas
                  </p>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-2xl font-bold tabular-nums">
                  {item.totalCompleted}
                </div>
              </div>
            ))}

            {ranking.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Ainda não há tarefas concluídas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagerStatistics;