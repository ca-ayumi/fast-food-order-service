import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Order } from '../../domain/entities/order.entity';
import { Client } from '../../domain/entities/client.entity';
import { Product } from '../../domain/entities/product.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Order, Client, Product],
  synchronize: false,
  logging: true,
};
