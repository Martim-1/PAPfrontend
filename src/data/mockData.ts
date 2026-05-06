import { Product, Section, Shelf, Employee, User, StoreStats } from './types';

export const sections: Section[] = [
  { id: 'fruits', name: 'Frutas e Legumes', color: 'section-fruits', x: 50, y: 50, width: 180, height: 120 },
  { id: 'dairy', name: 'Laticínios', color: 'section-dairy', x: 250, y: 50, width: 150, height: 120 },
  { id: 'bakery', name: 'Padaria', color: 'section-bakery', x: 420, y: 50, width: 150, height: 120 },
  { id: 'meats', name: 'Carnes', color: 'section-meats', x: 50, y: 200, width: 150, height: 120 },
  { id: 'beverages', name: 'Bebidas', color: 'section-beverages', x: 220, y: 200, width: 180, height: 120 },
  { id: 'cleaning', name: 'Limpeza', color: 'section-cleaning', x: 420, y: 200, width: 150, height: 120 },
  { id: 'frozen', name: 'Congelados', color: 'section-frozen', x: 50, y: 350, width: 200, height: 100 },
  { id: 'snacks', name: 'Snacks', color: 'section-snacks', x: 270, y: 350, width: 300, height: 100 },
];

export const shelves: Shelf[] = [
  // Fruits section
  { id: 'fruits-1', sectionId: 'fruits', name: 'Prateleira A1', x: 70, y: 70 },
  { id: 'fruits-2', sectionId: 'fruits', name: 'Prateleira A2', x: 140, y: 70 },
  { id: 'fruits-3', sectionId: 'fruits', name: 'Prateleira A3', x: 70, y: 130 },
  // Dairy section
  { id: 'dairy-1', sectionId: 'dairy', name: 'Prateleira B1', x: 280, y: 70 },
  { id: 'dairy-2', sectionId: 'dairy', name: 'Prateleira B2', x: 350, y: 70 },
  // Bakery section
  { id: 'bakery-1', sectionId: 'bakery', name: 'Prateleira C1', x: 450, y: 70 },
  { id: 'bakery-2', sectionId: 'bakery', name: 'Prateleira C2', x: 520, y: 70 },
  // Meats section
  { id: 'meats-1', sectionId: 'meats', name: 'Prateleira D1', x: 80, y: 230 },
  { id: 'meats-2', sectionId: 'meats', name: 'Prateleira D2', x: 150, y: 230 },
  // Beverages section
  { id: 'beverages-1', sectionId: 'beverages', name: 'Prateleira E1', x: 250, y: 230 },
  { id: 'beverages-2', sectionId: 'beverages', name: 'Prateleira E2', x: 320, y: 230 },
  // Cleaning section
  { id: 'cleaning-1', sectionId: 'cleaning', name: 'Prateleira F1', x: 450, y: 230 },
  { id: 'cleaning-2', sectionId: 'cleaning', name: 'Prateleira F2', x: 520, y: 230 },
  // Frozen section
  { id: 'frozen-1', sectionId: 'frozen', name: 'Prateleira G1', x: 80, y: 380 },
  { id: 'frozen-2', sectionId: 'frozen', name: 'Prateleira G2', x: 160, y: 380 },
  // Snacks section
  { id: 'snacks-1', sectionId: 'snacks', name: 'Prateleira H1', x: 300, y: 380 },
  { id: 'snacks-2', sectionId: 'snacks', name: 'Prateleira H2', x: 400, y: 380 },
  { id: 'snacks-3', sectionId: 'snacks', name: 'Prateleira H3', x: 500, y: 380 },
];

export const products: Product[] = [
  // Fruits
  { id: 'p1', name: 'Maçã Gala', category: 'Frutas', price: 2.49, stock: 150, sectionId: 'fruits', shelfId: 'fruits-1' },
  { id: 'p2', name: 'Banana', category: 'Frutas', price: 1.99, stock: 200, sectionId: 'fruits', shelfId: 'fruits-1' },
  { id: 'p3', name: 'Laranja', category: 'Frutas', price: 2.99, stock: 120, sectionId: 'fruits', shelfId: 'fruits-2' },
  { id: 'p4', name: 'Alface', category: 'Legumes', price: 0.99, stock: 80, sectionId: 'fruits', shelfId: 'fruits-3' },
  { id: 'p5', name: 'Tomate', category: 'Legumes', price: 3.49, stock: 100, sectionId: 'fruits', shelfId: 'fruits-3' },
  // Dairy
  { id: 'p6', name: 'Leite Meio-Gordo', category: 'Laticínios', price: 0.89, stock: 300, sectionId: 'dairy', shelfId: 'dairy-1' },
  { id: 'p7', name: 'Iogurte Natural', category: 'Laticínios', price: 1.49, stock: 150, sectionId: 'dairy', shelfId: 'dairy-1' },
  { id: 'p8', name: 'Queijo Flamengo', category: 'Laticínios', price: 4.99, stock: 75, sectionId: 'dairy', shelfId: 'dairy-2' },
  { id: 'p9', name: 'Manteiga', category: 'Laticínios', price: 2.29, stock: 90, sectionId: 'dairy', shelfId: 'dairy-2' },
  // Bakery
  { id: 'p10', name: 'Pão de Forma', category: 'Padaria', price: 1.79, stock: 50, sectionId: 'bakery', shelfId: 'bakery-1' },
  { id: 'p11', name: 'Croissant', category: 'Padaria', price: 0.79, stock: 40, sectionId: 'bakery', shelfId: 'bakery-1' },
  { id: 'p12', name: 'Bolo de Chocolate', category: 'Padaria', price: 8.99, stock: 15, sectionId: 'bakery', shelfId: 'bakery-2' },
  // Meats
  { id: 'p13', name: 'Peito de Frango', category: 'Carnes', price: 6.99, stock: 45, sectionId: 'meats', shelfId: 'meats-1' },
  { id: 'p14', name: 'Carne Picada', category: 'Carnes', price: 7.49, stock: 35, sectionId: 'meats', shelfId: 'meats-1' },
  { id: 'p15', name: 'Costeletas de Porco', category: 'Carnes', price: 5.99, stock: 30, sectionId: 'meats', shelfId: 'meats-2' },
  // Beverages
  { id: 'p16', name: 'Água Mineral 1.5L', category: 'Bebidas', price: 0.49, stock: 500, sectionId: 'beverages', shelfId: 'beverages-1' },
  { id: 'p17', name: 'Coca-Cola 1L', category: 'Bebidas', price: 1.89, stock: 200, sectionId: 'beverages', shelfId: 'beverages-1' },
  { id: 'p18', name: 'Sumo de Laranja', category: 'Bebidas', price: 2.49, stock: 120, sectionId: 'beverages', shelfId: 'beverages-2' },
  { id: 'p19', name: 'Cerveja Super Bock', category: 'Bebidas', price: 0.89, stock: 300, sectionId: 'beverages', shelfId: 'beverages-2' },
  // Cleaning
  { id: 'p20', name: 'Detergente da Roupa', category: 'Limpeza', price: 5.99, stock: 60, sectionId: 'cleaning', shelfId: 'cleaning-1' },
  { id: 'p21', name: 'Lixívia', category: 'Limpeza', price: 1.49, stock: 80, sectionId: 'cleaning', shelfId: 'cleaning-1' },
  { id: 'p22', name: 'Detergente Loiça', category: 'Limpeza', price: 2.29, stock: 70, sectionId: 'cleaning', shelfId: 'cleaning-2' },
  // Frozen
  { id: 'p23', name: 'Pizza Congelada', category: 'Congelados', price: 3.99, stock: 40, sectionId: 'frozen', shelfId: 'frozen-1' },
  { id: 'p24', name: 'Gelado de Baunilha', category: 'Congelados', price: 4.49, stock: 35, sectionId: 'frozen', shelfId: 'frozen-1' },
  { id: 'p25', name: 'Legumes Congelados', category: 'Congelados', price: 2.99, stock: 50, sectionId: 'frozen', shelfId: 'frozen-2' },
  // Snacks
  { id: 'p26', name: 'Batatas Fritas Lays', category: 'Snacks', price: 1.99, stock: 100, sectionId: 'snacks', shelfId: 'snacks-1' },
  { id: 'p27', name: 'Chocolate Milka', category: 'Snacks', price: 2.49, stock: 80, sectionId: 'snacks', shelfId: 'snacks-2' },
  { id: 'p28', name: 'Bolachas Oreo', category: 'Snacks', price: 2.79, stock: 65, sectionId: 'snacks', shelfId: 'snacks-2' },
  { id: 'p29', name: 'Amendoins', category: 'Snacks', price: 1.49, stock: 90, sectionId: 'snacks', shelfId: 'snacks-3' },
  { id: 'p30', name: 'Gomas', category: 'Snacks', price: 0.99, stock: 150, sectionId: 'snacks', shelfId: 'snacks-3' },
];

export const employees: Employee[] = [
  { id: 'e1', name: 'João Silva', email: 'joao@MarketFind.pt', sectionId: 'fruits', status: 'active' },
  { id: 'e2', name: 'Maria Santos', email: 'maria@MarketFind.pt', sectionId: 'dairy', status: 'active' },
  { id: 'e3', name: 'Pedro Costa', email: 'pedro@MarketFind.pt', sectionId: 'meats', status: 'offline' },
  { id: 'e4', name: 'Ana Ferreira', email: 'ana@MarketFind.pt', sectionId: 'beverages', status: 'active' },
  { id: 'e5', name: 'Rui Oliveira', email: 'rui@MarketFind.pt', sectionId: 'cleaning', status: 'offline' },
  { id: 'e6', name: 'Sofia Martins', email: 'sofia@MarketFind.pt', sectionId: 'frozen', status: 'active' },
];

export const mockUsers: User[] = [
  { id: 'u1', name: 'Cliente Demo', email: 'cliente@demo.pt', role: 'customer' },
  { id: 'u2', name: 'João Silva', email: 'funcionario@demo.pt', role: 'employee', sectionId: 'fruits' },
  { id: 'u3', name: 'Admin', email: 'gerente@demo.pt', role: 'manager' },
];

export const storeStats: StoreStats = {
  totalProducts: products.length,
  totalEmployees: employees.length,
  totalSections: sections.length,
  mostSearchedProducts: [
    { name: 'Leite Meio-Gordo', count: 234 },
    { name: 'Pão de Forma', count: 189 },
    { name: 'Banana', count: 156 },
    { name: 'Água Mineral', count: 145 },
    { name: 'Peito de Frango', count: 132 },
  ],
  busiestSections: [
    { name: 'Frutas e Legumes', visits: 1250 },
    { name: 'Laticínios', visits: 980 },
    { name: 'Bebidas', visits: 876 },
    { name: 'Padaria', visits: 654 },
    { name: 'Snacks', visits: 543 },
  ],
};

export const getProductsBySection = (sectionId: string) => 
  products.filter(p => p.sectionId === sectionId);

export const getShelfById = (shelfId: string) => 
  shelves.find(s => s.id === shelfId);

export const getSectionById = (sectionId: string) => 
  sections.find(s => s.id === sectionId);

export const getEmployeesBySection = (sectionId: string) => 
  employees.filter(e => e.sectionId === sectionId);

export const searchProducts = (query: string) => 
  products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );
