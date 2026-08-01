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
exports.AfterSalesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const after_sales_service_1 = require("./after-sales.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
let AfterSalesController = class AfterSalesController {
    constructor(afterSalesService) {
        this.afterSalesService = afterSalesService;
    }
    apply(userId, body) {
        return this.afterSalesService.apply(userId, body);
    }
    getUserAfterSales(userId, query) {
        return this.afterSalesService.getUserAfterSales(userId, query.page, query.pageSize);
    }
    getDetail(id, userId) {
        return this.afterSalesService.getAfterSaleDetail(parseInt(id), userId);
    }
    dispute(id, userId) {
        return this.afterSalesService.dispute(parseInt(id), userId);
    }
    buyerShip(id, userId) {
        return this.afterSalesService.buyerShip(parseInt(id), userId);
    }
    getShopAfterSales(shopId, query) {
        return this.afterSalesService.getShopAfterSales(shopId, query);
    }
    approve(id, shopId) {
        return this.afterSalesService.shopApprove(parseInt(id), shopId);
    }
    refuse(id, shopId, remark) {
        return this.afterSalesService.shopRefuse(parseInt(id), shopId, remark);
    }
    receive(id, shopId) {
        return this.afterSalesService.shopReceive(parseInt(id), shopId);
    }
};
exports.AfterSalesController = AfterSalesController;
__decorate([
    (0, common_1.Post)('after-sales'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('after-sales'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "getUserAfterSales", null);
__decorate([
    (0, common_1.Get)('after-sales/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Post)('after-sales/:id/dispute'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "dispute", null);
__decorate([
    (0, common_1.Post)('after-sales/:id/ship'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "buyerShip", null);
__decorate([
    (0, common_1.Get)('merchant/after-sales'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "getShopAfterSales", null);
__decorate([
    (0, common_1.Post)('merchant/after-sales/:id/approve'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner', 'shop_cs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('merchant/after-sales/:id/refuse'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner', 'shop_cs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __param(2, (0, common_1.Body)('remark')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "refuse", null);
__decorate([
    (0, common_1.Post)('merchant/after-sales/:id/receive'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('shop_owner', 'shop_warehouse'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('shopId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AfterSalesController.prototype, "receive", null);
exports.AfterSalesController = AfterSalesController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [after_sales_service_1.AfterSalesService])
], AfterSalesController);
//# sourceMappingURL=after-sales.controller.js.map