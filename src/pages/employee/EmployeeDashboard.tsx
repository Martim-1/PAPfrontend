import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StoreMap from '@/components/StoreMap';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { Product, Section, Shelf, EntryPoint, ApiEmployee } from '@/data/types';
import { Package, MapPin, CheckCircle, AlertCircle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { API_URL } from '@/api';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { makeRequest } = useApi();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(user?.sectionId || null);
  const [draggingProduct, setDraggingProduct] = useState<Product | null>(null);
  const [isMovingProduct, setIsMovingProduct] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState(0);

  const [mapSections, setMapSections] = useState<Section[]>([]);
  const [mapShelves, setMapShelves] = useState<Shelf[]>([]);
  const [mapEntryPoint, setMapEntryPoint] = useState<EntryPoint>({ x: 300, y: 480 });
  const [mapEmployees, setMapEmployees] = useState<ApiEmployee[]>([]);
  const [requests, setRequests] = useState<Array<{_id:string, managerEmail:string, storeId:string, storeName:string}>>([]);
  const [apiProductList, setApiProductList] = useState<Product[]>([]);
  const [tasks, setTasks] = useState<Array<{_id:string, title:string, description:string, status:'pending'|'completed', createdAt:string, updatedAt:string}>>([]);

  const mySectionIds = React.useMemo(() => 
    user?.sections?.map(s => s.sectionId) || [user?.sectionId || 'fruits'],
    [user?.sections, user?.sectionId]
  );
  
  // Produtos das seções do empregado (do backend)
  const mySectionProducts = React.useMemo(() => {
    if (apiProductList.length > 0) {
      return apiProductList.filter(p => {
        return mySectionIds.includes(p.section) || mySectionIds.includes((p as any).sectionId);
      });
    }
    // Não usar dados mock - se não há produtos da API, mostrar 0
    return [];
  }, [apiProductList, mySectionIds]);

  const lowStockProducts = React.useMemo(() =>
    mySectionProducts.filter(p => p.stock < 30),
    [mySectionProducts]
  );

  const completedTasks = React.useMemo(() =>
    tasks.filter(t => t.status === 'completed'),
    [tasks]
  );

  const pendingTasks = React.useMemo(() =>
    tasks.filter(t => t.status === 'pending'),
    [tasks]
  );

  const fetchRequestsForRefresh = useCallback(async () => {
    try {
      const data = await makeRequest('/employee/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
    }
  }, [makeRequest]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [mapData, productsData, employeesData, tasksData] = await Promise.all([
          user?.storeId ? makeRequest(`/map?storeId=${encodeURIComponent(user.storeId)}`) : Promise.resolve(null),
          makeRequest('/products'),
          user?.storeId ? makeRequest(`/map/employees?storeId=${encodeURIComponent(user.storeId)}`) : Promise.resolve([]),
          makeRequest('/tasks'),
        ]);

        if (mapData) {
          setMapSections(Array.isArray(mapData?.sections) ? mapData.sections : []);
          setMapShelves(Array.isArray(mapData?.shelves) ? mapData.shelves : []);
          setMapEntryPoint(mapData?.entryPoint ?? { x: 300, y: 480 });
        }
        setApiProductList(Array.isArray(productsData) ? productsData : []);
        setMapEmployees(Array.isArray(employeesData) ? employeesData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }

      try {
        await fetchRequestsForRefresh();
      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, makeRequest, fetchRequestsForRefresh]);

  const handleRespondRequest = useCallback(async (requestId: string, accept: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employee/requests/${requestId}/${accept ? 'accept' : 'reject'}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao processar solicitação');

      toast({ title: `Solicitação ${accept ? 'aceite' : 'rejeitada'}` });
      fetchRequestsForRefresh();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível processar a solicitação', variant: 'destructive' });
      console.error('Erro ao responder solicitação:', error);
    }
  }, [toast, fetchRequestsForRefresh]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (user?.role === 'employee') {
        fetchRequestsForRefresh();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.role, fetchRequestsForRefresh]);

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
    const previousProducts = apiProductList;
    const previousSectionId = product.section || (product as any).sectionId;
    const newSectionId = newShelfId
      ? mapShelves.find((s) => s.id === newShelfId)?.sectionId || previousSectionId
      : previousSectionId;

    setApiProductList((prev) => prev.map((p) => {
      if ((p as any)._id === productId || p._id === productId) {
        return {
          ...p,
          shelfId: newShelfId,
          section: newSectionId,
          sectionId: newSectionId,
        };
      }
      return p;
    }));

    try {
      setIsMovingProduct(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_URL}/products/${productId}/shelf`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shelfId: newShelfId,
          sectionId: newSectionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao atualizar prateleira");
      }

      const updatedProduct = await response.json();
      setApiProductList((prev) => prev.map((p) => {
        if ((p as any)._id === productId || p._id === productId) {
          return {
            ...p,
            ...updatedProduct,
          };
        }
        return p;
      }));

      const shelfName = mapShelves.find(s => s.id === newShelfId)?.name;
      const message = newShelfId
        ? `Produto movido para ${shelfName}`
        : "Produto removido da prateleira";

      toast({ title: "Sucesso", description: message });
      setLastErrorTime(0);
    } catch (error) {
      setApiProductList(previousProducts);
      const now = Date.now();
      if (now - lastErrorTime > 2000) {
        toast({
          title: "Erro",
          description: (error as Error).message || "Falha ao mover produto",
          variant: "destructive",
        });
        setLastErrorTime(now);
      }
      console.error("Erro ao mover produto:", error);
    } finally {
      setIsMovingProduct(false);
      setDraggingProduct(null);
    }
  }, [apiProductList, isMovingProduct, lastErrorTime, mapShelves, toast]);

  const handleDropOnShelf = useCallback((e: React.DragEvent, shelfId: string) => {
    e.preventDefault();
    if (!draggingProduct || isMovingProduct) return;
    moveProductToShelf(draggingProduct, shelfId);
  }, [draggingProduct, isMovingProduct, moveProductToShelf]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Verificação se empregado tem seções atribuídas */}
        {(!user?.sections || user.sections.length === 0) && (
          <div className="bg-warning-light border border-warning/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 text-warning-foreground">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-sm">Aviso: Nenhuma secção atribuída</p>
                <p className="text-xs sm:text-sm text-warning-foreground mt-1">
                  Você está visualizando produtos da secção padrão (Frutas). Entre em contato com seu gerente para ser atribuído às suas secções.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel do Funcionário</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Secções: <span className="text-primary font-medium break-words">{mapSections.filter(s => mySectionIds.includes(s.id)).map(s => s.name).join(', ') || 'Nenhuma atribuída'}</span>
            </p>
          </div>
        </div>

        {/* Solicitações de Associação */}
        {requests.length > 0 && (
          <div className="bg-card rounded-xl p-3 sm:p-4 border border-border card-shadow">
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">Solicitações de Gerente</h3>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 rounded-lg bg-muted/30">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{req.managerEmail}</p>
                    <p className="text-xs text-muted-foreground">Loja: {req.storeName} ({req.storeId})</p>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleRespondRequest(req._id, true)} className="text-xs sm:text-sm py-1">Aceitar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRespondRequest(req._id, false)} className="text-xs sm:text-sm py-1">Rejeitar</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <StatCard
            title="Produtos"
            value={mySectionProducts.length}
            icon={Package}
          />
          <StatCard
            title="Stock Baixo"
            value={lowStockProducts.length}
            icon={AlertCircle}
            className={lowStockProducts.length > 0 ? 'border-destructive/50' : ''}
          />
          <StatCard
            title="Tarefas"
            value={completedTasks.length}
            icon={CheckCircle}
          />
          <StatCard
            title="Secções"
            value={user?.sections?.length || 0}
            icon={MapPin}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Map */}
          <StoreMap
            showEmployees={true}
            employees={mapEmployees}
            selectedSection={selectedSection}
            onSectionClick={setSelectedSection}
            sections={mapSections}
            shelves={mapShelves}
            entryPoint={mapEntryPoint}
          />

          {/* Products Management by Shelves */}
          <div className="bg-card rounded-xl p-3 sm:p-6 border border-border card-shadow">
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Produtos das Secções
            </h3>

            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {/* Produtos da secção do empregado */}
              {(() => {
                // Produtos sem prateleira atribuída (que pertencem às seções do empregado)
                const unassignedProducts = mySectionProducts.filter((p) => !p.shelfId);
                
                return (
                  <>
                    {/* Prateleiras */}
                    {mapShelves
                      .filter((s) => mySectionIds.includes(s.sectionId))
                      .map((shelf) => {
                        const shelfProducts = mySectionProducts.filter((p) => p.shelfId === shelf.id);
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
                                📍 {mapSections.find(s => s.id === shelf.sectionId)?.name || 'Secção Desconhecida'} • {shelfProducts.length} produto(s)
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

                    {/* Produtos sem prateleira */}
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
                      <h4 className="font-medium text-sm text-foreground mb-3">Sem Prateleira ({unassignedProducts.length})</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {unassignedProducts.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Todos os produtos estão nas prateleiras</p>
                        ) : (
                          unassignedProducts.map((product) => (
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
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Alerta de Stock Baixo</h4>
                <p className="text-muted-foreground text-sm mt-1">
                  Os seguintes produtos precisam de reposição:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {lowStockProducts.map((product) => (
                    <span
                      key={product._id}
                      className="px-3 py-1 bg-card rounded-full text-sm font-medium text-foreground"
                    >
                      {product.name} ({product.stock})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="bg-warning-light border border-warning/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Tarefas Pendentes ({pendingTasks.length})</h4>
                <p className="text-muted-foreground text-sm mt-1">
                  Você tem tarefas pendentes que precisam de ser concluídas.
                </p>
                <div className="space-y-2 mt-4">
                  {pendingTasks.map((task) => (
                    <div key={task._id} className="bg-white rounded-lg p-3">
                      <p className="font-medium text-foreground text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Atribuída em: {new Date(task.createdAt).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="mt-4 w-full" variant="default" asChild>
                  <Link to="/employee/tasks">Ver todas as tarefas</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
