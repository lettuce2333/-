"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@zuoye/database");
let CategoriesService = class CategoriesService {
    async findAll() {
        return database_1.default.category.findMany({ orderBy: { sort: 'asc' }, include: { children: { orderBy: { sort: 'asc' } } } });
    }
    async getTree() {
        const cats = await database_1.default.category.findMany({
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
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)()
], CategoriesService);
//# sourceMappingURL=categories.service.js.map