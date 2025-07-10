import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { NatsModule } from 'src/transports/nats.module';
import { OrdersServiceClient } from 'src/clients/order-service.client';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, OrdersServiceClient],
  imports:[NatsModule]
})
export class PaymentsModule {}
