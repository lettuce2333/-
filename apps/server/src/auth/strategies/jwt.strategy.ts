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

    // Look up shopId if not already in token
    let shopId = payload.shopId || null;
    if (!shopId) {
      const isMerchant = payload.roles?.some(r => ['shop_owner', 'shop_cs', 'shop_warehouse'].includes(r));
      if (isMerchant) {
        const shop = await prisma.shop.findFirst({
          where: { OR: [{ ownerId: payload.userId }, { members: { some: { userId: payload.userId } } }] },
        });
        if (shop) shopId = shop.id;
      }
    }

    return {
      userId: payload.userId,
      roles: payload.roles,
      currentRole: payload.currentRole,
      shopId,
    };
  }
}