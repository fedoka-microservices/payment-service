import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { OrdersServiceClient } from 'src/clients/order-service.client';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSecretKey);
    private readonly logger = new Logger('payment-service');
    constructor(private readonly ordersServiceClient:OrdersServiceClient) {}
    async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
        const {currency, items, orderId} = paymentSessionDto;
        const lineItems = items.map(({name, price, quantity})=> {
            return {
                    price_data:{
                        currency,
                        product_data:{
                            name
                        },
                        unit_amount: Math.round(price * 100) ,
                    },
                    quantity,
                }
        })
        const session = await this.stripe.checkout.sessions.create({
            payment_intent_data: {
                metadata:{
                    orderId
                }
            },
            line_items:lineItems,
            mode:'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl
        });
        return {
            cancelUrl: session.cancel_url,
            successUrl: session.success_url,
            url: session.url,
        };
    }

    async getWebhook(request: Request, response:Response) {
        const signature = request.headers['stripe-signature'];
        if (!signature) {
            return response.status(400).send('⚠️  Missing Stripe signature header.');
        }
        let event: Stripe.Event;
        
        try {
            event = this.stripe.webhooks.constructEvent(
                request['rawBody'],
                signature,
                envs.stripeEndpointSecret
            );
        } catch (err) {
            return response.status(400).send(`⚠️  Webhook signature verification failed.`);
        }
        
        switch(event.type){
            case 'charge.succeeded':
                const chargeSucceded = event.data.object;
                if (chargeSucceded.paid) {
                    const payload = {
                        stripePaymentId: chargeSucceded.id,
                        orderId: +chargeSucceded.metadata.orderId,
                        receiptUrl: chargeSucceded.receipt_url,
                        created: chargeSucceded.created,
                    }
                    this.ordersServiceClient.createPaymentSession(payload);
                }
                break;
            default:
                console.log(`not a handled event`)
        }
        return response.status(200).json({signature})
    }
}
