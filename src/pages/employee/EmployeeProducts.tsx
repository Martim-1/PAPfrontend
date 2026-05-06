import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Product } from "@/data/types";
import { Package, Search, AlertCircle, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { API_URL } from "@/api";

const EmployeeProducts: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [productList, setProductList] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch products
  const fetchProducts = async (isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      console.log('Fetching products...', isPolling ? '(polling)' : '');
      const token = localStorage.getItem("token");
      console.log('Token exists:', !!token);
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response status:', res.status);
      if (!res.ok) throw new Error("Erro ao carregar produtos");
      
      const data: Product[] = await res.json();
      console.log('Fetched products:', data.length);
      setProductList(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (!isPolling) toast({ title: "Erro", description: "Não foi possível carregar produtos", variant: "destructive" });
    } finally {
      if (!isPolling) setIsLoading(false);
      console.log('Loading finished');
    }
  };

  useEffect(() => {
    console.log('useEffect triggered, user:', user, 'storeId:', user?.storeId);
    if (!user?.storeId) {
      setProductList([]);
      setIsLoading(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    fetchProducts();
    intervalRef.current = setInterval(() => fetchProducts(true), 2000); // Poll every 2 seconds
  }, [user?.storeId, toast]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const filteredProducts = productList.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = productList.filter((p) => p.stock < 20).length;

  const startEditStock = (product: Product) => {
    setEditingStockId(product._id);
    setEditingStockValue(product.stock);
  };

  const cancelEditStock = () => {
    setEditingStockId(null);
    setEditingStockValue(0);
  };

  const saveStock = async (productId: string) => {
    if (editingStockValue < 0) {
      toast({ title: "Erro", description: "Stock não pode ser negativo", variant: "destructive" });
      return;
    }

    setSavingStock(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products/${productId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: editingStockValue }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar stock");

      const updatedProduct = await res.json();
      setProductList((prev) =>
        prev.map((p) => (p._id === productId ? updatedProduct : p))
      );

      toast({ title: "Sucesso", description: "Stock atualizado com sucesso" });
      setEditingStockId(null);
      setEditingStockValue(0);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Produtos da Loja</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gerencie o stock dos produtos</p>
        </div>

        {!user?.storeId && (
          <div className="rounded-lg bg-warning-light border border-warning/30 p-3 sm:p-4 text-warning-foreground flex items-start gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm">Você não está associado a nenhuma loja. Contacte um gerente para ser adicionado.</span>
          </div>
        )}

        {user?.storeId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-card rounded-lg sm:rounded-xl p-2 sm:p-6 shadow border border-border">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-lg sm:text-3xl font-bold">{productList.length}</p>
              </div>
              <div className="bg-card rounded-lg sm:rounded-xl p-2 sm:p-6 shadow border border-border">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stock</p>
                <p className="text-lg sm:text-3xl font-bold">{productList.reduce((acc, p) => acc + p.stock, 0)}</p>
              </div>
              <div className={`bg-card rounded-lg sm:rounded-xl p-2 sm:p-6 shadow border ${lowStockProducts > 0 ? 'border-destructive/50' : 'border-border'}`}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Baixo</p>
                <p className={`text-lg sm:text-3xl font-bold ${lowStockProducts > 0 ? 'text-destructive' : ''}`}>{lowStockProducts}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm h-8 sm:h-auto"
              />
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl overflow-hidden shadow border border-border">
              {isLoading ? (
                <div className="p-6 sm:p-8 text-center text-xs sm:text-base text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-xs sm:text-base text-muted-foreground">
                  {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Nome</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Cat</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Sec</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Preço</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr 
                          key={product._id} 
                          className="border-b border-border hover:bg-muted/30 transition-colors last:border-b-0"
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium truncate text-xs sm:text-sm">{product.name}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-muted-foreground text-xs">{product.category.substring(0, 3)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {product.section.substring(0, 3)}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">€{product.price.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {editingStockId === product._id ? (
                              <div className="flex gap-1 items-center">
                                <Input
                                  type="number"
                                  value={editingStockValue}
                                  onChange={(e) => setEditingStockValue(Math.max(0, Number(e.target.value)))}
                                  className="w-14 h-7 py-0 sm:py-1 text-xs"
                                  min="0"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => saveStock(product._id)}
                                  disabled={savingStock}
                                  className="h-7 px-1.5 text-xs"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditStock}
                                  disabled={savingStock}
                                  className="h-8 px-2"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditStock(product)}
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                                  product.stock < 20
                                    ? 'bg-destructive/10 text-destructive'
                                    : product.stock < 50
                                    ? 'bg-warning-light text-warning'
                                    : 'bg-success-light text-success'
                                }`}
                              >
                                {product.stock}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeProducts;
