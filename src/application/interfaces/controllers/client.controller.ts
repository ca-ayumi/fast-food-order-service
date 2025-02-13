import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ClientService } from '@domain/service/client.service';
import { ClientDto } from '@application/dto/client.dto';

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: 201,
    description: 'The client has been successfully created.',
    type: ClientDto,
  })
  async createClient(@Body() createClientDto: ClientDto): Promise<ClientDto> {
    try {
      return await this.clientService.createClient(createClientDto);
    } catch (error) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('cpf/:cpf')
  @ApiOperation({ summary: 'Get client by CPF' })
  @ApiResponse({
    status: 200,
    description: 'Client found',
    type: ClientDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'cpf', description: 'CPF of the client' })
  async getClientByCpf(@Param('cpf') cpf: string): Promise<ClientDto> {
    try {
      return await this.clientService.findClientByCpf(cpf);
    } catch (error) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, error: error.message },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
