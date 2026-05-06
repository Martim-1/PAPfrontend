import React, { useState, useEffect, useMemo, useRef } from 'react';
import { sections as defaultSections, shelves as defaultShelves } from '@/data/mockData';
import { Product, Section, Shelf, ApiEmployee } from '@/data/types';
import { MapPin, RotateCcw } from 'lucide-react';

interface EntryPoint {
  x: number;
  y: number;
}

interface StoreMapProps {
  highlightedProduct?: Product | null;
  showEmployees?: boolean;
  selectedSection?: string | null;
  onSectionClick?: (sectionId: string) => void;
  sections?: Section[];
  shelves?: Shelf[];
  entryPoint?: EntryPoint;
  employees?: ApiEmployee[];
}

const StoreMap: React.FC<StoreMapProps> = ({
  highlightedProduct,
  showEmployees = false,
  selectedSection,
  onSectionClick,
  sections,
  shelves,
  entryPoint,
  employees = [],
}) => {
  const [pathPoints, setPathPoints] = useState<string>('');
  const [animatePath, setAnimatePath] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(4, zoom * delta));
    setZoom(newZoom);
  };

  // Get SVG coordinates from mouse event
  const getSVGCoordinates = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 620;
    const y = ((e.clientY - rect.top) / rect.height) * 520;
    return { x, y };
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0 && zoom > 1) { // Only pan if zoomed in and left click
      setIsPanning(true);
      const coords = getSVGCoordinates(e);
      setPanStart({ x: coords.x - panX / zoom, y: coords.y - panY / zoom });
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning && zoom > 1) {
      const coords = getSVGCoordinates(e);
      setPanX((coords.x - panStart.x) * zoom);
      setPanY((coords.y - panStart.y) * zoom);
    }
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset zoom and pan
  const resetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const mapSections = useMemo(() => sections ?? defaultSections, [sections]);
  const mapShelves = useMemo(() => shelves ?? defaultShelves, [shelves]);
  const mapEntryPoint = useMemo(() => entryPoint ?? { x: 300, y: 480 }, [entryPoint]);

  useEffect(() => {
    if (highlightedProduct) {
      const shelf = mapShelves.find((item) => item.id === highlightedProduct.shelfId);
      if (shelf) {
        const path = `M${mapEntryPoint.x},${mapEntryPoint.y} L${mapEntryPoint.x},${shelf.y + 20} L${shelf.x},${shelf.y + 20}`;
        setPathPoints(path);
        setAnimatePath(true);
        const timeout = setTimeout(() => setAnimatePath(false), 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      setPathPoints('');
    }
  }, [highlightedProduct, mapEntryPoint, mapShelves]);

  const getSectionColor = (sectionId: string) => {
    const section = mapSections.find((s) => s.id === sectionId);
    if (section?.color) return section.color;

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
    return colorMap[sectionId] || '#6b7280';
  };

  // Get employees for a specific section
  const getEmployeesInSection = (sectionId: string) => {
    return employees.filter((emp) => emp.sections?.some(s => s.sectionId === sectionId));
  };

  return (
    <div className="relative w-full flex justify-center px-2 sm:px-0">
      <div className="bg-card rounded-xl p-2 sm:p-4 card-shadow overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Mapa da Loja</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span>Entrada</span>
            </div>
            {zoom > 1 && (
              <button
                onClick={resetZoom}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Resetar zoom (R)"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Resetar</span>
              </button>
            )}
            <div className="text-xs text-muted-foreground">
              Zoom: {(zoom * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative overflow-hidden rounded-lg bg-muted/30 cursor-grab active:cursor-grabbing w-full"
          style={{ 
            aspectRatio: '620/520',
            maxHeight: '500px',
            position: 'relative' 
          }}
        >
          <svg 
            ref={svgRef}
            viewBox="0 0 620 520" 
            className="w-full h-full"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
              userSelect: 'none',
            }}
          >
            <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
              {/* Floor pattern */}
              <pattern id="floor" patternUnits="userSpaceOnUse" width="40" height="40">
                <rect width="40" height="40" fill="hsl(var(--background))" />
                <rect x="0" y="0" width="20" height="20" fill="hsl(var(--muted))" opacity="0.3" />
                <rect x="20" y="20" width="20" height="20" fill="hsl(var(--muted))" opacity="0.3" />
              </pattern>
              <rect x="10" y="10" width="600" height="500" fill="url(#floor)" rx="8" />

          {/* Sections */}
          {mapSections.map((section) => {
            const isHighlighted = highlightedProduct?.sectionId === section.id;
            const isSelected = selectedSection === section.id;
            const sectionEmployees = getEmployeesInSection(section.id);
            return (
              <g key={section.id} onClick={() => onSectionClick?.(section.id)} className="cursor-pointer">
                <rect
                  x={section.x}
                  y={section.y}
                  width={section.width}
                  height={section.height}
                  fill={getSectionColor(section.id)}
                  opacity={isHighlighted || isSelected ? 0.9 : 0.6}
                  rx="8"
                  className="transition-all duration-300"
                  stroke={isHighlighted || isSelected ? 'hsl(var(--primary))' : 'transparent'}
                  strokeWidth={isHighlighted || isSelected ? 3 : 0}
                />
                <text
                  x={section.x + section.width / 2}
                  y={section.y + section.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={isMobile ? "10" : "12"}
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {section.name}
                </text>
                
                {/* Show employees in section */}
                {showEmployees && sectionEmployees.length > 0 && (
                  <g>
                    {sectionEmployees.map((emp, index) => {
                      const offsetY = 20 + index * 16;
                      const empName = emp.name || emp.email?.split('@')[0] || 'Funcionário';
                      return (
                        <g key={emp._id}>
                          {/* Employee indicator circle */}
                          <circle
                            cx={section.x + 15}
                            cy={section.y + offsetY}
                            r="6"
                            fill="#22c55e"
                            stroke="white"
                            strokeWidth="1"
                          />
                          {/* Employee name */}
                          <text
                            x={section.x + 25}
                            y={section.y + offsetY + 3}
                            fill="white"
                            fontSize={isMobile ? "7" : "9"}
                            fontWeight="500"
                            className="pointer-events-none"
                          >
                            {empName}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}

          {/* Shelves */}
          {mapShelves.map((shelf) => {
            const isHighlighted = highlightedProduct?.shelfId === shelf.id;
            return (
              <g key={shelf.id}>
                <rect
                  x={shelf.x - 15}
                  y={shelf.y - 10}
                  width="30"
                  height="20"
                  fill={isHighlighted ? 'hsl(var(--primary))' : '#ffffff'}
                  stroke={isHighlighted ? 'hsl(var(--accent))' : 'hsl(var(--border))'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  rx="4"
                  className="transition-all duration-300"
                />
                <text
                  x={shelf.x}
                  y={shelf.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHighlighted ? 'white' : '#1f2937'}
                  fontSize={isMobile ? "6" : "7"}
                  fontWeight="700"
                  className="pointer-events-none"
                >
                  {shelf.name}
                </text>
                {isHighlighted && (
                  <circle cx={shelf.x} cy={shelf.y} r="6" fill="hsl(var(--accent))" className="animate-pulse-soft" />
                )}
              </g>
            );
          })}

          {/* Path to product */}
          {pathPoints && (
            <path
              d={pathPoints}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1000"
              strokeDashoffset={animatePath ? 0 : 1000}
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }}
            />
          )}

          {/* Entry point */}
          <g>
            <circle cx={mapEntryPoint.x} cy={mapEntryPoint.y} r={isMobile ? "10" : "12"} fill="hsl(var(--primary))" />
            <text
              x={mapEntryPoint.x}
              y={mapEntryPoint.y + 25}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize={isMobile ? "8" : "10"}
              fontWeight="500"
            >
              ENTRADA
            </text>
          </g>
            </g>
          </svg>
        </div>

        {/* Zoom controls info */}
        {zoom === 1 && (
          <div className="text-xs text-muted-foreground mt-2 text-center">
            🖱️ Roda do rato para zoom | Arrasta para mover (quando zoomed in)
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(StoreMap);