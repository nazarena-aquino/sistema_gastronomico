import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';

const getMPClient = () => {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado');
  return new MercadoPagoConfig({ accessToken: token });
};

export const createPreference = async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id } = req.body;
    if (!order_id) { sendError(res, 'order_id requerido', 400); return; }

    const { data: order, error } = await supabaseAdmin.from('orders')
      .select('*, order_items(*)').eq('id', order_id).single();
    if (error || !order) { sendError(res, 'Pedido no encontrado', 404); return; }
    if (order.payment_status === 'paid') { sendError(res, 'Ya pagado', 400); return; }

    const client = getMPClient();
    const preference = new Preference(client);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const items = order.order_items.map((item: any) => ({
      id: item.product_id,
      title: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: 'ARS',
    }));

    const preferenceData: any = {
      items,
      payer: {
        name: order.customer_name || 'Cliente',
        email: order.customer_email || 'cliente@gastro.com',
      },
      external_reference: order.id,
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payments/webhook`,
      back_urls: {
        success: `${frontendUrl}/order-status/${order.order_number}?payment=success`,
        failure: `${frontendUrl}/order-status/${order.order_number}?payment=failure`,
        pending: `${frontendUrl}/order-status/${order.order_number}?payment=pending`,
      },
      statement_descriptor: process.env.BUSINESS_NAME || 'Restaurante',
      metadata: { order_id: order.id, order_number: order.order_number },
    };

    if (process.env.NODE_ENV === 'production') {
      preferenceData.auto_return = 'approved';
    }

    const result = await preference.create({ body: preferenceData });
    await supabaseAdmin.from('orders')
      .update({ mp_preference_id: result.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    sendSuccess(res, { preference_id: result.id, init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });
  } catch (err: any) {
    console.error('Error MP:', err);
    sendError(res, `Error creando preferencia: ${err.message}`, 500);
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) { res.status(200).json({ received: true }); return; }

      const client = getMPClient();
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });
      const orderId = payment.external_reference;
      if (!orderId) { res.status(200).json({ received: true }); return; }

      let paymentStatus: string;
      let orderStatus: string | undefined;
      switch (payment.status) {
        case 'approved': paymentStatus = 'paid'; orderStatus = 'confirmed'; break;
        case 'rejected': case 'cancelled': paymentStatus = 'failed'; break;
        case 'refunded': paymentStatus = 'refunded'; orderStatus = 'cancelled'; break;
        default: paymentStatus = 'pending';
      }

      const updateData: any = { payment_status: paymentStatus, payment_id: String(paymentId), updated_at: new Date().toISOString() };
      if (orderStatus) updateData.status = orderStatus;
      await supabaseAdmin.from('orders').update(updateData).eq('id', orderId);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ received: true });
  }
};

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id } = req.params;
    const { data: order } = await supabaseAdmin.from('orders')
      .select('id, payment_method, payment_status').eq('id', order_id).single();
    if (!order) { sendError(res, 'Pedido no encontrado', 404); return; }
    if (order.payment_status === 'paid') { sendError(res, 'Ya pagado', 400); return; }

    const { data, error } = await supabaseAdmin.from('orders')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order_id).select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Pago confirmado');
  } catch { sendError(res, 'Error confirmando pago', 500); }
};

export const getMPPublicKey = async (req: Request, res: Response): Promise<void> => {
  const publicKey = process.env.MP_PUBLIC_KEY;
  if (!publicKey) { sendError(res, 'MercadoPago no configurado', 500); return; }
  sendSuccess(res, { public_key: publicKey });
};
