import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Post('create-payment-session')
  @MessagePattern('create.payment.session')
  createPaymentSession(@Payload() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success(){
    return {
      ok: true,
      message:'Payment successful'
    }
  }

  @Get('cancel')
  cancel(){
    return {
      ok:false,
      message: 'payment cancelled'
    }
  }

  @Post('webhook')
  async stripeWebhook (@Req() req:Request, @Res() res:Response) {
    return this.paymentsService.getWebhook(req, res);
  }
}
