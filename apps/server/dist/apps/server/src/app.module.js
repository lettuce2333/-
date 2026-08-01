"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const categories_module_1 = require("./categories/categories.module");
const products_module_1 = require("./products/products.module");
const shops_module_1 = require("./shops/shops.module");
const cart_module_1 = require("./cart/cart.module");
const orders_module_1 = require("./orders/orders.module");
const after_sales_module_1 = require("./after-sales/after-sales.module");
const reviews_module_1 = require("./reviews/reviews.module");
const admin_module_1 = require("./admin/admin.module");
const notifications_module_1 = require("./notifications/notifications.module");
const upload_module_1 = require("./upload/upload.module");
const favorites_module_1 = require("./favorites/favorites.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            categories_module_1.CategoriesModule,
            products_module_1.ProductsModule,
            shops_module_1.ShopsModule,
            cart_module_1.CartModule,
            orders_module_1.OrdersModule,
            after_sales_module_1.AfterSalesModule,
            reviews_module_1.ReviewsModule,
            admin_module_1.AdminModule,
            notifications_module_1.NotificationsModule,
            upload_module_1.UploadModule,
            favorites_module_1.FavoritesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map