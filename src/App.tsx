import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Páginas
import Login from "./pages/Login";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProducts from "./pages/employee/EmployeeProducts";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerProducts from "./pages/manager/ManagerProducts";
import ManagerEmployees from "./pages/manager/ManagerEmployees";
import ManagerTasks from "./pages/manager/ManagerTasks";
import MapEditor from "./pages/manager/MapEditor";
import NotFound from "./pages/NotFound";
import ManagerStatistics from "./pages/manager/ManagerStatistics";
import ProfilePage from "./pages/ProfilePage";
import ProfilesPage from "./pages/ProfilesPage";
import ChatPage from "./pages/ChatPage";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" style={{ padding: '2px' }}>
            <div className="absolute inset-[2px] bg-slate-800 rounded-full"></div>
          </div>
        </div>
      </div>
      <p className="text-slate-300 font-medium">A carregar...</p>
    </div>
  </div>
);

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const RoleRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case "customer":
      return <Navigate to="/customer" replace />;
    case "employee":
      return <Navigate to="/employee" replace />;
    case "manager":
      return <Navigate to="/manager" replace />;
    case "admin":
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RoleRedirect />} />
    <Route path="/login" element={<Login />} />
    
    {/* Profile - Accessible to all authenticated users */}
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />

    {/* Customer */}
    <Route
      path="/customer/*"
      element={
        <ProtectedRoute allowedRoles={["customer"]}>
          <CustomerDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customer/chat"
      element={
        <ProtectedRoute allowedRoles={["customer"]}>
          <ChatPage />
        </ProtectedRoute>
      }
    />

    {/* Employee */}
    <Route
      path="/employee"
      element={
        <ProtectedRoute allowedRoles={["employee"]}>
          <EmployeeDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profiles"
      element={
        <ProtectedRoute allowedRoles={["customer", "employee", "manager"]}>
          <ProfilesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/employee/products"
      element={
        <ProtectedRoute allowedRoles={["employee"]}>
          <EmployeeProducts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/employee/tasks"
      element={
        <ProtectedRoute allowedRoles={["employee"]}>
          <EmployeeTasks />
        </ProtectedRoute>
      }
    />
    <Route
      path="/employee/chat"
      element={
        <ProtectedRoute allowedRoles={["employee"]}>
          <ChatPage />
        </ProtectedRoute>
      }
    />

    {/* Manager */}
    <Route
      path="/manager"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <ManagerDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/manager/products"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <ManagerProducts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/manager/employees"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <ManagerEmployees />
        </ProtectedRoute>
      }
    />
    <Route
      path="/manager/tasks"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <ManagerTasks />
        </ProtectedRoute>
      }
    />
    <Route
      path="/manager/chat"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <ChatPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/manager/statistics"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <ManagerStatistics />
        </ProtectedRoute>
      }
    />
    <Route
      path="/manager/map-editor"
      element={
        <ProtectedRoute allowedRoles={["manager"]}>
          <MapEditor />
        </ProtectedRoute>
      }
    />

    {/* Admin */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;