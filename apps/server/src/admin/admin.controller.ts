import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AfterSalesService } from '../after-sales/after-sales.service';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('super_admin', 'business_admin', 'cs_admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private afterSalesService: AfterSalesService,
  ) {}

  @Get('stats')
  getStats() { return this.adminService.getStats(); }

  @Get('users')
  getUsers(@Query() query: any) { return this.adminService.getUsers(query); }

  @Post('users/:id/toggle-status')
  toggleUserStatus(@Param('id') id: string) { return this.adminService.toggleUserStatus(parseInt(id)); }

  @Get('shops')
  getShops(@Query() query: any) { return this.adminService.getShops(query); }

  @Post('shops/:id/approve')
  approveShop(@Param('id') id: string) { return this.adminService.approveShop(parseInt(id)); }

  @Post('shops/:id/reject')
  rejectShop(@Param('id') id: string) { return this.adminService.rejectShop(parseInt(id)); }

  @Get('products')
  getProducts(@Query() query: any) { return this.adminService.getProductsForReview(query); }

  @Post('products/:id/review')
  reviewProduct(@Param('id') id: string, @Body('action') action: string) { return this.adminService.reviewProduct(parseInt(id), action); }

  @Get('categories')
  getCategories() { return this.adminService['findAll']?.(); }

  @Post('categories')
  createCategory(@Body() body: any) { return this.adminService.createCategory(body); }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: any) { return this.adminService.updateCategory(parseInt(id), body); }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) { return this.adminService.deleteCategory(parseInt(id)); }

  @Get('after-sales/pending')
  getPendingArbitrations(@Query() query: any) { return this.adminService.getPendingArbitrations(query.page, query.pageSize); }

  @Post('after-sales/:id/arbitrate')
  arbitrate(@Param('id') id: string, @CurrentUser('userId') userId: number, @Body() body: any) {
    return this.afterSalesService.adminArbitrate(parseInt(id), userId, body.decision, body.remark);
  }
}
