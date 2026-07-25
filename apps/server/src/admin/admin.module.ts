import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OrdersModule } from '../orders/orders.module';
import { AfterSalesModule } from '../after-sales/after-sales.module';

@Module({
  imports: [OrdersModule, AfterSalesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
