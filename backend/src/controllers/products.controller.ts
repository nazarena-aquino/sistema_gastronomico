import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { sendSuccess, sendError } from '../utils/response';

// ==================== CATEGORÍAS ====================

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo categorías', 500); }
};

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('categories').select('*').order('sort_order');
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo categorías', 500); }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, image_url, sort_order } = req.body;
    if (!name) { sendError(res, 'Nombre requerido', 400); return; }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabaseAdmin.from('categories')
      .insert({ name, slug, description, image_url, sort_order: sort_order || 0, is_active: true })
      .select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Categoría creada', 201);
  } catch (err) { console.error(err); sendError(res, 'Error creando categoría', 500); }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('categories')
      .update(req.body).eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data, 'Categoría actualizada');
  } catch { sendError(res, 'Error actualizando categoría', 500); }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('categories').update({ is_active: false }).eq('id', id);
    sendSuccess(res, null, 'Categoría eliminada');
  } catch { sendError(res, 'Error eliminando categoría', 500); }
};

// ==================== PRODUCTOS ====================

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id, featured } = req.query;
    let query = supabaseAdmin.from('products')
      .select('*, categories(id, name, slug)')
      .eq('is_available', true).order('sort_order');
    if (category_id) query = query.eq('category_id', category_id as string);
    if (featured === 'true') query = query.eq('is_featured', true);
    const { data, error } = await query;
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo productos', 500); }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('products')
      .select('*, categories(id, name, slug)').order('sort_order');
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo productos', 500); }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('products')
      .select('*, categories(id, name, slug), modifier_groups(*, modifiers(*))')
      .eq('id', id).single();
    if (error || !data) { sendError(res, 'Producto no encontrado', 404); return; }
    sendSuccess(res, data);
  } catch { sendError(res, 'Error obteniendo producto', 500); }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category_id, name, description, price, image_url,
      is_available, is_featured, allergens, preparation_time,
      sort_order, track_stock, stock, stock_alert, is_combo
    } = req.body;
    if (!name || !price || !category_id) { sendError(res, 'Nombre, precio y categoría requeridos', 400); return; }
    const { data, error } = await supabaseAdmin.from('products').insert({
      category_id, name, description, price: Number(price),
      image_url: image_url || null,
      is_available: is_available ?? true,
      is_featured: is_featured ?? false,
      allergens: allergens || [],
      preparation_time: preparation_time ? Number(preparation_time) : null,
      sort_order: sort_order || 0,
      track_stock: track_stock ?? false,
      stock: stock ? Number(stock) : null,
      stock_alert: stock_alert ? Number(stock_alert) : null,
      is_combo: is_combo ?? false,
    }).select('*, categories(id, name, slug)').single();
    if (error) throw error;
    sendSuccess(res, data, 'Producto creado', 201);
  } catch (err) { console.error(err); sendError(res, 'Error creando producto', 500); }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.price) updates.price = Number(updates.price);
    const { data, error } = await supabaseAdmin.from('products')
      .update(updates).eq('id', id).select('*, categories(id, name, slug)').single();
    if (error) throw error;
    sendSuccess(res, data, 'Producto actualizado');
  } catch { sendError(res, 'Error actualizando producto', 500); }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('products')
      .update({ is_available: false, updated_at: new Date().toISOString() }).eq('id', id);
    sendSuccess(res, null, 'Producto deshabilitado');
  } catch { sendError(res, 'Error eliminando producto', 500); }
};

export const toggleProductAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: product } = await supabaseAdmin.from('products').select('is_available').eq('id', id).single();
    if (!product) { sendError(res, 'Producto no encontrado', 404); return; }
    const { data, error } = await supabaseAdmin.from('products')
      .update({ is_available: !product.is_available, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    sendSuccess(res, data, `Producto ${data.is_available ? 'habilitado' : 'deshabilitado'}`);
  } catch { sendError(res, 'Error cambiando disponibilidad', 500); }
};

export const uploadProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { sendError(res, 'No se recibió archivo', 400); return; }
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabaseAdmin.storage.from(bucket)
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    sendSuccess(res, { url: urlData.publicUrl }, 'Imagen subida');
  } catch (err) { console.error(err); sendError(res, 'Error subiendo imagen', 500); }
};

// ==================== STOCK ====================

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, type, reason } = req.body;
    const { data: product } = await supabaseAdmin.from('products')
      .select('stock, name').eq('id', id).single();
    if (!product) { sendError(res, 'Producto no encontrado', 404); return; }

    let newStock = product.stock || 0;
    if (type === 'in') newStock += Number(quantity);
    else if (type === 'out') newStock -= Number(quantity);
    else newStock = Number(quantity); // adjustment

    await supabaseAdmin.from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', id);

    await supabaseAdmin.from('stock_movements').insert({
      product_id: id, product_name: product.name,
      type, quantity: Number(quantity), reason: reason || 'Manual',
    });

    sendSuccess(res, { stock: newStock }, 'Stock actualizado');
  } catch (err) { console.error(err); sendError(res, 'Error actualizando stock', 500); }
};

export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin.from('products')
      .select('id, name, stock, stock_alert, categories(name)')
      .eq('track_stock', true)
      .not('stock', 'is', null);
    if (error) throw error;
    const lowStock = (data || []).filter((p: any) => p.stock <= (p.stock_alert || 5));
    sendSuccess(res, lowStock);
  } catch { sendError(res, 'Error obteniendo stock bajo', 500); }
};

export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id } = req.query;
    let query = supabaseAdmin.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(100);
    if (product_id) query = query.eq('product_id', product_id as string);
    const { data, error } = await query;
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo movimientos', 500); }
};

// ==================== MODIFICADORES ====================

export const getModifierGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id } = req.params;
    const { data, error } = await supabaseAdmin.from('modifier_groups')
      .select('*, modifiers(*)').eq('product_id', product_id);
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch { sendError(res, 'Error obteniendo modificadores', 500); }
};

export const createModifierGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id } = req.params;
    const { name, required, multiple, modifiers } = req.body;
    const { data: group, error } = await supabaseAdmin.from('modifier_groups')
      .insert({ product_id, name, required: required ?? false, multiple: multiple ?? false })
      .select().single();
    if (error) throw error;
    if (modifiers && modifiers.length > 0) {
      const mods = modifiers.map((m: any) => ({ ...m, group_id: group.id }));
      await supabaseAdmin.from('modifiers').insert(mods);
    }
    sendSuccess(res, group, 'Grupo creado', 201);
  } catch { sendError(res, 'Error creando grupo', 500); }
};

export const deleteModifierGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('modifiers').delete().eq('group_id', id);
    await supabaseAdmin.from('modifier_groups').delete().eq('id', id);
    sendSuccess(res, null, 'Grupo eliminado');
  } catch { sendError(res, 'Error eliminando grupo', 500); }
};
