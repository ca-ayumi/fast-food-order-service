import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { Client } from '@domain/entities/client.entity';
import { Product } from '@domain/entities/product.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CreateOrderResponseDto } from '@application/dto/create-order-response.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly paymentServiceUrl: string;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:3001';
  }

  async createOrder(
    clientId: string,
    productIds: string[],
    totalAmount: number,
  ): Promise<CreateOrderResponseDto> {
    this.logger.debug(
      `Creating order for clientId: ${clientId} with products: ${productIds}`,
    );

    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      this.logger.error(`Client not found: ${clientId}`);
      throw new NotFoundException('Client not found');
    }

    const products = await this.productRepository.findByIds(productIds);
    if (products.length !== productIds.length) {
      this.logger.error(`Products not found or mismatch: ${productIds}`);
      throw new NotFoundException('One or more products not found');
    }

    const productDetails = products.map((product) => ({
      id: product.id,
      name: product.name,
      unitPrice: product.price,
    }));

    const order = new Order();
    order.client = client;
    order.product = products;
    order.totalAmount = totalAmount;
    order.status = OrderStatus.RECEIVED;

    let savedOrder: Order;
    try {
      savedOrder = await this.orderRepository.save(order);
      this.logger.debug(`Order created successfully: ${savedOrder.id}`);
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw new BadRequestException('Failed to create order');
    }

    let qrCode: string;
    try {
      const paymentResponse$ = this.httpService.post(
        `${this.paymentServiceUrl}/payments`,
        { orderId: savedOrder.id, amount: totalAmount,   clientId,
          products: productDetails,
        },
      );
      const paymentResponse = await firstValueFrom(paymentResponse$);

      if (!paymentResponse.data || !paymentResponse.data.qrCode) {
        this.logger.error(
          `QR Code not generated for order ${savedOrder.id}: ${JSON.stringify(paymentResponse.data)}`,
        );
        throw new BadRequestException('QR Code generation failed');
      }

      qrCode = paymentResponse.data.qrCode;
    } catch (error) {
      this.logger.error(
        `Payment API call failed for order ${savedOrder.id}: ${error.message}`,
      );
      throw new BadRequestException('Payment processing failed');
    }

    return new CreateOrderResponseDto(savedOrder.id, qrCode);
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

    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status as OrderStatus)) {
      this.logger.error(`Invalid status provided: ${status}`);
      throw new BadRequestException('Invalid status provided');
    }

    order.status = status as OrderStatus;
    this.logger.debug(`Updating order status to: ${status}`);

    try {
      const updatedOrder = await this.orderRepository.save(order);
      this.logger.debug(`Order updated successfully: ${JSON.stringify(updatedOrder)}`);

      if (status === OrderStatus.PREPARING) {
        try {
          this.logger.debug(`Notifying production service for order: ${orderId}`);
          await firstValueFrom(
            this.httpService.post(`${process.env.PRODUCTION_SERVICE_URL}/production`, {
              orderId,
            }),
          );
          this.logger.debug(`Order ${orderId} successfully sent to production queue.`);
        } catch (error) {
          this.logger.error(`Failed to notify production service: ${error.message}`);
        }
      }

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error.message}`);
      throw new BadRequestException('Failed to update order status');
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    this.logger.debug(`Fetching orders with status: ${status}`);

    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status as OrderStatus)) {
      this.logger.error(`Invalid status provided: ${status}`);
      throw new BadRequestException('Invalid status provided');
    }

    return this.orderRepository.find({
      where: { status: status as OrderStatus },
      relations: ['client', 'product'],
    });
  }
}
