import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Search,
  Package,
  Users,
  BarChart3,
  Check,
  Map,
  LogOut,
  PenTool,
  ListTodo,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links =
    user?.role === "customer"
      ? [
          { to: "/customer", icon: LayoutDashboard, label: "Dashboard" },

        ]
      : user?.role === "employee"
      ? [
          { to: "/employee", icon: LayoutDashboard, label: "Dashboard" },
          { to: "/employee/products", icon: Package, label: "Produtos" },
          { to: "/employee/tasks", icon: ListTodo, label: "Tarefas" },
          { to: "/employee/chat", icon: MessageSquare, label: "Chat" },
          { to: "/profiles", icon: Users, label: "Perfis" },
        ]
      : [
          { to: "/manager", icon: LayoutDashboard, label: "Dashboard" },
          { to: "/manager/products", icon: Package, label: "Produtos" },
          { to: "/manager/employees", icon: Users, label: "Funcionários" },
          { to: "/manager/statistics", icon: BarChart3, label: "Estatísticas" },
          { to: "/manager/tasks", icon: Check, label: "Tarefas" },
          { to: "/manager/chat", icon: MessageSquare, label: "Chat" },
          { to: "/profiles", icon: Users, label: "Perfis" },
          { to: "/manager/map-editor", icon: PenTool, label: "Editor do Mapa" },
        ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Header com logo um pouco maior */}
        <SidebarHeader className="border-b pb-5 pt-6 px-4">
        <div className="flex items-center gap-3">
          {/* Logo maior */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <img
              src={logo}
              alt="MarketFind Logo"
              className="h-11 w-11 object-contain drop-shadow-sm"
            />
          </div>

          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-xl tracking-tight">MarketFind</span>
            <span className="text-xs text-muted-foreground">Smart Navigation</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.to}>
              <SidebarMenuButton
                asChild
                className="font-semibold text-base transition-colors hover:bg-primary/10"
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 w-full",
                      isActive && "bg-accent text-accent-foreground font-semibold"
                    )
                  }
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t pt-4 pb-3 px-3">
        <Button
          variant="ghost"
          className="w-full justify-start font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Terminar sessão
        </Button>
      </SidebarFooter>
    </Sidebar>
    </SidebarProvider>
  );
}