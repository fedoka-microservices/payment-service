import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('payment-service');
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
        whitelist:true,
        forbidNonWhitelisted:true
      })
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options:{
      servers:envs.natsServers
    },
  }, 
  {
      inheritAppConfig: true,
  })
  await app.startAllMicroservices();
  await app.listen(envs.port);
  logger.log(`payment-service running on port ${envs.port}`);
}
bootstrap();
