import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';
import { sendError } from '../utils/response';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Token de autenticación requerido', 401);
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.admin = decoded;
    next();
  } catch {
    sendError(res, 'Token inválido o expirado', 401);
  }
};

export const verifyWaiterPin = (req: Request, res: Response, next: NextFunction): void => {
  const { pin } = req.body;
  const validPin = process.env.WAITER_PIN || '1234';
  if (pin !== validPin) {
    sendError(res, 'PIN incorrecto', 401);
    return;
  }
  next();
};
