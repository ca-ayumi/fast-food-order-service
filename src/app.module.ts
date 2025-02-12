import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderService } from './domain/service/order.service';
import { ProductService } from './domain/service/product.service';
import { ClientService } from './domain/service/client.service';
import { OrderController } from './application/interfaces/controllers/order.controller';
import { ProductController } from './application/interfaces/controllers/product.controller';
import { ClientController } from './application/interfaces/controllers/client.controller';
import { Client } from './domain/entities/client.entity';
import { Product } from './domain/entities/product.entity';
import { Order } from './domain/entities/order.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Client, Product, Order],
        synchronize: false,
        migrations: ['src/migration/*.ts'],
        cli: {
          migrationsDir: 'src/migration',
        },
      }),
    }),
    TypeOrmModule.forFeature([Client, Product, Order]),
    HttpModule,
  ],
  controllers: [
    ClientController,
    ProductController,
    OrderController,
  ],
  providers: [
    ClientService,
    ProductService,
    OrderService,
  ],
})
export class AppModule {}
