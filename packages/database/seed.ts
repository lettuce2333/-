import prisma from './src/prisma-like';
import db from './src/db-init';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');
  db.exec('DELETE FROM Notification');
  db.exec('DELETE FROM Favorite');
  db.exec('DELETE FROM Review');
  db.exec('DELETE FROM AfterSaleLog');
  db.exec('DELETE FROM AfterSale');
  db.exec('DELETE FROM Logistics');
  db.exec('DELETE FROM Payment');
  db.exec('DELETE FROM OrderStatusLog');
  db.exec('DELETE FROM OrderItem');
  db.exec('DELETE FROM "Order"');
  db.exec('DELETE FROM CartItem');
  db.exec('DELETE FROM ProductSku');
  db.exec('DELETE FROM Product');
  db.exec('DELETE FROM ShopMember');
  db.exec('DELETE FROM Shop');
  db.exec('DELETE FROM Address');
  db.exec('DELETE FROM UserRole');
  db.exec('DELETE FROM User');
  db.exec('DELETE FROM Category');
  db.exec('DELETE FROM LogisticsTemplate');
  db.exec('DELETE FROM RedemptionOrderItem');
  db.exec('DELETE FROM RedemptionOrder');
  db.exec('DELETE FROM TokenTransaction');
  db.exec('DELETE FROM Coupon');
  db.exec('DELETE FROM CourtVote');
  db.exec('DELETE FROM CourtCase');
  db.exec('DELETE FROM CourtTokenAccount');
  const hash = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.create({ data: { email: 'admin@zuoye.com', password: hash, nickname: 'Admin' } });
  await prisma.userRole.create({ data: { userId: admin.id, role: 'super_admin' } });
  await prisma.userRole.create({ data: { userId: admin.id, role: 'business_admin' } });
  await prisma.userRole.create({ data: { userId: admin.id, role: 'cs_admin' } });
  const buyer1 = await prisma.user.create({ data: { email: 'buyer@zuoye.com', password: hash, nickname: 'Buyer', phone: '13800138001' } });
  await prisma.userRole.create({ data: { userId: buyer1.id, role: 'buyer' } });
  const shopOwner = await prisma.user.create({ data: { email: 'shop@zuoye.com', password: hash, nickname: 'ShopOwner', phone: '13800138002' } });
  await prisma.userRole.create({ data: { userId: shopOwner.id, role: 'shop_owner' } });
  const shopCS = await prisma.user.create({ data: { email: 'shopcs@zuoye.com', password: hash, nickname: 'ShopCS' } });
  await prisma.userRole.create({ data: { userId: shopCS.id, role: 'shop_cs' } });
  const cat1 = await prisma.category.create({ data: { name: 'Mobile', level: 1, sort: 1 } });
  const cat2 = await prisma.category.create({ data: { name: 'Computer', level: 1, sort: 2 } });
  const cat3 = await prisma.category.create({ data: { name: 'Electronics', level: 1, sort: 3 } });
  const cat4 = await prisma.category.create({ data: { name: 'Fashion', level: 1, sort: 4 } });
  await prisma.category.create({ data: { name: 'Smartphone', parentId: cat1.id, level: 2, sort: 1 } });
  await prisma.category.create({ data: { name: 'Earphone', parentId: cat1.id, level: 2, sort: 2 } });
  await prisma.category.create({ data: { name: 'Laptop', parentId: cat2.id, level: 2, sort: 1 } });
  await prisma.category.create({ data: { name: 'Monitor', parentId: cat2.id, level: 2, sort: 2 } });
  await prisma.category.create({ data: { name: 'Fridge', parentId: cat3.id, level: 2, sort: 1 } });
  await prisma.category.create({ data: { name: 'AC', parentId: cat3.id, level: 2, sort: 2 } });
  await prisma.category.create({ data: { name: 'Men', parentId: cat4.id, level: 2, sort: 1 } });
  const shop = await prisma.shop.create({ data: { name: 'Digital Shop', description: 'Best digital products', contactPhone: '400-888-0001', status: 'active', ownerId: shopOwner.id } });
  await prisma.shopMember.create({ data: { shopId: shop.id, userId: shopOwner.id, role: 'shop_owner' } });
  await prisma.shopMember.create({ data: { shopId: shop.id, userId: shopCS.id, role: 'shop_cs' } });
  const p1 = await prisma.product.create({ data: { shopId: shop.id, categoryId: cat1.id, name: 'Phone Pro Max', description: 'Latest phone', images: '[]', price: 5999, totalStock: 200, sales: 1580, variants: '银色 256GB / 银色 512GB / 黑色 256GB', status: 'active' } });
  await prisma.productSku.create({ data: { productId: p1.id, specs: '银色 256GB', price: 5999, stock: 100, image: '' } });
  await prisma.productSku.create({ data: { productId: p1.id, specs: '银色 512GB', price: 6999, stock: 60, image: '' } });
  await prisma.productSku.create({ data: { productId: p1.id, specs: '黑色 256GB', price: 5999, stock: 40, image: '' } });
  const p2 = await prisma.product.create({ data: { shopId: shop.id, categoryId: cat1.id, name: 'Earphone Pro', description: 'Best earphone', images: '[]', price: 899, totalStock: 500, sales: 3200, variants: '白色 / 黑色 / 蓝色', status: 'active' } });
  await prisma.productSku.create({ data: { productId: p2.id, specs: '白色', price: 899, stock: 200, image: '' } });
  await prisma.productSku.create({ data: { productId: p2.id, specs: '黑色', price: 899, stock: 200, image: '' } });
  await prisma.productSku.create({ data: { productId: p2.id, specs: '蓝色', price: 949, stock: 100, image: '' } });
  const p3 = await prisma.product.create({ data: { shopId: shop.id, categoryId: cat2.id, name: 'Laptop 14inch', description: 'i7 laptop', images: '[]', price: 4999, totalStock: 100, sales: 890, variants: '灰色 16GB / 灰色 32GB', status: 'active' } });
  await prisma.productSku.create({ data: { productId: p3.id, specs: '灰色 16GB', price: 4999, stock: 60, image: '' } });
  await prisma.productSku.create({ data: { productId: p3.id, specs: '灰色 32GB', price: 5999, stock: 40, image: '' } });
  const p1Skus = await prisma.productSku.findMany({ where: { productId: p1.id } });

  // 小法庭测试陪审员：注册满 7 天且有已完成订单
  const courtBuyers: any[] = [];
  const courtCreatedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  for (let i = 1; i <= 9; i++) {
    const no = String(i).padStart(2, '0');
    const u = await prisma.user.create({
      data: {
        email: `test_court_${no}@example.com`,
        password: hash,
        nickname: `陪审员${no}`,
        phone: `139000000${no}`,
        createdAt: courtCreatedAt,
      },
    });
    await prisma.userRole.create({ data: { userId: u.id, role: 'buyer' } });
    courtBuyers.push(u);
  }
  for (const u of courtBuyers) {
    const order = await prisma.order.create({
      data: {
        orderNo: `ORDC${u.id}${Date.now()}`,
        userId: u.id,
        shopId: shop.id,
        totalAmount: 5999,
        status: 'COMPLETED',
        completedAt: new Date(),
        receiverName: u.nickname,
        receiverPhone: u.phone,
        receiverAddress: '测试地址',
      },
    });
    await prisma.orderItem.create({
      data: { orderId: order.id, productId: p1.id, skuId: p1Skus[0].id, productName: p1.name, skuSpecs: '银色 256GB', quantity: 1, unitPrice: 5999, subtotal: 5999, image: '' },
    });
  }
  await prisma.address.create({ data: { userId: buyer1.id, receiver: 'Buyer', phone: '13800138001', province: 'Guangdong', city: 'Shenzhen', district: 'Nanshan', detail: 'Building A Room 1001', isDefault: 1 } });
  console.log('Seed completed!');
  console.log('Test accounts (password: 123456):');
  console.log('  Admin:   admin@zuoye.com');
  console.log('  Buyer:   buyer@zuoye.com');
  console.log('  Shop:    shop@zuoye.com');
  console.log('  ShopCS:  shopcs@zuoye.com');
  console.log('  小法庭陪审员: test_court_01@example.com ~ test_court_09@example.com');
}
main().catch((e) => { console.error(e); process.exit(1); });
