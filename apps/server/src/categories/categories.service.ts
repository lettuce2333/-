import { Injectable } from '@nestjs/common';
import prisma from '@zuoye/database';

@Injectable()
export class CategoriesService {
  async findAll() {
    return prisma.category.findMany({ orderBy: { sort: 'asc' }, include: { children: { orderBy: { sort: 'asc' } } } });
  }

  async getTree() {
    const cats = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sort: 'asc' },
      include: {
        children: {
          orderBy: { sort: 'asc' },
          include: {
            children: { orderBy: { sort: 'asc' } },
          },
        },
      },
    });
    return cats;
  }
}
