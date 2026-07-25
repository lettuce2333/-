import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class UsersService {
  async getAddresses(userId: number) {
    return prisma.address.findMany({ where: { userId } });
  }

  async createAddress(userId: number, data: any) {
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return prisma.address.create({ data: { ...data, userId } });
  }

  async updateAddress(userId: number, addressId: number, data: any) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!addr) throw new NotFoundException('地址不存在');
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: addressId }, data });
  }

  async deleteAddress(userId: number, addressId: number) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!addr) throw new NotFoundException('地址不存在');
    return prisma.address.delete({ where: { id: addressId } });
  }
}
