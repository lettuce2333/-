import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('products')
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get('products/:id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(parseInt(id));
  }

  @Get('merchant/products')
  @UseGuards(AuthGuard('jwt'))
  getShopProducts(@CurrentUser('shopId') shopId: number, @Query() query: any) {
    return this.productsService.getShopProducts(shopId, query);
  }

  @Post('merchant/products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  create(@CurrentUser('userId') userId: number, @CurrentUser('shopId') shopId: number, @Body() body: any) {
    return this.productsService.createProduct(shopId, userId, body);
  }

  @Put('merchant/products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  update(@CurrentUser('userId') userId: number, @CurrentUser('shopId') shopId: number, @Param('id') id: string, @Body() body: any) {
    return this.productsService.updateProduct(shopId, userId, parseInt(id), body);
  }

  @Post('merchant/products/:id/submit')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner')
  submit(@CurrentUser('userId') userId: number, @CurrentUser('shopId') shopId: number, @Param('id') id: string) {
    return this.productsService.submitForReview(shopId, userId, parseInt(id));
  }
}
