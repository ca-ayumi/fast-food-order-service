import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { OrderStatus } from '@domain/entities/order.entity';
import { ProductCategory } from '@domain/entities/product.entity';
import { OrderController } from '@application/interfaces/controllers/order.controller';
import { OrderService } from '@domain/service/order.service';
import { OrderDto } from '@application/dto/order.dto';

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
      listOrders: jest.fn(),
      getOrderById: jest.fn(),
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
    const now = new Date();

    it('should create and return an order successfully', async () => {
      const order = {
        id: 'order-uuid',
        client: testClient,
        product: [testProduct],
        totalAmount: 100,
        status: OrderStatus.RECEIVED,
        createdAt: now,
        updatedAt: now,
      };
      (orderService.createOrder as jest.Mock).mockResolvedValue(order);

      const result = await controller.createOrder(createOrderDto);
      expect(result).toEqual(new OrderDto(order));
      expect(orderService.createOrder).toHaveBeenCalledWith(
        createOrderDto.clientId,
        createOrderDto.productIds,
        createOrderDto.totalAmount,
      );
    });

    it('should throw HttpException with 404 if NotFoundException is thrown', async () => {
      const notFoundError = new NotFoundException('Client not found');
      (orderService.createOrder as jest.Mock).mockRejectedValue(notFoundError);

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        HttpException,
      );
      try {
        await controller.createOrder(createOrderDto);
      } catch (error) {
        const response = error.getResponse();
        expect(response.error).toContain('Client not found');
      }
    });

    it('should throw HttpException with 400 if BadRequestException is thrown', async () => {
      const badRequestError = new BadRequestException('Bad request error');
      (orderService.createOrder as jest.Mock).mockRejectedValue(badRequestError);

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(HttpException);

      try {
        await controller.createOrder(createOrderDto);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = error.getResponse();
        expect(response.error).toContain('Bad request error');
      }
    });

    it('should propagate unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      (orderService.createOrder as jest.Mock).mockRejectedValue(unexpectedError);

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        unexpectedError,
      );
    });
  });

  describe('updateOrderStatus', () => {
    const orderId = 'order-uuid';
    const updateOrderStatusDto = { status: OrderStatus.PREPARING };
    const now = new Date();

    it('should update and return the order with updated status', async () => {
      const order = {
        id: orderId,
        client: testClient,
        product: [testProduct],
        totalAmount: 100,
        status: updateOrderStatusDto.status,
        createdAt: now,
        updatedAt: now,
      };
      (orderService.updateOrderStatus as jest.Mock).mockResolvedValue(order);

      const result = await controller.updateOrderStatus(
        orderId,
        updateOrderStatusDto,
      );
      expect(result).toEqual(new OrderDto(order));
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        updateOrderStatusDto.status,
      );
    });

    it('should throw HttpException with 400 if error occurs during update', async () => {
      const error = new Error('Update failed');
      (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.updateOrderStatus(orderId, updateOrderStatusDto),
      ).rejects.toThrow(HttpException);
      try {
        await controller.updateOrderStatus(orderId, updateOrderStatusDto);
      } catch (ex) {
        expect(ex.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = ex.getResponse();
        expect(response.error).toContain('Update failed');
      }
    });
  });

  describe('listOrders', () => {
    const now = new Date();

    it('should return a list of orders', async () => {
      const orders = [
        new OrderDto({
          id: 'order-uuid-1',
          client: testClient,
          product: [testProduct],
          totalAmount: 100,
          status: OrderStatus.RECEIVED,
          createdAt: now,
          updatedAt: now,
        } as any),
      ];
      (orderService.listOrders as jest.Mock).mockResolvedValue(orders);

      const result = await controller.listOrders();
      expect(result).toEqual(orders);
      expect(orderService.listOrders).toHaveBeenCalled();
    });

    it('should throw HttpException with 400 if error occurs while listing orders', async () => {
      const error = new Error('List error');
      (orderService.listOrders as jest.Mock).mockRejectedValue(error);

      await expect(controller.listOrders()).rejects.toThrow(HttpException);
      try {
        await controller.listOrders();
      } catch (ex) {
        expect(ex.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = ex.getResponse();
        expect(response.error).toContain('List error');
      }
    });
  });

  describe('getOrderById', () => {
    const orderId = 'order-uuid';
    const now = new Date();

    it('should return the order by ID', async () => {
      const order = {
        id: orderId,
        client: testClient,
        product: [testProduct],
        totalAmount: 100,
        status: OrderStatus.RECEIVED,
        createdAt: now,
        updatedAt: now,
      };
      (orderService.getOrderById as jest.Mock).mockResolvedValue(new OrderDto(order));

      const result = await controller.getOrderById(orderId);
      expect(result).toEqual(new OrderDto(order));
      expect(orderService.getOrderById).toHaveBeenCalledWith(orderId);
    });

    it('should throw HttpException with 404 if order not found', async () => {
      const notFoundError = new NotFoundException('Order not found');
      (orderService.getOrderById as jest.Mock).mockRejectedValue(notFoundError);

      await expect(controller.getOrderById(orderId)).rejects.toThrow(HttpException);
      try {
        await controller.getOrderById(orderId);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = error.getResponse();
        expect(response.error).toContain('Order not found');
      }
    });

    it('should throw HttpException with 400 if BadRequestException occurs', async () => {
      const badRequestError = new BadRequestException('Bad request');
      (orderService.getOrderById as jest.Mock).mockRejectedValue(badRequestError);

      await expect(controller.getOrderById(orderId)).rejects.toThrow(HttpException);
      try {
        await controller.getOrderById(orderId);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = error.getResponse();
        expect(response.error).toContain('Bad request');
      }
    });
  });
});
