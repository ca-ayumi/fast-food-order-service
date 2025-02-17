import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from '@domain/service/client.service';
import { ClientDto } from '@application/dto/client.dto';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ClientController } from '@application/interfaces/controllers/client.controller';

describe('ClientController', () => {
  let clientController: ClientController;

  const mockClientService = {
    createClient: jest.fn(),
    findClientByCpf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [{ provide: ClientService, useValue: mockClientService }],
    }).compile();

    clientController = module.get<ClientController>(ClientController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a new client successfully', async () => {
      const clientDto: ClientDto = {
        name: 'John Doe',
        cpf: '12345678901',
        email: 'john@example.com',
      };

      mockClientService.createClient.mockResolvedValue(clientDto);

      const result = await clientController.createClient(clientDto);
      expect(result).toEqual(clientDto);
      expect(mockClientService.createClient).toHaveBeenCalledWith(clientDto);
    });

    it('should throw HttpException if client creation fails', async () => {
      const clientDto: ClientDto = {
        name: 'John Doe',
        cpf: '12345678901',
        email: 'john@example.com',
      };

      mockClientService.createClient.mockRejectedValue(new Error('CPF already registered'));

      await expect(clientController.createClient(clientDto)).rejects.toThrow(HttpException);
      await expect(clientController.createClient(clientDto)).rejects.toThrow(
        new HttpException(
          { status: HttpStatus.BAD_REQUEST, error: 'CPF already registered' },
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('getClientByCpf', () => {
    it('should return client data when CPF exists', async () => {
      const clientDto: ClientDto = {
        name: 'John Doe',
        cpf: '12345678901',
        email: 'john@example.com',
      };

      mockClientService.findClientByCpf.mockResolvedValue(clientDto);

      const result = await clientController.getClientByCpf('12345678901');
      expect(result).toEqual(clientDto);
      expect(mockClientService.findClientByCpf).toHaveBeenCalledWith('12345678901');
    });

    it('should throw HttpException if client is not found', async () => {
      mockClientService.findClientByCpf.mockRejectedValue(new NotFoundException('Client not found'));

      await expect(clientController.getClientByCpf('00000000000')).rejects.toThrow(HttpException);
      await expect(clientController.getClientByCpf('00000000000')).rejects.toThrow(
        new HttpException(
          { status: HttpStatus.NOT_FOUND, error: 'Client not found' },
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });
});
