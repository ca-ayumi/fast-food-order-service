import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Client } from '../entities/client.entity';
import { Product } from '../entities/product.entity';
import { OrderDto } from '../../application/dto/order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createOrder(
    clientId: string,
    productIds: string[],
    totalAmount: number,
  ): Promise<Order> {
    this.logger.debug(
      `Creating order for clientId: ${clientId} with products: ${productIds}`,
    );

    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      this.logger.error(`Client not found: ${clientId}`);
      throw new NotFoundException('Client not found');
    }

    const products = await this.productRepository.findByIds(productIds);
    if (products.length !== productIds.length) {
      this.logger.error(`Products not found or mismatch: ${productIds}`);
      throw new NotFoundException('One or more products not found');
    }

    const order = new Order();
    order.client = client;
    order.product = products;
    order.totalAmount = totalAmount;
    order.status = OrderStatus.RECEIVED;

    try {
      const savedOrder = await this.orderRepository.save(order);
      this.logger.debug(`Order created successfully: ${savedOrder.id}`);
      return savedOrder;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw new BadRequestException('Failed to create order');
    }
  }

  async listOrders(): Promise<OrderDto[]> {
    try {
      const orders = await this.orderRepository.find({
        where: {
          status: In(['Pronto', 'Em Preparação', 'Recebido']),
        },
        relations: ['client', 'product'],
        order: {
          createdAt: 'ASC',
        },
      });

      if (!orders || orders.length === 0) {
        this.logger.error('No orders found or invalid order status');
        throw new NotFoundException('No orders found');
      }

      return orders.map((order) => new OrderDto(order));
    } catch (error) {
      this.logger.error(`Failed to list orders: ${error.message}`);
      throw new BadRequestException('Failed to list orders');
    }
  }

  async getOrderById(orderId: string): Promise<OrderDto> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['client', 'product'],
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      return new OrderDto(order);
    } catch (error) {
      throw new BadRequestException('Failed to get order');
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    this.logger.debug(
      `Starting update for order ID: ${orderId} with status: ${status}`,
    );

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['client', 'product'],
    });

    if (!order) {
      this.logger.error(`Order with ID ${orderId} not found`);
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    this.logger.debug(`Found order: ${JSON.stringify(order)}`);

    const validStatuses = Object.values(OrderStatus);
    this.logger.debug(`Valid statuses: ${validStatuses.join(', ')}`);

    if (!validStatuses.includes(status as OrderStatus)) {
      this.logger.error(`Invalid status provided: ${status}`);
      throw new BadRequestException('Invalid status provided');
    }

    order.status = status as OrderStatus;
    this.logger.debug(`Updating order status to: ${status}`);

    try {
      const updatedOrder = await this.orderRepository.save(order);
      this.logger.debug(
        `Order updated successfully: ${JSON.stringify(updatedOrder)}`,
      );
      return updatedOrder;
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error.message}`);
      throw new BadRequestException('Failed to update order status');
    }
  }
}
