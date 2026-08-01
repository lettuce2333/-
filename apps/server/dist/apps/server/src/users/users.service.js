"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let UsersService = class UsersService {
    async getAddresses(userId) {
        return database_1.default.address.findMany({ where: { userId } });
    }
    async createAddress(userId, data) {
        if (data.isDefault) {
            await database_1.default.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        }
        return database_1.default.address.create({ data: { ...data, userId } });
    }
    async updateAddress(userId, addressId, data) {
        const addr = await database_1.default.address.findFirst({ where: { id: addressId, userId } });
        if (!addr)
            throw new common_1.NotFoundException('地址不存在');
        if (data.isDefault) {
            await database_1.default.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        }
        return database_1.default.address.update({ where: { id: addressId }, data });
    }
    async deleteAddress(userId, addressId) {
        const addr = await database_1.default.address.findFirst({ where: { id: addressId, userId } });
        if (!addr)
            throw new common_1.NotFoundException('地址不存在');
        return database_1.default.address.delete({ where: { id: addressId } });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map