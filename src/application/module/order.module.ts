import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@domain/entities/product.entity';
import { OrderController } from '@application/interfaces/controllers/order.controller';
import { OrderService } from '@domain/service/order.service';
import { Client } from '@domain/entities/client.entity';
import { Order } from '@domain/entities/order.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Order,Client,Product]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
