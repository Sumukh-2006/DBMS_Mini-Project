// lib/auth.js
// Authentication, password hashing, JWT generation, session cookie management, and RBAC
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-interntrack-auth-pes-2024';
const COOKIE_NAME = process.env.COOKIE_NAME || 'interntrack_session';

/**
 * Hash plaintext password using bcrypt
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

/**
 * Compare plaintext password with stored hash
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Create a signed JWT token containing user identity and role
 */
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Helper to extract and verify session user from request cookies or Authorization header
 * Supports Next.js Request (NextRequest / standard Request)
 */
function getUserFromRequest(request) {
  let token = null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check HTTP-only cookie
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${COOKIE_NAME}=`));
      if (match) {
        token = decodeURIComponent(match.split('=')[1]);
      }
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Enforces role-based authorization for route handlers.
 * Returns decoded user or throws an Error with HTTP status code.
 */
function requireAuth(request, allowedRoles = []) {
  const user = getUserFromRequest(request);
  if (!user) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const err = new Error(`Forbidden: Role '${user.role}' does not have permission`);
    err.status = 403;
    throw err;
  }

  return user;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  getUserFromRequest,
  requireAuth,
  COOKIE_NAME,
};
