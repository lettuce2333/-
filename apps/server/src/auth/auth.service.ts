import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import prisma from '@zuoye/database';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(email: string, password: string, nickname?: string, phone?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('邮箱已被注册');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        nickname: nickname || email.split('@')[0],
        phone,
        roles: { create: { role: 'buyer' } },
      },
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
    if (!user) throw new UnauthorizedException('邮箱或密码错误');
    if (user.status === 'banned') throw new UnauthorizedException('账号已被封禁');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('邮箱或密码错误');

    return this.generateTokens(user);
  }

  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) throw new UnauthorizedException('用户不存在');
    const { password, ...rest } = user;
    return rest;
  }

  private generateTokens(user: any) {
    const roles = user.roles?.map((r: any) => r.role) || ['buyer'];
    const payload = {
      userId: user.id,
      roles,
      currentRole: roles[0],
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, user: { id: user.id, email: user.email, nickname: user.nickname, roles } };
  }
}
