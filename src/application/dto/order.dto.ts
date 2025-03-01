import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, IsNotEmpty, IsEnum } from 'class-validator';
import { Product } from '@domain/entities/product.entity';
import { ProductResponseDto } from '@application/dto/product-response.dto';
import { Order, OrderStatus } from '@domain/entities/order.entity';

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
    description: 'Total amount of the order',
    example: 100,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Status of the order',
    enum: OrderStatus,
    example: 'Recebido',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  constructor(order: Order) {
    this.id = order.id;
    this.clientId = order.client?.id ?? 'UNKNOWN_CLIENT_ID';
    this.product = order.product;
    this.totalAmount = order.totalAmount;
    this.status = order.status;
  }
}
