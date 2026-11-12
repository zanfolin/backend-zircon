import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export const tokenService = {
  generateAccessToken(payload) {
    return jwt.sign(payload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiry,
    });
  },

  generateRefreshToken(payload) {
    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiry,
    });
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.accessSecret);
    } catch (error) {
      return null;
    }
  },

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret);
    } catch (error) {
      return null;
    }
  },

  decodeToken(token) {
    return jwt.decode(token);
  },

  generateTokenPair(user) {
    const payload = {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  },
};