import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StoreMap from "@/components/StoreMap";
import StatCard from "@/components/StatCard";
import { Package, Users, LayoutGrid, MapPin, GripVertical } from "lucide-react";
import { ApiEmployee, Product, EntryPoint } from "@/data/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { API_URL } from "@/api";

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
  const [mapEmployeeList, setMapEmployeeList] = useState<ApiEmployee[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [mapEntryPoint, setMapEntryPoint] = useState<EntryPoint>({ x: 300, y: 480 });
  const [draggingProduct, setDraggingProduct] = useState<Product | null>(null);
  const [isMovingProduct, setIsMovingProduct] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState(0);


  const fetchEmployees = async () => {
    try {
      const data = await makeRequest('/manager/employees');
      setEmployeeList(data);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar funcionários", variant: "destructive" });
    }
  };

  const fetchMapEmployees = async () => {
    if (!user?.storeId) return;
    try {
      const data = await makeRequest(`/map/employees?storeId=${encodeURIComponent(user.storeId)}`);
      setMapEmployeeList(Array.isArray(data) ? data : []);
    } catch {
      setMapEmployeeList([]);
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
    fetchMapEmployees();
    fetchProducts();
    fetchMap();

    // Refresh map employees every 30 seconds so shifts activate automatically
    const interval = setInterval(fetchMapEmployees, 30_000);
    return () => clearInterval(interval);
  }, []);

  const employeesWithSection = employeeList.filter(emp => emp.sections && emp.sections.length > 0);

  const handleDragStart = useCallback((e: React.DragEvent, product: Product) => {
    setDraggingProduct(product);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const moveProductToShelf = useCallback(async (product: Product, newShelfId: string | null) => {
    if (isMovingProduct) return;

    const productId = (product as any)._id || product._id;
    const previousProducts = productList;
    const previousSectionId = product.section || (product as any).sectionId;
    const newSectionId = newShelfId
      ? shelves.find((s) => s.id === newShelfId)?.sectionId || previousSectionId
      : previousSectionId;

    setProductList((prev) => prev.map((p) => {
      if ((p as any)._id === productId || p._id === productId) {
        return { ...p, shelfId: newShelfId, section: newSectionId, sectionId: newSectionId };
      }
      return p;
    }));

    try {
      setIsMovingProduct(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const response = await fetch(`${API_URL}/products/${productId}/shelf`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shelfId: newShelfId, sectionId: newSectionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao atualizar prateleira");
      }

      const updatedProduct = await response.json();
      setProductList((prev) => prev.map((p) => {
        if ((p as any)._id === productId || p._id === productId) {
          return { ...p, ...updatedProduct };
        }
        return p;
      }));

      const shelfName = shelves.find(s => s.id === newShelfId)?.name;
      toast({
        title: "Sucesso",
        description: newShelfId ? `Produto movido para ${shelfName}` : "Produto removido da prateleira",
      });
      setLastErrorTime(0);
    } catch (error) {
      setProductList(previousProducts);
      const now = Date.now();
      if (now - lastErrorTime > 2000) {
        toast({ title: "Erro", description: (error as Error).message || "Falha ao mover produto", variant: "destructive" });
        setLastErrorTime(now);
      }
    } finally {
      setIsMovingProduct(false);
      setDraggingProduct(null);
    }
  }, [productList, isMovingProduct, lastErrorTime, shelves, toast]);

  const handleDropOnShelf = useCallback((e: React.DragEvent, shelfId: string) => {
    e.preventDefault();
    if (!draggingProduct || isMovingProduct) return;
    moveProductToShelf(draggingProduct, shelfId);
  }, [draggingProduct, isMovingProduct, moveProductToShelf]);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Map */}
          <div className="bg-card rounded-xl p-3 sm:p-6 shadow">
            <StoreMap
              sections={sections}
              shelves={shelves}
              entryPoint={mapEntryPoint}
              showEmployees={true}
              employees={mapEmployeeList}
            />
          </div>

          {/* Products Management by Shelves - all sections */}
          <div className="bg-card rounded-xl p-3 sm:p-6 border border-border card-shadow">
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Produtos por Prateleira
            </h3>

            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {/* All shelves across all sections */}
              {shelves.map((shelf) => {
                const shelfProducts = productList.filter((p) => p.shelfId === shelf.id);
                return (
                  <div
                    key={shelf.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnShelf(e, shelf.id)}
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      draggingProduct ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <div className="flex flex-col gap-1 mb-3">
                      <h4 className="font-semibold text-sm text-foreground">{shelf.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        📍 {sections.find(s => s.id === shelf.sectionId)?.name || 'Secção Desconhecida'} • {shelfProducts.length} produto(s)
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {shelfProducts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Arraste produtos aqui</p>
                      ) : (
                        shelfProducts.map((product) => (
                          <div
                            key={product._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, product)}
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-move transition-colors"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Unassigned products */}
              {(() => {
                const unassigned = productList.filter((p) => !p.shelfId);
                return (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggingProduct || isMovingProduct) return;
                      moveProductToShelf(draggingProduct, null);
                    }}
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      draggingProduct ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <h4 className="font-medium text-sm text-foreground mb-3">Sem Prateleira ({unassigned.length})</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {unassigned.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Todos os produtos estão nas prateleiras</p>
                      ) : (
                        unassigned.map((product) => (
                          <div
                            key={product._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, product)}
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-move transition-colors"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;