import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@domain/entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status for the order',
    enum: Object.values(OrderStatus),
    example: OrderStatus.RECEIVED,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
