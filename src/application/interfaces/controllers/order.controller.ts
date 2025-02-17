import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from '../../dto/create-order.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderDto } from '../../dto/order.dto';
import { UpdateOrderStatusDto } from '../../dto/update-order-status.dto';
import { OrderService } from '@domain/service/order.service';
import { CreateOrderResponseDto } from '@application/dto/create-order-response.dto';
import { Order } from '@domain/entities/order.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    //private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
    type: OrderDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Client or Product not found' })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Details of the order to be created',
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    try {
      return await this.orderService.createOrder(
        createOrderDto.clientId,
        createOrderDto.productIds,
        createOrderDto.totalAmount,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      } else if (error instanceof BadRequestException) {
        throw new HttpException(
          { status: HttpStatus.BAD_REQUEST, error: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of an order' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully.',
    type: OrderDto,
  })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderDto> {
    this.logger.debug(
      `Received request to update order ID: ${orderId} with status: ${updateOrderStatusDto.status}`,
    );

    const updatedOrder = await this.orderService.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
    );
    this.logger.debug(`Order updated: ${JSON.stringify(updatedOrder)}`);
    return new OrderDto(updatedOrder);
  }


  @Get('status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  @ApiResponse({
    status: 200,
    description: 'List of orders with the specified status.',
    type: [OrderDto],
  })
  async getOrdersByStatus(@Param('status') status: string): Promise<Order[]> {
    this.logger.debug(`Fetching orders with status: ${status}`);
    return await this.orderService.getOrdersByStatus(status);
  }
}

