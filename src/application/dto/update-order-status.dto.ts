import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status for the order',
    enum: ['Pronto', 'Em Preparação', 'Recebido', 'Finalizado'],
    example: 'Recebido',
  })
  @IsEnum(['Pronto', 'Em Preparação', 'Recebido', 'Finalizado'])
  status: 'Pronto' | 'Em Preparação' | 'Recebido' | 'Finalizado';
}
