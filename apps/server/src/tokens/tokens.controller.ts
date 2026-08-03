import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokensService } from './tokens.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/tokens')
@UseGuards(AuthGuard('jwt'))
export class TokensController {
  constructor(private tokensService: TokensService) {}

  @Get('me')
  getMe(@CurrentUser('userId') userId: number) {
    return this.tokensService.getMe(userId);
  }

  @Get('coupons')
  getCoupons(@CurrentUser('userId') userId: number) {
    return this.tokensService.getCoupons(userId);
  }

  @Post('redeem/coupon')
  redeemCoupon(@CurrentUser('userId') userId: number, @Body('amount') amount?: number) {
    return this.tokensService.redeemCoupon(userId, amount);
  }

  @Get('redeem/products')
  getRedeemableProducts() {
    return this.tokensService.getRedeemableProducts();
  }

  @Post('redeem/product')
  redeemProduct(@CurrentUser('userId') userId: number, @Body() body: any) {
    return this.tokensService.redeemProduct(userId, body.skuId, body.quantity);
  }

  @Get('redemptions')
  getRedemptions(@CurrentUser('userId') userId: number) {
    return this.tokensService.getRedemptions(userId);
  }
}
