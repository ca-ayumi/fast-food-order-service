import { ApiProperty } from '@nestjs/swagger';
import { IsCPF } from '../helpers/cpf-validator';

export class ClientDto {
  @ApiProperty({
    description: 'Name of the client',
    example: 'Maria',
  })
  name: string;

  @ApiProperty({
    description: 'CPF of the client',
    example: '123.456.789-10',
  })
  @IsCPF({ message: 'Invalid CPF' })
  cpf: string;

  @ApiProperty({
    description: 'Email of the client',
    example: 'maria.joao@example.com',
  })
  email: string;
}