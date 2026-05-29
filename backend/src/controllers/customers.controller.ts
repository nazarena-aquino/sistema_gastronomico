import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query = supabaseAdmin.from('customers').select('*').order('name');
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo clientes', 500); }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: customer, error } = await supabaseAdmin.from('customers')
      .select('*').eq('id', id).single();
    if (error || !customer) { sendError(res, 'Cliente no encontrado', 404); return; }
    const { data: orders } = await supabaseAdmin.from('orders')
      .select('id, order_number, total, status, created_at')
      .eq('customer_id', id).order('created_at', { ascending: false }).limit(20);
    sendSuccess(res, { ...customer, orders: orders || [] });
  } catch { sendError(res, 'Error obteniendo cliente', 500); }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (!name) { sendError(res, 'Nombre requerido', 400); return; }
    const { data, error } = await supabaseAdmin.from('customers')
      .insert({ name, phone, email, address, notes, total_orders: 0, total_spent: 0 })
      .select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Cliente creado', 201);
  } catch (err) { console.error(err); sendError(res, 'Error creando cliente', 500); }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('customers')
      .update(req.body).eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Cliente actualizado');
  } catch { sendError(res, 'Error actualizando cliente', 500); }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('customers').delete().eq('id', id);
    sendSuccess(res, null, 'Cliente eliminado');
  } catch { sendError(res, 'Error eliminando cliente', 500); }
};
