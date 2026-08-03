import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourtService } from './court.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api')
export class CourtController {
  constructor(private courtService: CourtService) {}

  @Post('after-sales/:id/court-open')
  @UseGuards(AuthGuard('jwt'))
  buyerOpen(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.courtService.buyerOpen(parseInt(id), userId);
  }

  @Post('merchant/after-sales/:id/court-open')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('shop_owner', 'shop_cs')
  merchantOpen(@Param('id') id: string, @CurrentUser('shopId') shopId: number) {
    return this.courtService.merchantOpen(parseInt(id), shopId);
  }

  @Get('court/lobby')
  @UseGuards(AuthGuard('jwt'))
  lobby(@Query() query: any) {
    return this.courtService.lobby(query.page ? parseInt(query.page) : 1, query.pageSize ? parseInt(query.pageSize) : 20);
  }

  @Get('court/my')
  @UseGuards(AuthGuard('jwt'))
  myCases(@CurrentUser('userId') userId: number, @CurrentUser('shopId') shopId?: number) {
    return this.courtService.myCases(userId, shopId);
  }

  @Get('court/:id')
  @UseGuards(AuthGuard('jwt'))
  detail(@Param('id') id: string, @CurrentUser('userId') userId: number) {
    return this.courtService.detail(parseInt(id), userId);
  }

  @Post('court/:id/evidence')
  @UseGuards(AuthGuard('jwt'))
  submitEvidence(@Param('id') id: string, @CurrentUser('userId') userId: number, @Body() body: any) {
    return this.courtService.submitEvidence(parseInt(id), userId, body);
  }

  @Post('court/:id/vote')
  @UseGuards(AuthGuard('jwt'))
  vote(@Param('id') id: string, @CurrentUser('userId') userId: number, @Body() body: any) {
    return this.courtService.vote(parseInt(id), userId, body.side, body.comment);
  }

  @Get('admin/court/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin', 'business_admin', 'cs_admin')
  adminReviewList(@Query() query: any) {
    return this.courtService.adminReviewList(query.page ? parseInt(query.page) : 1, query.pageSize ? parseInt(query.pageSize) : 20);
  }

  @Post('admin/court/:id/decision')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('super_admin', 'business_admin', 'cs_admin')
  adminDecision(@Param('id') id: string, @Body() body: any) {
    return this.courtService.adminDecision(parseInt(id), body.decision, body.remark);
  }
}
