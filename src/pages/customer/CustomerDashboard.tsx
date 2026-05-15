import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StoreMap from '@/components/StoreMap';
import ProductSearch from '@/components/ProductSearch';
import { useApi } from '@/hooks/useApi';
import { Product, Section, Shelf, EntryPoint, ApiEmployee, SearchHistory } from '@/data/types';
import { Package, TrendingUp, Clock, Sparkles } from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { makeRequest } = useApi();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeQuery, setStoreQuery] = useState('');
  const [storeResults, setStoreResults] = useState<{ storeId: string; storeName: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [mapSections, setMapSections] = useState<Section[]>([]);
  const [mapShelves, setMapShelves] = useState<Shelf[]>([]);
  const [mapEntryPoint, setMapEntryPoint] = useState<EntryPoint>({ x: 300, y: 480 });
  const [mapEmployees, setMapEmployees] = useState<ApiEmployee[]>([]);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadMap = async (storeId: string) => {
    if (!storeId) return;
    try {
      const data = await makeRequest(`/map?storeId=${encodeURIComponent(storeId)}`);
      setMapSections(data?.sections ?? []);
      setMapShelves(data?.shelves ?? []);
      setMapEntryPoint(data?.entryPoint ?? { x: 300, y: 480 });
      setSelectedStoreName(data?.storeName ?? '');
      
      // Carregar empregados e produtos da loja
      loadStoreEmployees(storeId);
      loadStoreProducts(storeId);
      
      // Limpar seleção de produto ao trocar loja
      setSelectedProduct(null);
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
    }
  };

  const loadStoreEmployees = async (storeId: string) => {
    try {
      const data = await makeRequest(`/map/employees?storeId=${encodeURIComponent(storeId)}`);
      setMapEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar empregados:', error);
      setMapEmployees([]);
    }
  };

  const loadStoreProducts = async (storeId: string) => {
    try {
      const data = await makeRequest(`/products?storeId=${encodeURIComponent(storeId)}`);
      setStoreProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar produtos da loja:', error);
      setStoreProducts([]);
    }
  };

  const searchStores = async (text: string) => {
    if (!text) {
      setStoreResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await makeRequest(`/map?storeName=${encodeURIComponent(text)}`);

      if (!Array.isArray(data)) {
        // Se não encontrou loja, API pode devolver {}. Só adiciona quando storeId existe.
        if (data && data.storeId) {
          setStoreResults([data]);
        } else {
          setStoreResults([]);
        }
      } else {
        setStoreResults(data);
      }
    } catch {
      console.error('Erro na pesquisa de loja');
      setStoreResults([]);
    } finally {
      setIsSearching(false);
    }
  };


  useEffect(() => {
    const debounce = setTimeout(() => {
      searchStores(storeQuery);
    }, 250);

    return () => clearTimeout(debounce);
  }, [storeQuery]);

  // Refresh store employees every 30 seconds so shifts activate automatically
  useEffect(() => {
    if (!selectedStoreId) return;
    const interval = setInterval(() => {
      loadStoreEmployees(selectedStoreId);
    }, 30_000);
    return () => clearInterval(interval);
  }, [selectedStoreId]);

  // Calculate suggested products based on search history from the store
  const suggestedProducts = useMemo(() => {
    if (!selectedStoreId || storeProducts.length === 0) {
      return [];
    }
    
    // Count how many times each product was searched
    const productSearchCount: Record<string, number> = {};
    searchHistory.forEach(item => {
      const productId = item.productId;
      productSearchCount[productId] = (productSearchCount[productId] || 0) + 1;
    });
    
    // Get products from store that were searched, sorted by search count
    const suggestedFromHistory = storeProducts
      .filter(p => productSearchCount[p._id])
      .sort((a, b) => {
        const countA = productSearchCount[a._id] || 0;
        const countB = productSearchCount[b._id] || 0;
        return countB - countA;
      })
      .slice(0, 6);
    
    // If less than 6 suggestions, fill with other products from the store
    if (suggestedFromHistory.length < 6) {
      const suggestionIds = new Set(suggestedFromHistory.map(p => p._id));
      const remaining = storeProducts
        .filter(p => !suggestionIds.has(p._id))
        .slice(0, 6 - suggestedFromHistory.length);
      return [...suggestedFromHistory, ...remaining];
    }
    
    return suggestedFromHistory;
  }, [selectedStoreId, storeProducts, searchHistory]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bem-vindo à MarketFind</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Encontre produtos rapidamente com o nosso mapa interativo</p>
          </div>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <input
                className="w-full rounded-md border border-input p-2 text-xs sm:text-sm"
                placeholder="Pesquisar loja por nome"
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
              />
              <button
                onClick={() => searchStores(storeQuery)}
                disabled={isSearching}
                className="rounded-md bg-primary px-2 sm:px-3 py-2 text-xs sm:text-sm text-white disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
              >{isSearching ? 'Pesquisando...' : 'Pesquisar'}</button>
              <button
                onClick={() => {
                  setStoreQuery('');
                  setStoreResults([]);
                  setSelectedStoreId('');
                  setSelectedStoreName('');
                  setMapSections([]);
                  setMapShelves([]);
                  setMapEntryPoint({ x: 300, y: 480 });
                  setStoreProducts([]);
                  setSearchHistory([]);
                  setSelectedProduct(null);
                }}
                className="rounded-md border border-border px-2 sm:px-3 py-2 text-xs sm:text-sm flex-shrink-0 whitespace-nowrap"
              >Cancelar</button>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">Loja: {selectedStoreName || 'Nenhuma'}</span>
          </div>
          {storeResults.length > 0 ? (
            <div className="grid gap-2">
              {storeResults.map((store) => (
                <button
                  key={store.storeId}
                  onClick={() => { setSelectedStoreId(store.storeId); setSelectedStoreName(store.storeName); loadMap(store.storeId); }}
                  className="text-left rounded-md border border-border p-2 hover:bg-muted text-xs sm:text-sm"
                >{store.storeName} ({store.storeId})</button>
              ))}
            </div>
          ) : (
            storeQuery && !isSearching && (
              <p className="text-sm text-muted-foreground">Nenhuma loja encontrada para "{storeQuery}"</p>
            )
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Search and Map - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Search */}
            <div className="bg-card rounded-xl p-3 sm:p-6 border border-border card-shadow">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="font-semibold text-sm sm:text-base text-foreground">Pesquisar Produtos</h2>
              </div>
              <ProductSearch
                onProductSelect={setSelectedProduct}
                selectedProduct={selectedProduct}
                storeProducts={storeProducts}
                shelves={mapShelves}
                onSearchHistoryChange={setSearchHistory}
              />
            </div>

            {/* Store Map */}
            <StoreMap
              highlightedProduct={selectedProduct}
              sections={mapSections}
              shelves={mapShelves}
              entryPoint={mapEntryPoint}
              showEmployees={true}
              employees={mapEmployees}
            />
          </div>

          {/* Sidebar - Suggestions and Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="bg-card rounded-xl p-3 sm:p-6 border border-border card-shadow">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base text-foreground">Loja</h3>
              </div>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-border">
                  <span className="text-muted-foreground">Produtos</span>
                  <span className="font-semibold text-foreground">{selectedStoreId ? storeProducts.length : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-border">
                  <span className="text-muted-foreground">Secções</span>
                  <span className="font-semibold text-foreground">{selectedStoreId ? mapSections.length : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-semibold text-foreground">8h - 22h</span>
                </div>
              </div>
            </div>

            {/* Suggested Products */}
            <div className="bg-card rounded-xl p-6 border border-border card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Sugestões</h3>
              </div>
              <div className="space-y-2">
                {suggestedProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      €{product.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
