import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Section, Shelf, EntryPoint } from '@/data/types';
import { Plus, Trash2, Move, Edit2, Save, Grid3X3, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

import { API_URL } from "@/api";

const COLORS = [
  { id: 'green', name: 'Verde', value: '#22c55e' },
  { id: 'blue', name: 'Azul', value: '#0ea5e9' },
  { id: 'orange', name: 'Laranja', value: '#f59e0b' },
  { id: 'red', name: 'Vermelho', value: '#ef4444' },
  { id: 'purple', name: 'Roxo', value: '#8b5cf6' },
  { id: 'teal', name: 'Turquesa', value: '#14b8a6' },
  { id: 'cyan', name: 'Ciano', value: '#38bdf8' },
  { id: 'amber', name: 'Âmbar', value: '#f97316' },
];

const MapEditor: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const rafRef = React.useRef<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const managerStoreId = user?.storeId || '';
  const managerStoreName = user?.storeName || '';
  const [storeId, setStoreId] = useState<string>(managerStoreId);
  const [storeName, setStoreName] = useState<string>(managerStoreName);
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [isAddingShelfOpen, setIsAddingShelfOpen] = useState(false);
  const [editMode, setEditMode] = useState<'select' | 'move' | 'resize'>('select');
  const [entryMoveMode, setEntryMoveMode] = useState(false);

  const [newSection, setNewSection] = useState({
    name: '',
    color: COLORS[0].value,
    width: 150,
    height: 120,
  });

  const [newShelf, setNewShelf] = useState({
    name: '',
    sectionId: '',
  });

  const [entryPoint, setEntryPoint] = useState<EntryPoint>({ x: 300, y: 480 });

  const getSectionColor = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const colorMap: Record<string, string> = {
      fruits: '#22c55e',
      dairy: '#0ea5e9',
      bakery: '#f59e0b',
      meats: '#ef4444',
      beverages: '#8b5cf6',
      cleaning: '#14b8a6',
      frozen: '#38bdf8',
      snacks: '#f97316',
    };
    return colorMap[sectionId] || section?.color || '#6b7280';
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleSectionMouseDown = (e: React.MouseEvent, section: Section) => {
    if (entryMoveMode) return;
    (e.currentTarget as Element).setPointerCapture?.((e as any).pointerId);

    if (editMode !== 'move') {
      setSelectedSection(section);
      setSelectedShelf(null);
      return;
    }

    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = 620 / rect.width;
    const scaleY = 520 / rect.height;

    setSelectedSection(section);
    setSelectedShelf(null);
    setIsDragging(true);
    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - section.x,
      y: (e.clientY - rect.top) * scaleY - section.y,
    });
  };

  const handleShelfMouseDown = (e: React.MouseEvent, shelf: Shelf) => {
    if (entryMoveMode) return;
    (e.currentTarget as Element).setPointerCapture?.((e as any).pointerId);
    e.stopPropagation();

    if (editMode !== 'move') {
      setSelectedShelf(shelf);
      setSelectedSection(null);
      return;
    }

    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = 620 / rect.width;
    const scaleY = 520 / rect.height;

    setSelectedShelf(shelf);
    setSelectedSection(null);
    setIsDragging(true);
    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - shelf.x,
      y: (e.clientY - rect.top) * scaleY - shelf.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 620 / rect.width;
    const scaleY = 520 / rect.height;

    const newX = Math.max(10, Math.min(600, (e.clientX - rect.left) * scaleX - dragOffset.x));
    const newY = Math.max(10, Math.min(500, (e.clientY - rect.top) * scaleY - dragOffset.y));

    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (selectedSection) {
        setSections(prev =>
          prev.map(s =>
            s.id === selectedSection.id ? { ...s, x: newX, y: newY } : s
          )
        );
      } else if (selectedShelf) {
        setShelves(prev =>
          prev.map(s =>
            s.id === selectedShelf.id ? { ...s, x: newX, y: newY } : s
          )
        );
      }
    });
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging || !entryMoveMode) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 620 / rect.width;
    const scaleY = 520 / rect.height;

    const x = Math.max(10, Math.min(610, (e.clientX - rect.left) * scaleX));
    const y = Math.max(10, Math.min(510, (e.clientY - rect.top) * scaleY));

    setEntryPoint({ x, y });
  };

  const handleAddSection = () => {
    const id = newSection.name.toLowerCase().replace(/\s+/g, '-');
    const newSectionData: Section = {
      id,
      name: newSection.name,
      color: newSection.color,
      x: 100,
      y: 100,
      width: newSection.width,
      height: newSection.height,
    };

    setSections(prev => [...prev, newSectionData]);
    setIsAddingSectionOpen(false);
    setNewSection({ name: '', color: COLORS[0].value, width: 150, height: 120 });
    toast.success('Secção adicionada com sucesso!');
  };

  const handleAddShelf = () => {
    if (!newShelf.sectionId) {
      toast.error('Selecione uma secção');
      return;
    }

    const section = sections.find(s => s.id === newShelf.sectionId);
    if (!section) return;

    const id = `${newShelf.sectionId}-${Date.now()}`;
    const newShelfData: Shelf = {
      id,
      sectionId: newShelf.sectionId,
      name: newShelf.name,
      x: section.x + 30,
      y: section.y + 30,
    };

    setShelves(prev => [...prev, newShelfData]);
    setIsAddingShelfOpen(false);
    setNewShelf({ name: '', sectionId: '' });
    toast.success('Prateleira adicionada com sucesso!');
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setShelves(prev => prev.filter(s => s.sectionId !== sectionId));
    setSelectedSection(null);
    toast.success('Secção removida com sucesso!');
  };

  const handleDeleteShelf = (shelfId: string) => {
    setShelves(prev => prev.filter(s => s.id !== shelfId));
    setSelectedShelf(null);
    toast.success('Prateleira removida com sucesso!');
  };

  const fetchMap = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/map?storeId=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao carregar mapa');
      const data = await res.json();
      setSections(data?.sections ?? []);
      setShelves(data?.shelves ?? []);
      setEntryPoint(data?.entryPoint ?? { x: 300, y: 480 });
      setStoreName(data?.storeName ?? storeName);
    } catch {
      toast.error("Erro ao carregar mapa");
    }
  };

  useEffect(() => {
    if (managerStoreId) {
      setStoreId(managerStoreId);
      setStoreName(managerStoreName);
      fetchMap(managerStoreId);
    }
  }, [managerStoreId, managerStoreName]);

  useEffect(() => {
    if (!managerStoreId && storeId) {
      fetchMap(storeId);
    }
  }, [storeId]);

  const handleCreateStore = async () => {
    if (managerStoreId) {
      toast.error('Já existe uma loja associada; use Guardar Mapa para salvar alterações.');
      return;
    }

    if (!storeId || !storeName) {
      toast.error('Preencha ID e nome da loja para criar.');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/map`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId,
          storeName,
          sections: [],
          shelves: [],
          entryPoint: { x: 300, y: 480 },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Erro ao criar loja");
        return;
      }

      localStorage.setItem('storeId', storeId);
      localStorage.setItem('storeName', storeName);

      if (refreshUser) await refreshUser();

      toast.success("Loja criada com sucesso!");
      fetchMap(storeId);
    } catch (err) {
      toast.error((err as Error).message || "Erro ao criar loja");
    }
  };

  const handleSaveMap = async () => {
    if (!managerStoreId) {
      toast.error('Antes de guardar o mapa, crie a loja');
      return;
    }

    const targetStoreId = managerStoreId;
    const targetStoreName = managerStoreName;

    if (!targetStoreId || !targetStoreName) {
      toast.error('Defina storeId e storeName antes de guardar');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/map`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storeId: targetStoreId, storeName: targetStoreName, sections, shelves, entryPoint }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Erro ao guardar mapa");
        return;
      }

      localStorage.setItem('storeId', targetStoreId);
      localStorage.setItem('storeName', targetStoreName);

      if (refreshUser) await refreshUser();

      toast.success("Mapa guardado com sucesso!");
    } catch (err) {
      toast.error((err as Error).message || "Erro ao guardar mapa");
    }
  };

  const handleDeleteStore = async () => {
    const targetStoreId = managerStoreId || storeId;

    if (!targetStoreId) {
      toast.error('Nenhum storeId definido para eliminar');
      return;
    }

    if (!window.confirm('Tem certeza de que deseja eliminar esta loja e todos os dados do mapa?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/map?storeId=${encodeURIComponent(targetStoreId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao eliminar loja');
      }

      setSections([]);
      setShelves([]);
      setEntryPoint({ x: 300, y: 480 });
      if (!managerStoreId) {
        setStoreId('');
        setStoreName('');
      }
      localStorage.removeItem('storeId');
      localStorage.removeItem('storeName');

      toast.success("Loja eliminada com sucesso");
      // atualiza estado do user e UI
      window.location.reload();
    } catch (err) {
      toast.error((err as Error).message || "Erro ao eliminar loja");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Editor do Mapa</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Crie e personalize o mapa da sua loja</p>
            <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="ID da loja"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full text-xs sm:text-sm h-8 sm:h-auto"
                disabled={!!managerStoreId}
              />
              <Input
                placeholder="Nome da loja"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs sm:text-sm h-8 sm:h-auto"
                disabled={!!managerStoreName}
              />
              <Button
                variant="outline"
                onClick={handleCreateStore}
                className="w-full text-xs sm:text-sm h-8 sm:h-auto"
                disabled={!!managerStoreId}
              >
                Criar loja
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={handleSaveMap} className="gap-2 text-xs sm:text-sm py-1 h-9 sm:h-auto" disabled={!managerStoreId}>
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              Guardar
            </Button>
            <Button variant="destructive" onClick={handleDeleteStore} className="gap-2 text-xs sm:text-sm py-1 h-9 sm:h-auto" disabled={!managerStoreId}>
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Toolbar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Ferramentas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Modo de Edição</Label>
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <Button
                    variant={editMode === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setEditMode('select'); setEntryMoveMode(false); }}
                    className="gap-1 text-xs h-8 sm:h-auto"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /> Sel
                  </Button>
                  <Button
                    variant={editMode === 'move' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setEditMode('move'); setEntryMoveMode(false); }}
                    className="gap-1 text-xs h-8 sm:h-auto"
                  >
                    <Move className="w-3 h-3 sm:w-4 sm:h-4" /> Mover
                  </Button>
                  <Button
                    variant={entryMoveMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setEntryMoveMode((prev) => !prev); setEditMode('select'); }}
                    className="gap-1 text-xs col-span-2 h-8 sm:h-auto"
                  >
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> Entrada
                  </Button>
                </div>
              </div>

              {/* Add Section */}
              <Dialog open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm h-8 sm:h-auto">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Adicionar Secção
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Nova Secção</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Nome da Secção</Label>
                      <Input
                        value={newSection.name}
                        onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        placeholder="Ex: Frutas e Legumes"
                        className="text-xs sm:text-sm h-8 sm:h-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Cor</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setNewSection({ ...newSection, color: color.value })}
                            className={`w-8 h-8 rounded-lg transition-all ${newSection.color === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                              }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Largura</Label>
                        <Input
                          type="number"
                          value={newSection.width}
                          onChange={(e) => setNewSection({ ...newSection, width: parseInt(e.target.value) || 150 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Altura</Label>
                        <Input
                          type="number"
                          value={newSection.height}
                          onChange={(e) => setNewSection({ ...newSection, height: parseInt(e.target.value) || 120 })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddSection} disabled={!newSection.name}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add Shelf */}
              <Dialog open={isAddingShelfOpen} onOpenChange={setIsAddingShelfOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Grid3X3 className="w-4 h-4" /> Adicionar Prateleira
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Prateleira</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome da Prateleira</Label>
                      <Input
                        value={newShelf.name}
                        onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })}
                        placeholder="Ex: Prateleira A1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secção</Label>
                      <select
                        value={newShelf.sectionId}
                        onChange={(e) => setNewShelf({ ...newShelf, sectionId: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                      >
                        <option value="">Selecione uma secção</option>
                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>{section.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddShelf} disabled={!newShelf.name || !newShelf.sectionId}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Selected Section */}
              {selectedSection && (
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Secção Selecionada</h4>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Nome:</strong> {selectedSection.name}</p>
                    <p><strong>Posição:</strong> ({Math.round(selectedSection.x)}, {Math.round(selectedSection.y)})</p>
                    <p><strong>Tamanho:</strong> {selectedSection.width} x {selectedSection.height}</p>
                  </div>
                  <Button variant="destructive" size="sm" className="w-full gap-2" onClick={() => handleDeleteSection(selectedSection.id)}>
                    <Trash2 className="w-4 h-4" /> Remover Secção
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium text-sm">Entrada do Mapa</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Instrução:</strong> Clique na área do mapa ou use coordenadas.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="entry-x">X</Label>
                      <Input
                        id="entry-x"
                        type="number"
                        value={entryPoint.x}
                        min={10}
                        max={610}
                        onChange={(e) => setEntryPoint(old => ({ ...old, x: Math.max(10, Math.min(610, Number(e.target.value) || 0)) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="entry-y">Y</Label>
                      <Input
                        id="entry-y"
                        type="number"
                        value={entryPoint.y}
                        min={10}
                        max={510}
                        onChange={(e) => setEntryPoint(old => ({ ...old, y: Math.max(10, Math.min(510, Number(e.target.value) || 0)) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedShelf && (
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Prateleira Selecionada</h4>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Nome:</strong> {selectedShelf.name}</p>
                    <p><strong>Posição:</strong> ({Math.round(selectedShelf.x)}, {Math.round(selectedShelf.y)})</p>
                  </div>
                  <Button variant="destructive" size="sm" className="w-full gap-2" onClick={() => handleDeleteShelf(selectedShelf.id)}>
                    <Trash2 className="w-4 h-4" /> Remover Prateleira
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Canvas */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Mapa da Loja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-xl overflow-hidden flex justify-center">
                <svg
                  viewBox="0 0 620 520"
                  className="w-full max-w-[620px] aspect-[620/520] cursor-crosshair"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onClick={handleMapClick}
                >
                  {/* Background */}
                  <rect x="0" y="0" width="620" height="520" fill="none" rx="12" />

                  {/* Floor pattern */}
                  <pattern id="floor-editor" patternUnits="userSpaceOnUse" width="40" height="40">
                    <rect width="40" height="40" fill="hsl(var(--background))" />
                    <rect x="0" y="0" width="20" height="20" fill="hsl(var(--muted))" opacity="0.3" />
                    <rect x="20" y="20" width="20" height="20" fill="hsl(var(--muted))" opacity="0.3" />
                  </pattern>
                  <rect x="10" y="10" width="600" height="500" fill="url(#floor-editor)" rx="8" />

                  {/* Grid lines */}
                  {Array.from({ length: 15 }).map((_, i) => (
                    <line key={`v-${i}`} x1={i * 40 + 20} y1="10" x2={i * 40 + 20} y2="510" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
                  ))}
                  {Array.from({ length: 13 }).map((_, i) => (
                    <line key={`h-${i}`} x1="10" y1={i * 40 + 20} x2="610" y2={i * 40 + 20} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
                  ))}

                  {/* Sections */}
                  {sections.map((section) => {
                    const isSelected = selectedSection?.id === section.id;
                    return (
                      <g key={section.id} onPointerDown={(e) => handleSectionMouseDown(e as unknown as React.MouseEvent, section)} className={`${editMode === 'move' ? 'cursor-move' : 'cursor-pointer'}`}>
                        <rect
                          x={section.x}
                          y={section.y}
                          width={section.width}
                          height={section.height}
                          fill={getSectionColor(section.id)}
                          opacity={isSelected ? 0.9 : 0.7}
                          rx="8"
                          stroke={isSelected ? 'hsl(var(--primary))' : 'transparent'}
                          strokeWidth={isSelected ? 3 : 0}
                        />
                        <text x={section.x + section.width / 2} y={section.y + section.height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="600" className="pointer-events-none select-none">{section.name}</text>
                      </g>
                    );
                  })}

                  {/* Shelves */}
                  {shelves.map((shelf) => {
                    const isSelected = selectedShelf?.id === shelf.id;
                    return (
                      <g key={shelf.id} onPointerDown={(e) => handleShelfMouseDown(e as unknown as React.MouseEvent, shelf)} className={`${editMode === 'move' ? 'cursor-move' : 'cursor-pointer'}`}>
                        <rect x={shelf.x - 15} y={shelf.y - 10} width="30" height="20" fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--card))'} stroke={isSelected ? 'hsl(var(--accent))' : 'hsl(var(--border))'} strokeWidth={isSelected ? 2 : 1} rx="4" />
                        <text x={shelf.x} y={shelf.y} textAnchor="middle" dominantBaseline="middle" fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'} fontSize="8" fontWeight="500" className="pointer-events-none select-none">{shelf.name.split(' ')[1] || 'P'}</text>
                      </g>
                    );
                  })}

                  {/* Entry point */}
                  <g>
                    <circle cx={entryPoint.x} cy={entryPoint.y} r="12" fill="hsl(var(--primary))" />
                    <text x={entryPoint.x} y={entryPoint.y + 25} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" fontWeight="500">ENTRADA</text>
                  </g>
                </svg>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getSectionColor(section.id) }} />
                    <span className="text-xs text-muted-foreground">{section.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapEditor;