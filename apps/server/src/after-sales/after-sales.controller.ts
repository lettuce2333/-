import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AfterSalesService } from './after-sales.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api')
export class AfterSalesController {
  constructor(private afterSalesService: AfterSalesService) {}

  // User APIs
  @Post('after-sales')
  @UseGuards(AuthGuard('jwt'))
  apply(@CurrentUser('userId') userId: number, @Body() body: any) {
    return this.afterSalesService.apply(userId, body);
  }

  @Get('after-sales')
  @UseGuards(AuthGuard('jwt'))
  getUserAfterSales(@CurrentUser('userId') userId: number, @Query() query: any) {
    return this.afterSalesService.getUserAfterSales(userId, query.page, query.pageSize);
  }

  @Get('after-sales/:id')
  @UseGuards(AuthGuard('jwt'))
  getDetail(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.afterSalesService.getAfterSaleDetail(parseInt(id), userId);
  }

  @Post('after-sales/:id/dispute')
  @UseGuards(AuthGuard('jwt'))
  dispute(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.afterSalesService.dispute(parseInt(id), userId);
  }

  @Post('after-sales/:id/ship')
  @UseGuards(AuthGuard('jwt'))
  buyerShip(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.afterSalesService.buyerShip(parseInt(id), userId);
  }

  // Merchant APIs
  @Get('merchant/after-sales')
  @UseGuards(AuthGuard('jwt'))
  getShopAfterSales(@CurrentUser('shopId') shopId: number, @Query() query: any) {
    return this.afterSalesService.getShopAfterSales(shopId, query);
  }

  @Post('merchant/after-sales/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner', 'shop_cs')
  approve(@Param('id') id: string, @CurrentUser('shopId') shopId: number) {
    return this.afterSalesService.shopApprove(parseInt(id), shopId);
  }

  @Post('merchant/after-sales/:id/refuse')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner', 'shop_cs')
  refuse(@Param('id') id: string, @CurrentUser('shopId') shopId: number, @Body('remark') remark?: string) {
    return this.afterSalesService.shopRefuse(parseInt(id), shopId, remark);
  }

  @Post('merchant/after-sales/:id/receive')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner', 'shop_warehouse')
  receive(@Param('id') id: string, @CurrentUser('shopId') shopId: number) {
    return this.afterSalesService.shopReceive(parseInt(id), shopId);
  }
}
