export const formatPrice = (price: number, symbol = '$'): string => {
  return `${symbol} ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)}`;
};

export const formatDate = (dateStr: string): string => {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
};

export const orderStatusLabel: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
};

export const orderStatusColor: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', preparing: '#8B5CF6',
  ready: '#10B981', delivered: '#6B7280', cancelled: '#EF4444',
};

export const orderTypeLabel: Record<string, string> = {
  dine_in: '🍽️ En el local', takeaway: '🛍️ Para llevar',
  delivery: '🚚 Delivery', counter: '🏪 Mostrador',
};

export const paymentMethodLabel: Record<string, string> = {
  mercadopago: '💳 MercadoPago', cash: '💵 Efectivo',
  transfer: '🏦 Transferencia', card: '💳 Tarjeta', other: '💰 Otro',
};

export const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado',
};

export const tableStatusLabel: Record<string, string> = {
  free: 'Libre', occupied: 'Ocupada', pending: 'Con pedido', reserved: 'Reservada',
};

export const tableStatusColor: Record<string, string> = {
  free: '#10B981', occupied: '#EF4444', pending: '#F59E0B', reserved: '#8B5CF6',
};
