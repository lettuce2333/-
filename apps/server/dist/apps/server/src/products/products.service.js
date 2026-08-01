"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let ProductsService = class ProductsService {
    async findAll(query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const where = { status: 'active' };
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.keyword)
            where.name = { contains: query.keyword };
        if (query.priceMin)
            where.price = { ...(where.price || {}), gte: parseFloat(query.priceMin) };
        if (query.priceMax)
            where.price = { ...(where.price || {}), lte: parseFloat(query.priceMax) };
        let orderBy = { createdAt: 'desc' };
        if (query.sort === 'price_asc')
            orderBy = { price: 'asc' };
        else if (query.sort === 'price_desc')
            orderBy = { price: 'desc' };
        else if (query.sort === 'sales')
            orderBy = { sales: 'desc' };
        const [data, total] = await Promise.all([
            database_1.default.product.findMany({
                where,
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { shop: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } },
            }),
            database_1.default.product.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async findOne(id) {
        const product = await database_1.default.product.findUnique({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('商品不存在');
        product.skus = await database_1.default.productSku.findMany({ where: { productId: id } });
        product.shop = await database_1.default.shop.findUnique({ where: { id: product.shopId } });
        product.category = await database_1.default.category.findUnique({ where: { id: product.categoryId } });
        return product;
    }
    async getShopProducts(shopId, query) {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const where = { shopId };
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.default.product.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            database_1.default.product.count({ where }),
        ]);
        for (const p of data) {
            p.skus = await database_1.default.productSku.findMany({ where: { productId: p.id } });
        }
        return { data, total, page, pageSize };
    }
    async createProduct(shopId, userId, data) {
        const member = await database_1.default.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
        if (!member)
            throw new common_1.ForbiddenException('无权操作');
        const variantList = Array.isArray(data.variants) ? data.variants : [];
        const totalStock = variantList.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        const variantsLabel = variantList.map((v) => v.name).join(' / ');
        const product = await database_1.default.product.create({
            data: {
                shopId,
                name: data.name,
                categoryId: data.categoryId,
                description: data.description || '',
                images: JSON.stringify(data.images || []),
                price: data.price || 0,
                totalStock,
                variants: variantsLabel,
                status: 'draft',
            },
        });
        for (const v of variantList) {
            await database_1.default.productSku.create({
                data: {
                    productId: product.id,
                    specs: v.name || '',
                    price: data.price || 0,
                    stock: parseInt(v.stock) || 0,
                },
            });
        }
        return product;
    }
    async updateProduct(shopId, userId, productId, data) {
        const member = await database_1.default.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
        if (!member)
            throw new common_1.ForbiddenException('无权操作');
        const product = await database_1.default.product.findFirst({ where: { id: productId, shopId } });
        if (!product)
            throw new common_1.NotFoundException('商品不存在');
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.categoryId !== undefined)
            updateData.categoryId = data.categoryId;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.images !== undefined)
            updateData.images = JSON.stringify(data.images);
        if (data.price !== undefined)
            updateData.price = data.price;
        const variantList = Array.isArray(data.variants) ? data.variants : [];
        if (variantList.length > 0) {
            const totalStock = variantList.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
            const variantsLabel = variantList.map((v) => v.name).join(' / ');
            updateData.totalStock = totalStock;
            updateData.variants = variantsLabel;
            await database_1.default.productSku.deleteMany({ where: { productId } });
            for (const v of variantList) {
                await database_1.default.productSku.create({
                    data: {
                        productId,
                        specs: v.name || '',
                        price: data.price || product.price,
                        stock: parseInt(v.stock) || 0,
                    },
                });
            }
        }
        return database_1.default.product.update({ where: { id: productId }, data: updateData });
    }
    async submitForReview(shopId, userId, productId) {
        const member = await database_1.default.shopMember.findFirst({ where: { userId, shopId, role: { in: ['shop_owner'] } } });
        if (!member)
            throw new common_1.ForbiddenException('无权操作');
        return database_1.default.product.update({ where: { id: productId }, data: { status: 'active' } });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)()
], ProductsService);
//# sourceMappingURL=products.service.js.map