import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';

export const getDiscounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('discounts')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo descuentos', 500); }
};

export const getActiveDiscounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('discounts')
      .select('*').eq('is_active', true);
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo descuentos', 500); }
};

export const createDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, value, min_order_amount } = req.body;
    if (!name || !type || !value) { sendError(res, 'Nombre, tipo y valor requeridos', 400); return; }
    const { data, error } = await supabaseAdmin.from('discounts')
      .insert({ name, type, value: Number(value), min_order_amount: min_order_amount || null, is_active: true })
      .select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Descuento creado', 201);
  } catch { sendError(res, 'Error creando descuento', 500); }
};

export const updateDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('discounts')
      .update(req.body).eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Descuento actualizado');
  } catch { sendError(res, 'Error actualizando descuento', 500); }
};

export const deleteDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('discounts').delete().eq('id', id);
    sendSuccess(res, null, 'Descuento eliminado');
  } catch { sendError(res, 'Error eliminando descuento', 500); }
};
