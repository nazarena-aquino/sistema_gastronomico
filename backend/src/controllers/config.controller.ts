import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';
import QRCode from 'qrcode';

export const getBusinessConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('business_config').select('*').single();
    if (error && error.code !== 'PGRST116') throw error;
    sendSuccess(res, data || null);
  } catch { sendError(res, 'Error obteniendo configuración', 500); }
};

export const updateBusinessConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data: existing } = await supabaseAdmin.from('business_config').select('id').single();
    let result;
    if (existing) {
      result = await supabaseAdmin.from('business_config').update(updates).eq('id', existing.id).select().single();
    } else {
      result = await supabaseAdmin.from('business_config').insert(updates).select().single();
    }
    if (result.error) throw result.error;
    sendSuccess(res, result.data, 'Configuración actualizada');
  } catch { sendError(res, 'Error actualizando configuración', 500); }
};

export const toggleBusinessOpen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: config } = await supabaseAdmin.from('business_config').select('id, is_open').single();
    if (!config) { sendError(res, 'Configuración no encontrada', 404); return; }
    const { data, error } = await supabaseAdmin.from('business_config')
      .update({ is_open: !config.is_open, updated_at: new Date().toISOString() })
      .eq('id', config.id).select().single();
    if (error) throw error;
    sendSuccess(res, data, data.is_open ? 'Local abierto' : 'Local cerrado');
  } catch { sendError(res, 'Error cambiando estado', 500); }
};

export const getMPPublicKey = async (req: Request, res: Response): Promise<void> => {
  const publicKey = process.env.MP_PUBLIC_KEY;
  if (!publicKey) { sendError(res, 'MP no configurado', 500); return; }
  sendSuccess(res, { public_key: publicKey });
};

export const generateMenuQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const menuUrl = process.env.PUBLIC_MENU_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu`;
    const { format = 'png' } = req.query;
    if (format === 'svg') {
      const svg = await QRCode.toString(menuUrl, { type: 'svg', width: 300, margin: 2 });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg); return;
    }
    const qrDataUrl = await QRCode.toDataURL(menuUrl, { width: 300, margin: 2 });
    sendSuccess(res, { qr_data_url: qrDataUrl, menu_url: menuUrl });
  } catch { sendError(res, 'Error generando QR', 500); }
};

export const generateTableQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tableUrl = `${baseUrl}/menu?table=${tableNumber}`;
    const qrDataUrl = await QRCode.toDataURL(tableUrl, { width: 300, margin: 2 });
    sendSuccess(res, { qr_data_url: qrDataUrl, table_url: tableUrl, table_number: tableNumber });
  } catch { sendError(res, 'Error generando QR de mesa', 500); }
};
