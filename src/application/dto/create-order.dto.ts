import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID do cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'IDs dos produtos', example: ['123', '456'] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsNotEmpty()
  productIds: string[];

  @ApiProperty({ description: 'Valor total do pedido', example: 100.5 })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;
}
