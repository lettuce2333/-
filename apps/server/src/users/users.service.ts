import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class UsersService {
  async getAddresses(userId: number) {
    return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
  }

  async createAddress(userId: number, data: any) {
    const payload = this.normalizeAddress(data);
    const existing = await prisma.address.count({ where: { userId } });
    const isDefault = existing === 0 ? 1 : payload.isDefault ? 1 : 0;

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return prisma.address.create({ data: { ...payload, userId, isDefault } });
  }

  async updateAddress(userId: number, addressId: number, data: any) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!addr) throw new NotFoundException('地址不存在');

    const payload = this.normalizeAddress(data);
    if (payload.isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: addressId }, data: payload });
  }

  async deleteAddress(userId: number, addressId: number) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!addr) throw new NotFoundException('地址不存在');
    return prisma.address.delete({ where: { id: addressId } });
  }

  private normalizeAddress(data: any) {
    const receiver = String(data.receiver || '').trim();
    const phone = String(data.phone || '').trim();
    const province = String(data.province || '').trim();
    const city = String(data.city || '').trim();
    const district = String(data.district || '').trim();
    const detail = String(data.detail || '').trim();

    if (!receiver || !phone || !province || !city || !district || !detail) {
      throw new BadRequestException('请完整填写收货地址');
    }
    return { receiver, phone, province, city, district, detail, isDefault: data.isDefault ? 1 : 0 };
  }
}
