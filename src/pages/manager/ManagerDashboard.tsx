import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StoreMap from "@/components/StoreMap";
import StatCard from "@/components/StatCard";
import { Package, Users, LayoutGrid, MapPin } from "lucide-react";
import { ApiEmployee, Product, EntryPoint } from "@/data/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";

interface Section {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Shelf {
  id: string;
  sectionId: string;
  name: string;
  x: number;
  y: number;
}

const ManagerDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { makeRequest } = useApi();

  const [employeeList, setEmployeeList] = useState<ApiEmployee[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [mapEntryPoint, setMapEntryPoint] = useState<EntryPoint>({ x: 300, y: 480 });


  const fetchEmployees = async () => {
    try {
      const data = await makeRequest('/manager/employees');
      setEmployeeList(data);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar funcionários", variant: "destructive" });
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await makeRequest('/products');
      setProductList(data);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar produtos", variant: "destructive" });
    }
  };

  const fetchMap = async () => {
    try {
      if (!user?.storeId) {
        setSections([]);
        setShelves([]);
        setMapEntryPoint({ x: 300, y: 480 });
        return;
      }

      const data = await makeRequest(`/map?storeId=${encodeURIComponent(user.storeId)}`);
      setSections(data?.sections ?? []);
      setShelves(data?.shelves ?? []);
      setMapEntryPoint(data?.entryPoint ?? { x: 300, y: 480 });
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message || "Não foi possível carregar mapa", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchProducts();
    fetchMap();
  }, []);

  const employeesWithSection = employeeList.filter(emp => emp.sections && emp.sections.length > 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Painel de Gestão</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gerencie funcionários e secções da loja</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <StatCard title="Produtos" value={productList.length} icon={Package} />
          <StatCard title="Funcionários" value={employeeList.length} icon={Users} />
          <StatCard title="Secções" value={sections.length} icon={LayoutGrid} />
          <StatCard title="Atribuídos" value={employeesWithSection.length} icon={MapPin} />
        </div>

        <div>
          <div className="bg-card rounded-xl p-3 sm:p-6 shadow">
            <StoreMap
              sections={sections}
              shelves={shelves}
              entryPoint={mapEntryPoint}
              showEmployees={true}
              employees={employeeList}
            />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;