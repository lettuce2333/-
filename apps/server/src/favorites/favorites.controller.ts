import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  getUserFavorites(@CurrentUser('userId') userId: number, @Query() query: any) {
    return this.favoritesService.getUserFavorites(userId, query.page, query.pageSize);
  }

  @Post(':productId/toggle')
  toggleFavorite(@CurrentUser('userId') userId: number, @Param('productId') productId: string) {
    return this.favoritesService.toggleFavorite(userId, parseInt(productId));
  }

  @Get(':productId/check')
  checkFavorite(@CurrentUser('userId') userId: number, @Param('productId') productId: string) {
    return this.favoritesService.checkFavorite(userId, parseInt(productId));
  }
}
