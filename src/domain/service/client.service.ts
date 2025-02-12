import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientDto } from '../../application/dto/client.dto';
import { Client } from '../entities/client.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async createClient(createClientDto: ClientDto): Promise<Client> {
    const formattedCpf = createClientDto.cpf.replace(/\D/g, '');

    const existingClient = await this.clientRepository.findOne({
      where: { cpf: formattedCpf },
    });
    if (existingClient) {
      throw new BadRequestException('CPF already registered');
    }

    const client = this.clientRepository.create({
      ...createClientDto,
      cpf: formattedCpf,
    });
    return this.clientRepository.save(client);
  }

  async findClientByCpf(cpf: string): Promise<Client | undefined> {
    return await this.clientRepository.findOne({ where: { cpf } });
  }
}
