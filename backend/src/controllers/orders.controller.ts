import { Request, Response } from 'express';
import { io } from '../index';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError, generateOrderNumber } from '../utils/response';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderData = req.body;

    if (!orderData.items || orderData.items.length === 0) {
      sendError(res, 'El pedido debe tener al menos un producto', 400); return;
    }
    if (!orderData.order_type) {
      sendError(res, 'Tipo de pedido requerido', 400); return;
    }
    if (orderData.order_type === 'delivery' && !orderData.delivery_address) {
      sendError(res, 'Dirección requerida para delivery', 400); return;
    }

    const productIds = orderData.items.map((i: any) => i.product_id);
    const { data: products } = await supabaseAdmin.from('products')
      .select('id, name, price, is_available, track_stock, stock')
      .in('id', productIds);

    if (!products) { sendError(res, 'Error verificando productos', 500); return; }

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    let subtotal = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const product: any = productMap.get(item.product_id);
      if (!product) { sendError(res, `Producto no encontrado: ${item.product_id}`, 400); return; }
      if (!product.is_available) { sendError(res, `"${product.name}" no disponible`, 400); return; }
      if (product.track_stock && product.stock !== null && product.stock < item.quantity) {
        sendError(res, `Stock insuficiente de "${product.name}"`, 400); return;
      }

      // Calcular precio con modificadores
      let itemPrice = product.price;
      if (item.modifiers && item.modifiers.length > 0) {
        itemPrice += item.modifiers.reduce((sum: number, m: any) => sum + (m.price || 0), 0);
      }

      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: item.product_id,
        product_name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes || null,
        modifiers: item.modifiers || null,
        status: 'pending',
      });
    }

    // Aplicar descuento
    let discountAmount = 0;
    if (orderData.discount_id) {
      const { data: discount } = await supabaseAdmin.from('discounts')
        .select('*').eq('id', orderData.discount_id).single();
      if (discount && discount.is_active) {
        if (discount.type === 'percentage') {
          discountAmount = subtotal * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    const orderNumber = generateOrderNumber();

    // Obtener número de mesa si hay table_id
    let tableNumber = orderData.table_number;
    if (orderData.table_id && !tableNumber) {
      const { data: table } = await supabaseAdmin.from('tables')
        .select('number').eq('id', orderData.table_id).single();
      if (table) tableNumber = table.number;
    }

    const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert({
      order_number: orderNumber,
      customer_name: orderData.customer_name || null,
      customer_phone: orderData.customer_phone || null,
      customer_email: orderData.customer_email || null,
      customer_id: orderData.customer_id || null,
      order_type: orderData.order_type,
      table_id: orderData.table_id || null,
      table_number: tableNumber || null,
      delivery_address: orderData.delivery_address || null,
      delivery_notes: orderData.delivery_notes || null,
      subtotal, discount_amount: discountAmount, total,
      discount_id: orderData.discount_id || null,
      status: 'pending',
      payment_method: orderData.payment_method,
      payment_status: 'pending',
      notes: orderData.notes || null,
      waiter_name: orderData.waiter_name || null,
      printed: false,
    }).select().single();

    if (orderError || !order) {
      console.error('Error creando orden:', orderError);
      sendError(res, 'Error creando pedido', 500); return;
    }

    const itemsWithOrderId = orderItems.map((item: any) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemsWithOrderId);

    if (itemsError) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      sendError(res, 'Error en items del pedido', 500); return;
    }

    // Actualizar stock
    for (const item of orderData.items) {
      const product: any = productMap.get(item.product_id);
      if (product && product.track_stock && product.stock !== null) {
        await supabaseAdmin.from('products')
          .update({ stock: product.stock - item.quantity }).eq('id', item.product_id);
      }
    }

    // Actualizar estado de mesa si aplica
    if (orderData.table_id) {
      await supabaseAdmin.from('tables')
        .update({ status: 'occupied', current_order_id: order.id })
        .eq('id', orderData.table_id)
      io.emit('mesa_actualizada', { table_id: orderData.table_id, status: 'occupied' })
    } else if (tableNumber) {
      // Cliente pidió desde la web poniendo número de mesa sin table_id
      const { data: foundTable } = await supabaseAdmin.from('tables')
        .select('id').eq('number', tableNumber).single()
      if (foundTable) {
        await supabaseAdmin.from('tables')
          .update({ status: 'occupied', current_order_id: order.id })
          .eq('id', foundTable.id)
        io.emit('mesa_actualizada', { table_id: foundTable.id, status: 'occupied' })
      }
    }

    const { data: completeOrder } = await supabaseAdmin
      .from('orders').select('*, order_items(*)').eq('id', order.id).single();

    io.emit('nuevo_pedido', completeOrder);
    sendSuccess(res, completeOrder, 'Pedido creado', 201);
  } catch (err) {
    console.error('Error createOrder:', err);
    sendError(res, 'Error interno', 500);
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, order_type, date, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

      if (status) {
        const statuses = (status as string).split(',')
        if (statuses.length > 1) {
          query = query.in('status', statuses)
        } else {
          query = query.eq('status', status as string)
        }
      }
    if (order_type) query = query.eq('order_type', order_type as string);
    if (date) {
      const start = new Date(date as string); start.setHours(0, 0, 0, 0);
      const end = new Date(date as string); end.setHours(23, 59, 59, 999);
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    }

    const { data, error, count } = await query;
    if (error) throw error;
    sendSuccess(res, { orders: data || [], total: count || 0, page: pageNum, limit: limitNum, totalPages: Math.ceil((count || 0) / limitNum) });
  } catch { sendError(res, 'Error obteniendo pedidos', 500); }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('orders')
      .select('*, order_items(*)').eq('id', id).single();
    if (error || !data) { sendError(res, 'Pedido no encontrado', 404); return; }
    sendSuccess(res, data);
  } catch { sendError(res, 'Error obteniendo pedido', 500); }
};

export const getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const { data, error } = await supabaseAdmin.from('orders')
      .select('*, order_items(*)').eq('order_number', orderNumber).single();
    if (error || !data) { sendError(res, 'Pedido no encontrado', 404); return; }
    sendSuccess(res, data);
  } catch { sendError(res, 'Error obteniendo pedido', 500); }
};

export const getActiveOrdersByTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { table_id } = req.params;

    // Primero obtener el número de mesa para buscar también por table_number
    const { data: tableData } = await supabaseAdmin.from('tables')
      .select('number').eq('id', table_id).single();

    const tableNumber = tableData?.number;

    // Buscar pedidos por table_id O por table_number (para pedidos hechos desde la web)
    let query = supabaseAdmin.from('orders')
      .select('*, order_items(*)')
      .not('status', 'in', '("delivered","cancelled")')
      .eq('order_type', 'dine_in')
      .order('created_at', { ascending: false });

    if (tableNumber) {
      query = query.or(`table_id.eq.${table_id},table_number.eq.${tableNumber}`)
    } else {
      query = query.eq('table_id', table_id)
    }

    const { data, error } = await query;
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo pedidos de mesa', 500); }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) { sendError(res, 'Estado inválido', 400); return; }

    const { data, error } = await supabaseAdmin.from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select('*, order_items(*)').single();
    if (error) throw error;

    // Liberar mesa si pedido entregado o cancelado
    if ((status === 'delivered' || status === 'cancelled') && data.table_id) {
      await supabaseAdmin.from('tables')
        .update({ status: 'free', current_order_id: null })
        .eq('id', data.table_id);
      io.emit('mesa_actualizada', { table_id: data.table_id, status: 'free' });
    }

    io.emit('pedido_actualizado', data);
    sendSuccess(res, data, `Estado: ${status}`);
  } catch { sendError(res, 'Error actualizando estado', 500); }
};

export const updateItemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabaseAdmin.from('order_items')
      .update({ status }).eq('id', id).select().single();
    if (error) throw error;
    io.emit('item_actualizado', data);
    sendSuccess(res, data);
  } catch { sendError(res, 'Error actualizando item', 500); }
};

export const markOrderPrinted = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('orders')
      .update({ printed: true, updated_at: new Date().toISOString() }).eq('id', id);
    sendSuccess(res, null, 'Marcado como impreso');
  } catch { sendError(res, 'Error', 500); }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    const [todayRes, pendingRes, weekRes, monthRes, topRes] = await Promise.all([
      supabaseAdmin.from('orders').select('total, status, payment_status, order_type').gte('created_at', todayStr),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'preparing']),
      supabaseAdmin.from('orders').select('created_at, total, status, payment_status').gte('created_at', weekAgo.toISOString()).order('created_at'),
      supabaseAdmin.from('orders').select('total, payment_status').gte('created_at', monthAgo.toISOString()),
      supabaseAdmin.from('order_items').select('product_name, quantity').limit(500),
    ]);

    const todayOrders = todayRes.data || [];
    const todayRevenue = todayOrders.filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + o.total, 0);
    const monthRevenue = (monthRes.data || []).filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + o.total, 0);

    const productCounts: Record<string, number> = {};
    (topRes.data || []).forEach((item: any) => {
      productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
    });
    const topProducts = Object.entries(productCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, count]) => ({ name, count }));

    const ordersByType = todayOrders.reduce((acc: any, o: any) => {
      acc[o.order_type] = (acc[o.order_type] || 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, {
      today: { orders: todayOrders.length, revenue: todayRevenue },
      month: { revenue: monthRevenue },
      pending: pendingRes.count || 0,
      weekOrders: weekRes.data || [],
      topProducts,
      ordersByType,
    });
  } catch (err) { console.error(err); sendError(res, 'Error estadísticas', 500); }
};

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;
    let query = supabaseAdmin.from('orders')
      .select('*, order_items(product_name, quantity, subtotal)')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });
    if (from) query = query.gte('created_at', new Date(from as string).toISOString());
    if (to) {
      const toDate = new Date(to as string); toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }
    const { data, error } = await query;
    if (error) throw error;
    const total = (data || []).reduce((s: number, o: any) => s + o.total, 0);
    const byType = (data || []).reduce((acc: any, o: any) => {
      acc[o.order_type] = (acc[o.order_type] || 0) + o.total;
      return acc;
    }, {});
    sendSuccess(res, { orders: data || [], total, count: (data || []).length, byType });
  } catch { sendError(res, 'Error reporte', 500); }
};
