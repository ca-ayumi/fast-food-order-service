import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateProductDto,
  ProductCategory,
} from '../../application/dto/create-product.dto';
import { Product } from '../entities/product.entity';
import { validate as isUUID } from 'uuid';
import { UpdateProductDto } from '../../application/dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this name already exists');
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async updateProduct(
    id: string,
    updateProductDto: Partial<UpdateProductDto>,
  ): Promise<string> {
    if (!isUUID(id)) {
      throw new NotFoundException('Invalid UUID');
    }

    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingProduct = await this.productRepository.findOne({
      where: { name: updateProductDto.name },
    });

    if (existingProduct && existingProduct.id !== id) {
      throw new BadRequestException('Product with this name already exists');
    }

    await this.productRepository.update(
      id,
      updateProductDto as Partial<Product>,
    );
    return `Product with ID ${id} has been successfully updated.`;
  }

  async deleteProduct(id: string): Promise<string> {
    if (!isUUID(id)) {
      throw new NotFoundException('Invalid UUID');
    }

    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.delete(id);
    return `Product with ID ${id} has been successfully removed.`;
  }

  async findProductsByCategory(category: ProductCategory): Promise<Product[]> {
    try {
      const products = await this.productRepository.find({
        where: { category },
      });

      if (!products || products.length === 0) {
        throw new NotFoundException(
          `No products found in category ${category}`,
        );
      }

      return products;
    } catch (error) {
      throw new NotFoundException(`No products found in category ${category}`);
    }
  }
}
