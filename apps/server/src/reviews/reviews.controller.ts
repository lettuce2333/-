import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  getProductReviews(@Param('productId') productId: string, @Query() query: any) {
    return this.reviewsService.getProductReviews(parseInt(productId), query.page, query.pageSize);
  }

  @Post('reviews')
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser('userId') userId: number, @Body() body: any) {
    return this.reviewsService.createReview(userId, body);
  }

  @Get('reviews')
  @UseGuards(AuthGuard('jwt'))
  getUserReviews(@CurrentUser('userId') userId: number, @Query() query: any) {
    return this.reviewsService.getUserReviews(userId, query.page, query.pageSize);
  }

  @Get('merchant/reviews')
  @UseGuards(AuthGuard('jwt'))
  getShopReviews(@CurrentUser('shopId') shopId: number, @Query() query: any) {
    return this.reviewsService.getShopReviews(shopId, query.page, query.pageSize);
  }

  @Post('merchant/reviews/:id/reply')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner', 'shop_cs')
  reply(@CurrentUser('shopId') shopId: number, @Param('id') id: string, @Body('content') content: string) {
    return this.reviewsService.replyReview(shopId, parseInt(id), content);
  }
}
