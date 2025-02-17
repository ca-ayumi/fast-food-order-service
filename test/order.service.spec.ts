import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from '@domain/service/order.service';
import { Product } from '@domain/entities/product.entity';
import { Client } from '@domain/entities/client.entity';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { OrderDto } from '@application/dto/order.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<Order>;
  let clientRepository: Repository<Client>;
  let productRepository: Repository<Product>;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockOrderRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockClientRepository = {
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: getRepositoryToken(Client), useValue: mockClientRepository },
        { provide: getRepositoryToken(Product), useValue: mockProductRepository },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    clientRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an order successfully', async () => {
    const client = { id: 'client-123' } as Client;
    const products = [{ id: 'product-123', price: 50 }] as Product[];
    const order = {
      id: 'order-123',
      client,
      product: products,
      totalAmount: 50,
      status: OrderStatus.RECEIVED,
    } as Order;

    mockClientRepository.findOne.mockResolvedValue(client);
    mockProductRepository.find.mockResolvedValue(products);
    mockOrderRepository.save.mockResolvedValue(order);
    mockHttpService.post.mockReturnValueOnce(of({ data: { qrCode: 'mock-qrcode' } }));

    const result = await service.createOrder('client-123', ['product-123'], 50);
    expect(result).toHaveProperty('orderId', 'order-123');
    expect(result).toHaveProperty('qrCode', 'mock-qrcode');
  });

  it('should throw NotFoundException if client does not exist', async () => {
    mockClientRepository.findOne.mockResolvedValue(null);

    await expect(service.createOrder('invalid-client', ['product-123'], 50)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if products do not exist', async () => {
    mockClientRepository.findOne.mockResolvedValue({ id: 'client-123' } as Client);
    mockProductRepository.find.mockResolvedValue([]);

    await expect(service.createOrder('client-123', ['product-123'], 50)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update order status successfully', async () => {
    const order = { id: 'order-123', status: OrderStatus.RECEIVED } as Order;
    mockOrderRepository.findOne.mockResolvedValue(order);
    mockOrderRepository.save.mockResolvedValue({ ...order, status: OrderStatus.PREPARING });

    const result = await service.updateOrderStatus('order-123', OrderStatus.PREPARING);
    expect(result.status).toEqual(OrderStatus.PREPARING);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    mockOrderRepository.findOne.mockResolvedValue(null);

    await expect(service.updateOrderStatus('invalid-id', OrderStatus.PREPARING)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should get orders by status', async () => {
    const orders = [{ id: 'order-123', status: OrderStatus.RECEIVED }] as Order[];
    mockOrderRepository.find.mockResolvedValue(orders);

    const result = await service.getOrdersByStatus(OrderStatus.RECEIVED);
    expect(result).toEqual(orders);
  });

  it('should throw BadRequestException if status is invalid', async () => {
    await expect(service.getOrdersByStatus('INVALID_STATUS' as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if updating with an invalid status', async () => {
    const order = { id: 'order-123', status: OrderStatus.RECEIVED } as Order;
    mockOrderRepository.findOne.mockResolvedValue(order);

    await expect(service.updateOrderStatus('order-123', 'INVALID_STATUS' as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if order save fails', async () => {
    const client = { id: 'client-123' } as Client;
    const products = [{ id: 'product-123', price: 50 }] as Product[];

    mockClientRepository.findOne.mockResolvedValue(client);
    mockProductRepository.find.mockResolvedValue(products);
    mockOrderRepository.save.mockRejectedValue(new Error('DB Error'));

    await expect(service.createOrder('client-123', ['product-123'], 50)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if updating order status fails', async () => {
    const order = { id: 'order-123', status: OrderStatus.RECEIVED } as Order;

    mockOrderRepository.findOne.mockResolvedValue(order);
    mockOrderRepository.save.mockRejectedValue(new Error('DB Error'));

    await expect(service.updateOrderStatus('order-123', OrderStatus.PREPARING)).rejects.toThrow(
      BadRequestException,
    );
  });
});
