import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getCart(@CurrentUser('userId') userId: number, @Query('guestId') guestId?: string) {
    return this.cartService.getCart(userId, guestId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  addItem(@CurrentUser('userId') userId: number | undefined, @Body() body: any) {
    return this.cartService.addItem(userId, body.guestId, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  updateQuantity(@CurrentUser('userId') userId: number, @Param('id') id: string, @Body('quantity') quantity: number) {
    return this.cartService.updateQuantity(parseInt(id), quantity, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  removeItem(@CurrentUser('userId') userId: number, @Param('id') id: string) {
    return this.cartService.removeItem(parseInt(id), userId);
  }

  @Post('merge')
  @UseGuards(AuthGuard('jwt'))
  mergeCart(@CurrentUser('userId') userId: number, @Body('guestId') guestId: string) {
    return this.cartService.mergeGuestCart(guestId, userId);
  }
}
