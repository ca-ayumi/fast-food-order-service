import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, IsNotEmpty, IsEnum } from 'class-validator';
import { Product } from '../../domain/entities/product.entity';
import { Order, OrderStatus } from 'src/domain/entities/order.entity';
import { ProductResponseDto } from './product-response.dto';

export class OrderDto {
  @ApiProperty({
    description: 'ID of the order',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'ID of the client',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Products in the order',
    type: [ProductResponseDto],
  })
  @IsArray()
  @IsNotEmpty()
  product: Product[];

  @ApiProperty({
    description: 'Status of the order',
    enum: OrderStatus,
    example: 'Recebido',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  constructor(order: Order) {
    this.id = order.id;
    this.clientId = order.client.id;
    this.product = order.product;
    this.status = order.status;
  }
}
