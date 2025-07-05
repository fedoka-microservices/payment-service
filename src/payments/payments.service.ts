import { HttpStatus, Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSecretKey);
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
            success_url: 'http://localhost:3000/payments/success',
            cancel_url: 'http://localhost:3000/payments/cancel'
        });
        return session;
    }
    
    async getWebhook(request: Request, response:Response) {
        const signature = request.headers['stripe-signature'];
        if (!signature) {
            return response.status(400).send('⚠️  Missing Stripe signature header.');
        }
        let event: Stripe.Event;
        const endpointSecret = 'whsec_uILQpYdN3nPVVgShiz6V3o92wWRmdt45';
        try {
            event = this.stripe.webhooks.constructEvent(
                request['rawBody'],
                signature,
                endpointSecret
            );
        } catch (err) {
            return response.status(400).send(`⚠️  Webhook signature verification failed.`);
        }
        
        switch(event.type){
            case 'charge.succeeded':
                const chargeSucceded = event.data.object;
                console.log(chargeSucceded.metadata.orderId);
                break;
            default:
                console.log(`not a handled event`)
        }
        return response.status(200).json({signature})
    }
}
