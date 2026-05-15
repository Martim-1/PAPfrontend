// =====================
// ROLES
// =====================
export type UserRole = "customer" | "employee" | "manager" | "admin";

// =====================
// USER (AUTH / FRONTEND)
// =====================
export interface User {
  id?: string;
  _id?: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  storeId?: string;
  storeName?: string;
  sectionId?: string;
  status?: "active" | "offline";
  sections?: Array<{
    sectionId: string;
    sectionName: string;
    assignedAt?: string;
  }>;
}

// =====================
// API MODELS (BACKEND)
// =====================
export interface ApiUser {
  _id: string;
  email: string;
  role: UserRole;
}

// Employee vindo do backend com status
export interface ApiEmployee {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "employee";
  status?: "active" | "offline";
  sectionId?: string;
  sectionName?: string;
  sections?: Array<{
    sectionId: string;
    sectionName: string;
    assignedAt?: string;
    shiftStart?: string; // "HH:MM"
    shiftEnd?: string;   // "HH:MM"
  }>;
}

// =====================
// FRONTEND MODELS (UI)
// =====================
export interface Employee {
  id: string;
  email: string;
  name: string;
  sectionId?: string;
  avatar?: string;
  status: "active" | "offline";
}

// =====================
// PRODUCT
// =====================
export interface Product {
  _id: string;
  name: string;
  category: string;
  section: string;
  price: number;
  stock: number;
  storeId?: string;
  sectionId?: string;
  shelfId?: string;
  image?: string;
  description?: string;
}

// =====================
// STORE LAYOUT
// =====================
export interface Section {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Shelf {
  id: string;
  sectionId: string;
  name: string;
  x: number;
  y: number;
}

export interface EntryPoint {
  x: number;
  y: number;
}

// =====================
// SEARCH / STATS
// =====================
export interface SearchHistory {
  id: string;
  query: string;
  productId?: string;
  timestamp: Date;
}

export interface StoreStats {
  totalProducts: number;
  totalEmployees: number;
  totalSections: number;
  mostSearchedProducts: { name: string; count: number }[];
  busiestSections: { name: string; visits: number }[];
}
