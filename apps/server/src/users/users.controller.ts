import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('addresses')
  getAddresses(@CurrentUser('userId') userId: number) {
    return this.usersService.getAddresses(userId);
  }

  @Post('addresses')
  createAddress(@CurrentUser('userId') userId: number, @Body() body: any) {
    return this.usersService.createAddress(userId, body);
  }

  @Put('addresses/:id')
  updateAddress(@CurrentUser('userId') userId: number, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updateAddress(userId, parseInt(id), body);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser('userId') userId: number, @Param('id') id: string) {
    return this.usersService.deleteAddress(userId, parseInt(id));
  }
}
