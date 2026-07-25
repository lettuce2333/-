import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // User APIs
  @Post('orders')
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser('userId') userId: number, @Body() body: any) {
    return this.ordersService.create(userId, body);
  }

  @Get('orders')
  @UseGuards(AuthGuard('jwt'))
  getUserOrders(@CurrentUser('userId') userId: number, @Query() query: any) {
    return this.ordersService.getUserOrders(userId, query);
  }

  @Get('orders/:id')
  @UseGuards(AuthGuard('jwt'))
  getOrderDetail(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.ordersService.getOrderDetail(parseInt(id), userId);
  }

  @Post('orders/:id/pay')
  @UseGuards(AuthGuard('jwt'))
  pay(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.ordersService.pay(parseInt(id), userId);
  }

  @Post('orders/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  cancel(@Param('id') id: string, @CurrentUser('userId') userId: number, @Body('reason') reason?: string) {
    return this.ordersService.cancel(parseInt(id), userId, reason);
  }

  @Post('orders/:id/receive')
  @UseGuards(AuthGuard('jwt'))
  receive(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.ordersService.receive(parseInt(id), userId);
  }

  // Merchant APIs
  @Get('merchant/orders')
  @UseGuards(AuthGuard('jwt'))
  getShopOrders(@CurrentUser('shopId') shopId: number, @Query() query: any) {
    return this.ordersService.getShopOrders(shopId, query);
  }

  @Post('merchant/orders/:id/ship')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner', 'shop_warehouse')
  ship(@Param('id') id: string, @CurrentUser('shopId') shopId: number) {
    return this.ordersService.ship(parseInt(id), shopId);
  }
}
