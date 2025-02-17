import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { ProductCategory } from '@domain/entities/product.entity';
import { OrderController } from '@application/interfaces/controllers/order.controller';
import { OrderService } from '@domain/service/order.service';
import { OrderDto } from '@application/dto/order.dto';
import { CreateOrderResponseDto } from '@application/dto/create-order-response.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: Partial<Record<keyof OrderService, jest.Mock>>;

  const testClient = {
    id: 'client-uuid',
    name: 'Test Client',
    cpf: '12345678900',
    email: 'test@example.com',
    formatCPF: () => '12345678900',
  };

  const testProduct = {
    id: 'prod-uuid1',
    name: 'Test Product',
    description: 'A test product',
    price: 12.34,
    category: ProductCategory.Lanches,
    imageUrl: 'https://example.com/test.jpg',
  };

  beforeEach(async () => {
    orderService = {
      createOrder: jest.fn(),
      updateOrderStatus: jest.fn(),
      getOrdersByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  describe('createOrder', () => {
    const createOrderDto = {
      clientId: testClient.id,
      productIds: ['prod-uuid1'],
      totalAmount: 100,
    };

    it('should create an order and return QR code', async () => {
      const response = new CreateOrderResponseDto('order-uuid', 'mock-qrcode');
      (orderService.createOrder as jest.Mock).mockResolvedValue(response);

      const result = await controller.createOrder(createOrderDto);
      expect(result).toEqual(response);
      expect(orderService.createOrder).toHaveBeenCalledWith(
        createOrderDto.clientId,
        createOrderDto.productIds,
        createOrderDto.totalAmount,
      );
    });

    it('should return 404 if client not found', async () => {
      (orderService.createOrder as jest.Mock).mockRejectedValue(
        new NotFoundException('Client not found'),
      );

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(HttpException);
      try {
        await controller.createOrder(createOrderDto);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return 400 if invalid request', async () => {
      (orderService.createOrder as jest.Mock).mockRejectedValue(
        new BadRequestException('Invalid request'),
      );

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(HttpException);
    });
  });

  describe('updateOrderStatus', () => {
    const orderId = 'order-uuid';
    const updateOrderStatusDto = { status: OrderStatus.PREPARING };

    it('should update order status', async () => {
      const order = new Order();
      order.id = orderId;
      order.status = OrderStatus.PREPARING;

      (orderService.updateOrderStatus as jest.Mock).mockResolvedValue(order);

      const result = await controller.updateOrderStatus(orderId, updateOrderStatusDto);
      expect(result).toEqual(new OrderDto(order));
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(orderId, updateOrderStatusDto.status);
    });

    it('should return 400 on update failure', async () => {
      (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(new BadRequestException('Update failed'));

      await expect(controller.updateOrderStatus(orderId, updateOrderStatusDto)).rejects.toThrow(HttpException);
    });
  });

  describe('getOrdersByStatus', () => {
    const orderStatus = OrderStatus.PREPARING;
    const orders = [
      new OrderDto({
        id: 'order-uuid-1',
        client: testClient,
        product: [testProduct],
        totalAmount: 100,
        status: orderStatus,
      } as any),
    ];

    it('should return orders by status', async () => {
      (orderService.getOrdersByStatus as jest.Mock).mockResolvedValue(orders);

      const result = await controller.getOrdersByStatus(orderStatus);
      expect(result).toEqual(orders);
      expect(orderService.getOrdersByStatus).toHaveBeenCalledWith(orderStatus);
    });

    it('should return 400 if error occurs', async () => {
      (orderService.getOrdersByStatus as jest.Mock).mockRejectedValue(new BadRequestException('Fetch failed'));

      await expect(controller.getOrdersByStatus(orderStatus)).rejects.toThrow(HttpException);
    });
  });
});