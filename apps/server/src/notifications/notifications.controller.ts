import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser('userId') userId: number, @Query() query: any) {
    return this.notificationsService.getUserNotifications(userId, query.page, query.pageSize);
  }

  @Post(':id/read')
  markAsRead(@CurrentUser('userId') userId: number, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, parseInt(id));
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser('userId') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
