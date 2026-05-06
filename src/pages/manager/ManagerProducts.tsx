import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Product } from "@/data/types";
import { Package, Plus, Search, Trash, Pen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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

const ManagerProducts: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [productList, setProductList] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductData, setEditingProductData] = useState({ name: "", category: "", section: "", price: 0, stock: 0 });
  const [newProduct, setNewProduct] = useState({ name: "", category: "", section: "", price: 0, stock: 0 });
  const [sections, setSections] = useState<Section[]>([]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Product[] = await res.json();
      setProductList(data);
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar produtos", variant: "destructive" });
    }
  };

  // Fetch sections
  const fetchSections = async () => {
    try {
      if (!user?.storeId) return;
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/map?storeId=${encodeURIComponent(user.storeId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar secções");
      const data = await res.json();
      setSections(data?.sections ?? []);
    } catch {
      console.error("Erro ao carregar secções");
    }
  };

  useEffect(() => {
    if (!user?.storeId) {
      setProductList([]);
      setSections([]);
      return;
    }
    fetchProducts();
    fetchSections();
  }, [user?.storeId]);

  useEffect(() => {
    if (!user?.storeId) return;
    const onVisible = () => { if (!document.hidden) { fetchProducts(); fetchSections(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.storeId]);

  // Create or Edit
  const handleSaveProduct = async () => {
    try {
      const token = localStorage.getItem("token");
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct ? `${API_URL}/products/${editingProduct._id}` : `${API_URL}/products`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) throw new Error();
      const savedProduct = await res.json();

      setProductList((prev) =>
        editingProduct ? prev.map((p) => (p._id === savedProduct._id ? savedProduct : p)) : [...prev, savedProduct]
      );
      setShowProductModal(false);
      setNewProduct({ name: "", category: "", section: "", price: 0, stock: 0 });
      setEditingProduct(null);

      toast({ title: `Produto ${editingProduct ? "editado" : "criado"}`, description: "Operação realizada com sucesso" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar produto", variant: "destructive" });
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tens a certeza que queres remover este produto?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setProductList((prev) => prev.filter((p) => p._id !== id));
      toast({ title: "Produto removido", description: "Produto removido com sucesso" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível remover produto", variant: "destructive" });
    }
  };

  const filteredProducts = productList.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const startInlineEdit = (product: Product) => {
    setEditingProductId(product._id);
    setEditingProductData({
      name: product.name,
      category: product.category,
      section: product.section,
      price: product.price,
      stock: product.stock,
    });
  };

  const cancelInlineEdit = () => {
    setEditingProductId(null);
  };

  const saveInlineEdit = async () => {
    if (!editingProductId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products/${editingProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingProductData),
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar produto");
      }

      const updatedProduct = await res.json();
      setProductList((prev) => prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)));
      setEditingProductId(null);
      toast({ title: "Produto atualizado", description: "Produto alterado com sucesso" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar produto", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Produtos</h1>
          <Button onClick={() => setShowProductModal(true)} disabled={!user?.storeId} className="text-xs sm:text-sm h-8 sm:h-auto w-full sm:w-auto">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Adicionar
          </Button>
        </div>
        {!user?.storeId && (
          <div className="rounded-lg bg-warning-light border border-warning/30 p-2 sm:p-3 text-xs sm:text-sm text-warning-foreground">
            Para gerir produtos, primeiro crie ou associe-se a uma loja no painel de mapa.
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-9 w-full text-xs sm:text-sm h-8 sm:h-auto"
          />
        </div>

        {user?.storeId && (
          <div className="bg-card rounded-xl overflow-x-auto shadow border border-border">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Nome</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Cat</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Sec</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Preço</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Stock</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-b-0">
                    {editingProductId === product._id ? (
                      <>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Input
                            value={editingProductData.name}
                            onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()}
                            className="text-xs h-6 sm:h-auto"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <Input
                            value={editingProductData.category}
                            onChange={(e) => setEditingProductData({ ...editingProductData, category: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()}
                            className="text-xs h-6 sm:h-auto"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <select
                            value={editingProductData.section}
                            onChange={(e) => setEditingProductData({ ...editingProductData, section: e.target.value })}
                            className="w-full px-2 sm:px-3 py-1 rounded-md border border-input bg-background text-foreground text-xs"
                          >
                            <option value="">Sel</option>
                            {sections.map((section) => (
                              <option key={section.id} value={section.id}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                          <Input
                            type="number"
                            value={editingProductData.price}
                            onChange={(e) => setEditingProductData({ ...editingProductData, price: Number(e.target.value) })}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()}
                            className="text-xs h-6 sm:h-auto"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Input
                            type="number"
                            value={editingProductData.stock}
                            onChange={(e) => setEditingProductData({ ...editingProductData, stock: Number(e.target.value) })}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()}
                            className="text-xs h-6 sm:h-auto w-12"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 flex gap-1">
                          <Button size="sm" onClick={saveInlineEdit} className="text-xs px-1.5 h-6 sm:h-auto">S</Button>
                          <Button size="sm" variant="outline" onClick={cancelInlineEdit} className="text-xs px-1.5 h-6 sm:h-auto">C</Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium truncate">{product.name}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell text-xs">{product.category.substring(0, 3)}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell text-xs">{product.section.substring(0, 3)}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">€{product.price.toFixed(2)}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-semibold">{product.stock}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 flex gap-1">
                          <Button size="icon" onClick={() => startInlineEdit(product)} className="w-6 h-6 sm:w-auto sm:h-auto">
                            <Pen className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => handleDeleteProduct(product._id)} className="w-6 h-6 sm:w-auto sm:h-auto">
                            <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL PRODUTO */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-0">
            <div className="bg-card rounded-xl p-4 sm:p-6 w-full sm:w-[420px] space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold text-base sm:text-lg">{editingProduct ? "Editar Produto" : "Adicionar Produto"}</h3>

              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Nome <span className="text-destructive">*</span></label>
                <Input placeholder="Nome" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="text-xs sm:text-sm h-8 sm:h-auto" />
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Categoria <span className="text-destructive">*</span></label>
                <Input placeholder="Categoria" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="text-xs sm:text-sm h-8 sm:h-auto" />
              </div>
              
              {/* Dropdown de Secção */}
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Secção <span className="text-destructive">*</span></label>
                <div className="relative">
                  <select
                    value={newProduct.section}
                    onChange={(e) => setNewProduct({ ...newProduct, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground appearance-none cursor-pointer text-xs sm:text-sm h-8 sm:h-auto"
                  >
                    <option value="">Selecione uma secção</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Preço <span className="text-destructive">*</span></label>
                <Input type="number" placeholder="Preço" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className="text-xs sm:text-sm h-8 sm:h-auto" />
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Stock <span className="text-destructive">*</span></label>
                <Input type="number" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="text-xs sm:text-sm h-8 sm:h-auto" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 text-xs sm:text-sm h-8 sm:h-auto" onClick={handleSaveProduct}>
                  {editingProduct ? "Salvar" : "Criar"}
                </Button>
                <Button className="flex-1 text-xs sm:text-sm h-8 sm:h-auto" variant="outline" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ManagerProducts;