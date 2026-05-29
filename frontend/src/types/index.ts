export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'counter';
export type PaymentMethod = 'mercadopago' | 'cash' | 'transfer' | 'card' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type TableStatus = 'free' | 'occupied' | 'pending' | 'reserved';

export interface Category {
  id: string; name: string; slug: string; description?: string;
  image_url?: string; sort_order: number; is_active: boolean;
}

export interface Modifier {
  id: string; group_id: string; name: string; price: number; is_available: boolean;
}

export interface ModifierGroup {
  id: string; product_id: string; name: string;
  required: boolean; multiple: boolean; modifiers: Modifier[];
}

export interface SelectedModifier {
  group_id: string; group_name: string;
  modifier_id: string; modifier_name: string; price: number;
}

export interface Product {
  id: string; category_id: string; name: string; description?: string;
  price: number; image_url?: string; is_available: boolean; is_featured: boolean;
  allergens?: string[]; preparation_time?: number; sort_order: number;
  track_stock: boolean; stock?: number; stock_alert?: number; is_combo: boolean;
  modifier_groups?: ModifierGroup[]; categories?: Category;
}

export interface CartItem {
  product_id: string; product_name: string; price: number;
  quantity: number; notes?: string; modifiers?: SelectedModifier[];
}

export interface OrderItem {
  id: string; order_id: string; product_id: string; product_name: string;
  price: number; quantity: number; subtotal: number; notes?: string;
  modifiers?: SelectedModifier[]; status: 'pending' | 'preparing' | 'ready';
}

export interface Order {
  id: string; order_number: string; customer_name?: string;
  customer_phone?: string; customer_email?: string; customer_id?: string;
  order_type: OrderType; table_id?: string; table_number?: string;
  delivery_address?: string; delivery_notes?: string; order_items?: OrderItem[];
  subtotal: number; discount_amount: number; total: number;
  status: OrderStatus; payment_method?: PaymentMethod; payment_status: PaymentStatus;
  payment_id?: string; waiter_name?: string; notes?: string; printed: boolean;
  created_at: string; updated_at: string;
}

export interface Table {
  id: string; number: string; capacity: number; status: TableStatus;
  position_x: number; position_y: number; shape: 'square' | 'round';
  zone?: string; current_order_id?: string;
}

export interface Customer {
  id: string; name: string; phone?: string; email?: string;
  address?: string; notes?: string; total_orders: number; total_spent: number;
}

export interface Discount {
  id: string; name: string; type: 'percentage' | 'fixed';
  value: number; is_active: boolean; min_order_amount?: number;
}

export interface BusinessConfig {
  id: string; business_name: string; business_type: string;
  address: string; phone: string; email: string; logo_url?: string;
  opening_hours: Record<string, { open: string; close: string; is_open: boolean }>;
  is_open: boolean; delivery_available: boolean; takeaway_available: boolean;
  dine_in_available: boolean; counter_available: boolean;
  currency: string; currency_symbol: string; tax_rate: number;
  waiter_pin: string; primary_color: string;
}

export interface AdminUser {
  id: string; name: string; email: string; role: 'admin' | 'staff';
}

export interface ApiResponse<T = unknown> {
  success: boolean; data?: T; message?: string; error?: string;
}
