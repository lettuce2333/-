import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import prisma from '@zuoye/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'zuoye-ecommerce-secret-key-2024',
    });
  }

  async validate(payload: any) {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status === 'banned') {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.userId,
      roles: payload.roles,
      currentRole: payload.currentRole,
      shopId: payload.shopId,
    };
  }
}
