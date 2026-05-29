// ========================
// TIPOS GLOBALES
// ========================

export type UserRole = 'admin' | 'staff';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'mercadopago' | 'cash' | 'transfer' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'counter';
export type TableStatus = 'free' | 'occupied' | 'pending' | 'reserved';

// ========================
// MODELOS
// ========================

export interface Admin {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductModifier {
  id: string;
  name: string;
  price: number; // 0 si es gratis
  is_available: boolean;
}

export interface ModifierGroup {
  id: string;
  product_id: string;
  name: string; // "Tamaño", "Extras", "Sin ingrediente"
  required: boolean;
  multiple: boolean; // permite seleccionar múltiples
  modifiers: ProductModifier[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  allergens?: string[];
  preparation_time?: number;
  sort_order: number;
  stock?: number; // null = sin control de stock
  stock_alert?: number; // alerta cuando llega a este número
  track_stock: boolean;
  is_combo: boolean;
  combo_items?: ComboItem[];
  modifier_groups?: ModifierGroup[];
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface ComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  position_x: number; // posición en mapa
  position_y: number;
  shape: 'square' | 'round';
  zone?: string; // "Salón principal", "Terraza", etc.
  current_order_id?: string;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: SelectedModifier[];
}

export interface SelectedModifier {
  group_id: string;
  group_name: string;
  modifier_id: string;
  modifier_name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  modifiers?: SelectedModifier[];
  status: 'pending' | 'preparing' | 'ready'; // para KDS
}

export interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
  order_type: OrderType;
  table_id?: string;
  table_number?: string;
  delivery_address?: string;
  delivery_notes?: string;
  order_items?: OrderItem[];
  subtotal: number;
  discount_amount: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  total: number;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id?: string;
  mp_preference_id?: string;
  waiter_id?: string;
  waiter_name?: string;
  notes?: string;
  printed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  created_at: string;
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
  min_order_amount?: number;
  created_at: string;
}

export interface BusinessConfig {
  id: string;
  business_name: string;
  business_type: string; // "Restaurante", "Cafetería", "Bar", etc.
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  opening_hours: Record<string, { open: string; close: string; is_open: boolean }>;
  is_open: boolean;
  delivery_available: boolean;
  takeaway_available: boolean;
  dine_in_available: boolean;
  counter_available: boolean;
  currency: string; // "ARS", "PYG", "UYU", etc.
  currency_symbol: string; // "$", "Gs.", etc.
  tax_rate: number; // % de impuesto (0 si no aplica)
  waiter_pin: string;
  primary_color: string; // color principal del negocio
  updated_at: string;
}

// ========================
// REQUEST/RESPONSE
// ========================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface CreateOrderRequest {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
  order_type: OrderType;
  table_id?: string;
  table_number?: string;
  delivery_address?: string;
  delivery_notes?: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  discount_id?: string;
  notes?: string;
  waiter_name?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}
