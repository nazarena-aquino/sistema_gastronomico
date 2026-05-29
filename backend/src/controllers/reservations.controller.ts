import { Request, Response } from 'express';
import { io } from '../index';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { sendReservationConfirmation, sendReservationCancellation, sendNewReservationAdmin } from '../utils/email';

export const createReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_name, customer_email, customer_phone, reservation_type, people_count, date, time, notes, items, total } = req.body;
    if (!customer_name || !date || !time || !reservation_type) {
      sendError(res, 'Nombre, fecha, hora y tipo son requeridos', 400); return;
    }
    if (!['table', 'preorder'].includes(reservation_type)) {
      sendError(res, 'Tipo inválido', 400); return;
    }

    const { data, error } = await supabaseAdmin.from('reservations').insert({
      customer_name: customer_name.trim(),
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      reservation_type,
      people_count: people_count || 2,
      date,
      time,
      notes: notes || null,
      items: items || [],
      total: total || 0,
      status: 'pending',
    }).select().single();

    if (error) throw error;

    io.emit('nueva_reserva', data);
    sendNewReservationAdmin(data).catch(console.error);
    sendSuccess(res, data, 'Reserva creada exitosamente', 201);
  } catch (err) {
    console.error('Error creando reserva:', err);
    sendError(res, 'Error creando reserva', 500);
  }
};

export const getReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date } = req.query;
    let query = supabaseAdmin.from('reservations')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (status) query = query.eq('status', status as string);
    if (date) query = query.eq('date', date as string);

    const { data, error } = await query;
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo reservas', 500); }
};

export const updateReservationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status)) {
      sendError(res, 'Estado inválido', 400); return;
    }

    const { data, error } = await supabaseAdmin.from('reservations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;

    if (status === 'confirmed') {
      sendReservationConfirmation(data).catch(console.error);
    } else if (status === 'cancelled') {
      sendReservationCancellation(data).catch(console.error);
    }

    io.emit('reserva_actualizada', data);
    sendSuccess(res, data, status === 'confirmed' ? 'Reserva confirmada' : 'Reserva cancelada');
  } catch { sendError(res, 'Error actualizando reserva', 500); }
};

export const deleteReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('reservations').delete().eq('id', id);
    if (error) throw error;
    sendSuccess(res, null, 'Reserva eliminada');
  } catch { sendError(res, 'Error eliminando reserva', 500); }
};
