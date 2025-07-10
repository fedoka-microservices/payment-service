import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { NATS_SERVICE } from "src/config/services";


@Injectable()
export class OrdersServiceClient {
    private readonly logger = new Logger('orders-service-client');
    constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy){}
    
    async createPaymentSession(payload:any) {
        try {
            this.client.emit('payment.succeeded',payload)
        } catch(error) {
            this.logger.error(`error validating products: ${error}`);
            throw new RpcException(error)
        }
        
    }   
}