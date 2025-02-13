import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductService } from '@domain/service/product.service';
import { Product } from '@domain/entities/product.entity';
import { CreateProductDto, ProductCategory } from '@application/dto/create-product.dto';
import { UpdateProductDto } from '@application/dto/update-product.dto';


@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({
    type: CreateProductDto,
    description: 'Details of the product to be created',
  })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productService.createProduct(createProductDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(
          { status: HttpStatus.BAD_REQUEST, error: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({
    type: UpdateProductDto,
    description: 'Details of the product to be updated',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      return await this.productService.updateProduct(id, updateProductDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      }
      if (error instanceof BadRequestException) {
        throw new HttpException(
          { status: HttpStatus.BAD_REQUEST, error: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
    schema: {
      example: { message: 'Product with id {id} was successfully deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiParam({
    name: 'id',
    description: 'ID of the product',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async deleteProduct(@Param('id') id: string) {
    return await this.productService.deleteProduct(id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({
    status: 200,
    description: 'List of products in the category',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 404,
    description: 'No products found in this category',
  })
  @ApiParam({
    name: 'category',
    description: 'Category of the products',
    example: 'Lanches',
  })
  async getProductsByCategory(@Param('category') category: string) {
    try {
      return await this.productService.findProductsByCategory(
        category as ProductCategory,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      }
      if (error instanceof BadRequestException) {
        throw new HttpException(
          { status: HttpStatus.BAD_REQUEST, error: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }
}
