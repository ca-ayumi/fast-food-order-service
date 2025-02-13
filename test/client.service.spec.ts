import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClientService } from '@domain/service/client.service';
import { Client } from '@domain/entities/client.entity';
import { ClientDto } from '@application/dto/client.dto';

describe('ClientService', () => {
  let service: ClientService;
  let clientRepository: Repository<Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    clientRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new client', async () => {
    const clientDto: ClientDto = {
      name: 'John Doe',
      cpf: '12345678900',
      email: 'john@example.com',
    };

    jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);
    jest.spyOn(clientRepository, 'create').mockReturnValue(clientDto as Client);
    jest.spyOn(clientRepository, 'save').mockResolvedValue(clientDto as Client);

    const result = await service.createClient(clientDto);
    expect(result).toEqual(clientDto);
  });

  it('should throw an error if CPF is already registered', async () => {
    const clientDto: ClientDto = {
      name: 'John Doe',
      cpf: '12345678900',
      email: 'john@example.com',
    };

    jest.spyOn(clientRepository, 'findOne').mockResolvedValue(clientDto as Client);

    await expect(service.createClient(clientDto)).rejects.toThrow(BadRequestException);
  });

  it('should find a client by CPF', async () => {
    const client: Client = {
      id: 'uuid-123',
      name: 'John Doe',
      cpf: '12345678900',
      email: 'john@example.com',
      formatCPF: () => {},
    };

    jest.spyOn(clientRepository, 'findOne').mockResolvedValue(client);

    const result = await service.findClientByCpf('12345678900');
    expect(result).toEqual(client);
  });
});
