import React, { useState, useEffect } from 'react';
import { Search, MapPin, Package, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchProducts, getSectionById, getShelfById } from '@/data/mockData';
import { Product, SearchHistory, Shelf } from '@/data/types';

interface ProductSearchProps {
  onProductSelect: (product: Product | null) => void;
  selectedProduct: Product | null;
  storeProducts?: Product[]; // Produtos da loja selecionada
  shelves?: Shelf[];
  onSearchHistoryChange?: (history: SearchHistory[]) => void; // Callback para notificar histórico
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect, selectedProduct, storeProducts, shelves, onSearchHistoryChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showResults, setShowResults] = useState(false);

  const lookupShelf = (product: Product) => {
    return shelves?.find((s) => s.id === product.shelfId) || getShelfById(product.shelfId);
  };

  useEffect(() => {
    if (query.length > 0) {
      // Se há produtos da loja, pesquisar apenas nesses
      const productsToSearch = storeProducts && storeProducts.length > 0 ? storeProducts : searchProducts(query);
      const filtered = productsToSearch.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query, storeProducts]);

  const handleProductClick = (product: Product) => {
    onProductSelect(product);
    setQuery(product.name);
    setShowResults(false);
    
    // Add to history
    const historyItem: SearchHistory = {
      id: Date.now().toString(),
      query: product.name,
      productId: product._id,
      timestamp: new Date(),
    };
    const newHistory = [historyItem, ...searchHistory.slice(0, 4)];
    setSearchHistory(newHistory);
    
    // Notificar o parent component do histórico atualizado
    onSearchHistoryChange?.(newHistory);
  };

  const clearSelection = () => {
    onProductSelect(null);
    setQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Procurar produtos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-base bg-card border-border focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onProductSelect(null); }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
        
        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-card rounded-lg border border-border shadow-lg max-h-64 overflow-y-auto">
            {results.map((product) => {
              const section = getSectionById(product.sectionId);
              const shelf = lookupShelf(product);
              const shelfLabel = shelf ? shelf.name : 'Sem prateleira no momento';
              
              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <p className="text-xs text-slate-500">{shelfLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">€{product.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{section?.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Product Info */}
      {selectedProduct && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">{selectedProduct.name}</h4>
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Secção:</span>{' '}
                  {getSectionById(selectedProduct.sectionId)?.name}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Prateleira:</span>{' '}
                  {lookupShelf(selectedProduct)?.name || 'Sem prateleira no momento'}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Preço:</span>{' '}
                  <span className="text-primary font-semibold">€{selectedProduct.price.toFixed(2)}</span>
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Stock:</span>{' '}
                  {selectedProduct.stock} unidades
                </p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Fechar
            </Button>
          </div>
          
          {getShelfById(selectedProduct.shelfId) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-primary">
              <ArrowRight className="w-4 h-4" />
              <span>Siga o percurso azul no mapa</span>
            </div>
          )}
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && !selectedProduct && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-foreground text-sm">Pesquisas recentes</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setQuery(item.query)}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm text-muted-foreground transition-colors"
              >
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {showResults && query.length > 0 && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum produto encontrado para "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
