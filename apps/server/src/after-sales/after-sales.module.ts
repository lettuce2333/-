import { Module } from '@nestjs/common';
import { AfterSalesController } from './after-sales.controller';
import { AfterSalesService } from './after-sales.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AfterSalesController],
  providers: [AfterSalesService],
  exports: [AfterSalesService],
})
export class AfterSalesModule {}
