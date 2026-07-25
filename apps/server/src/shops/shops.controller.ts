import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShopsService } from './shops.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get('shops/:id')
  getShop(@Param('id') id: string) {
    return this.shopsService.getShop(parseInt(id));
  }

  @Get('merchant/shop')
  @UseGuards(AuthGuard('jwt'))
  getMyShop(@CurrentUser('userId') userId: number) {
    return this.shopsService.getShopByOwner(userId);
  }

  @Post('merchant/shop')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  createShop(@CurrentUser('userId') userId: number, @Body() body: any) {
    return this.shopsService.createShop(userId, body);
  }

  @Put('merchant/shop/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  updateShop(@CurrentUser('userId') userId: number, @Param('id') id: string, @Body() body: any) {
    return this.shopsService.updateShop(userId, parseInt(id), body);
  }

  @Get('merchant/shop/:id/members')
  @UseGuards(AuthGuard('jwt'))
  getMembers(@Param('id') id: string) {
    return this.shopsService.getMembers(parseInt(id));
  }

  @Post('merchant/shop/:id/members')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  addMember(@CurrentUser('userId') userId: number, @Param('id') id: string, @Body() body: any) {
    return this.shopsService.addMember(userId, parseInt(id), body);
  }

  @Get('merchant/stats')
  @UseGuards(AuthGuard('jwt'))
  getStats(@CurrentUser('shopId') shopId: number) {
    return this.shopsService.getShopStats(shopId);
  }

  @Delete('merchant/shop/:shopId/members/:memberId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  removeMember(@CurrentUser('userId') userId: number, @Param('shopId') shopId: string, @Param('memberId') memberId: string) {
    return this.shopsService.removeMember(userId, parseInt(shopId), parseInt(memberId));
  }
}
