import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from '@domain/service/order.service';
import { Product } from '@domain/entities/product.entity';
import { Client } from '@domain/entities/client.entity';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { OrderDto } from '@application/dto/order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<Order>;
  let clientRepository: Repository<Client>;
  let productRepository: Repository<Product>;

  const mockOrderRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockClientRepository = {
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useClass: Repository },
        { provide: getRepositoryToken(Client), useClass: Repository },
        { provide: getRepositoryToken(Product), useClass: Repository },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    clientRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should create an order', async () => {
    const client = { id: 'client-123' } as Client;
    const products = [{ id: 'product-123' }] as Product[];
    const order = {
      id: 'order-123',
      client,
      product: products,
      totalAmount: 100,
      status: OrderStatus.RECEIVED,
    } as Order;

    jest.spyOn(clientRepository, 'findOne').mockResolvedValue(client);
    jest.spyOn(productRepository, 'findByIds').mockResolvedValue(products);
    jest.spyOn(orderRepository, 'save').mockResolvedValue(order);

    const result = await service.createOrder('client-123', ['product-123'], 100);
    expect(result).toEqual(order);
  });

  it('should throw an error if client does not exist', async () => {
    jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);

    await expect(service.createOrder('invalid-client', ['product-123'], 100)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw an error if products do not exist', async () => {
    jest.spyOn(clientRepository, 'findOne').mockResolvedValue({ id: 'client-123' } as Client);
    jest.spyOn(productRepository, 'findByIds').mockResolvedValue([]);

    await expect(service.createOrder('client-123', ['product-123'], 100)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update order status', async () => {
    const order = { id: 'order-123', status: OrderStatus.RECEIVED } as Order;
    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order);
    jest.spyOn(orderRepository, 'save').mockResolvedValue(order);

    const result = await service.updateOrderStatus('order-123', OrderStatus.PREPARING);
    expect(result.status).toEqual(OrderStatus.PREPARING);
  });

  it('should throw an error if order does not exist', async () => {
    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

    await expect(service.updateOrderStatus('invalid-id', OrderStatus.PREPARING)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if some products are not found', async () => {
    jest.spyOn(clientRepository, 'findOne').mockResolvedValue({ id: 'client-123' } as Client);

    jest.spyOn(productRepository, 'findByIds').mockResolvedValue([{ id: 'product-123' }] as Product[]);

    await expect(service.createOrder('client-123', ['product-123', 'product-456'], 100)).rejects.toThrow(
      NotFoundException,
    );

    expect(clientRepository.findOne).toHaveBeenCalledWith({ where: { id: 'client-123' } });
    expect(productRepository.findByIds).toHaveBeenCalledWith(['product-123', 'product-456']);
  });

  it('should list all orders', async () => {
    const orders: Order[] = [
      {
        id: 'order-123',
        client: { id: 'client-123' } as Client,
        product: [{ id: 'product-123' }] as Product[],
        totalAmount: 100,
        status: OrderStatus.RECEIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    jest.spyOn(orderRepository, 'find').mockResolvedValue(orders);

    const result = await service.listOrders();
    expect(result).toEqual(orders.map((order) => new OrderDto(order)));

    expect(orderRepository.find).toHaveBeenCalledWith({
      where: { status: In(['Pronto', 'Em Preparação', 'Recebido']) },
      relations: ['client', 'product'],
      order: { createdAt: 'ASC' },
    });
  });

  it('should throw BadRequestException if no orders exist', async () => {
    jest.spyOn(orderRepository, 'find').mockResolvedValue([]);

    await expect(service.listOrders()).rejects.toThrow(BadRequestException);

    expect(orderRepository.find).toHaveBeenCalled();
  });

  it('should throw BadRequestException if fetching orders fails', async () => {
    jest.spyOn(orderRepository, 'find').mockRejectedValue(new Error('DB Error'));

    await expect(service.listOrders()).rejects.toThrow(BadRequestException);

    expect(orderRepository.find).toHaveBeenCalled();
  });

  it('should throw BadRequestException if order update status is invalid', async () => {
    const order = {
      id: 'order-123',
      status: OrderStatus.RECEIVED,
    } as Order;

    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order);

    await expect(service.updateOrderStatus('order-123', 'InvalidStatus' as any)).rejects.toThrow(
      BadRequestException,
    );

    expect(orderRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'order-123' },
      relations: ['client', 'product'],
    });
  });

  it('should log error and throw BadRequestException if order creation fails', async () => {
    jest.spyOn(clientRepository, 'findOne').mockResolvedValue({ id: 'client-123' } as Client);
    jest.spyOn(productRepository, 'findByIds').mockResolvedValue([{ id: 'product-123' }] as Product[]);
    jest.spyOn(orderRepository, 'save').mockRejectedValue(new Error('DB Error'));
    const loggerSpy = jest.spyOn(service['logger'], 'error');

    await expect(service.createOrder('client-123', ['product-123'], 100)).rejects.toThrow(BadRequestException);

    expect(loggerSpy).toHaveBeenCalledWith('Failed to create order: DB Error');
  });

  it('should throw BadRequestException if fetching an order fails', async () => {
    jest.spyOn(orderRepository, 'findOne').mockRejectedValue(new Error('DB Error'));

    await expect(service.getOrderById('order-123')).rejects.toThrow(BadRequestException);
  });

  it('should log error and throw BadRequestException if updating order status fails', async () => {
    const order = { id: 'order-123', status: OrderStatus.RECEIVED } as Order;

    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order);
    jest.spyOn(orderRepository, 'save').mockRejectedValue(new Error('DB Error'));
    const loggerSpy = jest.spyOn(service['logger'], 'error');

    await expect(service.updateOrderStatus('order-123', OrderStatus.PREPARING)).rejects.toThrow(BadRequestException);

    expect(loggerSpy).toHaveBeenCalledWith('Failed to update order status: DB Error');
  });

  it('should throw NotFoundException if order is not found', async () => {
    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

    await expect(service.getOrderById('invalid-order')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if the order has no associated client', async () => {
    const orderId = 'order-123';
    const now = new Date();
    const orderWithoutClient = {
      id: orderId,
      client: null,
      product: [{ id: 'prod-uuid1' }] as Product[],
      totalAmount: 100,
      status: OrderStatus.RECEIVED,
      createdAt: now,
      updatedAt: now,
    } as Order;

    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(orderWithoutClient);
    const loggerSpy = jest.spyOn(service['logger'], 'error');

    await expect(service.getOrderById(orderId)).rejects.toThrow(BadRequestException);
    expect(loggerSpy).toHaveBeenCalledWith(`Order ${orderId} does not have an associated client`);
  });
});
