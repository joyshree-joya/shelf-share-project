import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function getUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const [kind, token] = header.split(' ');
  if (kind !== 'Bearer' || !token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || typeof decoded !== 'object') return null;
    const userId = decoded.sub;
    if (!userId) return null;
    const user = await User.findOne({ id: userId }).lean();
    return user || null;
  } catch (_err) {
    return null;
  }
}

export function requireAuth() {
  return async (req, res, next) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  };
}

export function optionalAuth() {
  return async (req, _res, next) => {
    const user = await getUserFromRequest(req);
    if (user) req.user = user;
    next();
  };
}
