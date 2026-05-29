import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';

export const getTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('tables')
      .select('*').order('number');
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo mesas', 500); }
};

export const getTableById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('tables')
      .select('*').eq('id', id).single();
    if (error || !data) { sendError(res, 'Mesa no encontrada', 404); return; }
    sendSuccess(res, data);
  } catch { sendError(res, 'Error obteniendo mesa', 500); }
};

export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { number, capacity, shape, zone, position_x, position_y } = req.body;
    if (!number) { sendError(res, 'Número de mesa requerido', 400); return; }
    const { data, error } = await supabaseAdmin.from('tables').insert({
      number, capacity: capacity || 4, shape: shape || 'square',
      zone: zone || null, status: 'free',
      position_x: position_x || 100, position_y: position_y || 100,
    }).select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Mesa creada', 201);
  } catch (err) { console.error(err); sendError(res, 'Error creando mesa', 500); }
};

export const updateTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('tables')
      .update(req.body).eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Mesa actualizada');
  } catch { sendError(res, 'Error actualizando mesa', 500); }
};

export const updateTablePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { position_x, position_y } = req.body;
    const { data, error } = await supabaseAdmin.from('tables')
      .update({ position_x, position_y }).eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data);
  } catch { sendError(res, 'Error moviendo mesa', 500); }
};

export const updateTableStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, current_order_id } = req.body;
    const { data, error } = await supabaseAdmin.from('tables')
      .update({ status, current_order_id: current_order_id || null }).eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data);
  } catch { sendError(res, 'Error actualizando estado de mesa', 500); }
};

export const deleteTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('tables').delete().eq('id', id);
    sendSuccess(res, null, 'Mesa eliminada');
  } catch { sendError(res, 'Error eliminando mesa', 500); }
};
