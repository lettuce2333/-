"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const shops_service_1 = require("./shops.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
let ShopsController = class ShopsController {
    constructor(shopsService) {
        this.shopsService = shopsService;
    }
    getShop(id) {
        return this.shopsService.getShop(parseInt(id));
    }
    getMyShop(userId) {
        return this.shopsService.getShopByOwner(userId);
    }
    createShop(userId, body) {
        return this.shopsService.createShop(userId, body);
    }
    updateShop(userId, id, body) {
        return this.shopsService.updateShop(userId, parseInt(id), body);
    }
    getMembers(id) {
        return this.shopsService.getMembers(parseInt(id));
    }
    addMember(userId, id, body) {
        return this.shopsService.addMember(userId, parseInt(id), body);
    }
    getStats(shopId) {
        return this.shopsService.getShopStats(shopId);
    }
    getLogisticsTemplates(shopId) {
        return this.shopsService.getLogisticsTemplates(shopId);
    }
    createLogisticsTemplate(shopId, body) {
        return this.shopsService.createLogisticsTemplate(shopId, body);
    }
    updateLogisticsTemplate(shopId, id, body) {
        return this.shopsService.updateLogisticsTemplate(shopId, parseInt(id), body);
    }
    deleteLogisticsTemplate(shopId, id) {
        return this.shopsService.deleteLogisticsTemplate(shopId, parseInt(id));
    }
    removeMember(userId, shopId, memberId) {
        return this.shopsService.removeMember(userId, parseInt(shopId), parseInt(memberId));
    }
};
exports.ShopsController = ShopsController;
__decorate([
    (0, common_1.Get)('shops/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "getShop", null);
__decorate([
    (0, common_1.Get)('merchant/shop'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "getMyShop", null);
__decorate([
    (0, common_1.Post)('merchant/shop'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "createShop", null);
__decorate([
    (0, common_1.Put)('merchant/shop/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "updateShop", null);
__decorate([
    (0, common_1.Get)('merchant/shop/:id/members'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)('merchant/shop/:id/members'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)('merchant/stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('merchant/logistics-templates'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "getLogisticsTemplates", null);
__decorate([
    (0, common_1.Post)('merchant/logistics-templates'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "createLogisticsTemplate", null);
__decorate([
    (0, common_1.Put)('merchant/logistics-templates/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "updateLogisticsTemplate", null);
__decorate([
    (0, common_1.Delete)('merchant/logistics-templates/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "deleteLogisticsTemplate", null);
__decorate([
    (0, common_1.Delete)('merchant/shop/:shopId/members/:memberId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('shopId')),
    __param(2, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], ShopsController.prototype, "removeMember", null);
exports.ShopsController = ShopsController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [shops_service_1.ShopsService])
], ShopsController);
//# sourceMappingURL=shops.controller.js.map