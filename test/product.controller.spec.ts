import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductController } from '@application/interfaces/controllers/product.controller';
import { ProductService } from '@domain/service/product.service';
import { UpdateProductDto } from '@application/dto/update-product.dto';
import { CreateProductDto, ProductCategory } from '@application/dto/create-product.dto';
import { Product } from '@domain/entities/product.entity';

describe('ProductController', () => {
  let productController: ProductController;
  let productService: Partial<Record<keyof ProductService, jest.Mock>>;

  const sampleProduct: Product = {
    id: 'product-uuid',
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    category: ProductCategory.Lanches,
    imageUrl: 'http://example.com/image.jpg',
  };

  const createProductDto: CreateProductDto = {
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    category: ProductCategory.Lanches,
    imageUrl: 'http://example.com/image.jpg',
  };

  const updateProductDto: UpdateProductDto = {
    name: 'Updated Product',
    description: 'An updated product',
    price: 109.99,
    category: ProductCategory.Acompanhamento,
    imageUrl: 'http://example.com/updated.jpg',
  };

  beforeEach(async () => {
    productService = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      findProductsByCategory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compile();

    productController = module.get<ProductController>(ProductController);
  });

  describe('createProduct', () => {
    it('should create and return a product successfully', async () => {
      (productService.createProduct as jest.Mock).mockResolvedValue(sampleProduct);
      const result = await productController.createProduct(createProductDto);
      expect(result).toEqual(sampleProduct);
      expect(productService.createProduct).toHaveBeenCalledWith(createProductDto);
    });

    it('should throw HttpException with 400 if BadRequestException is thrown', async () => {
      const badRequestError = new BadRequestException('Bad request error');
      (productService.createProduct as jest.Mock).mockRejectedValue(badRequestError);

      await expect(productController.createProduct(createProductDto)).rejects.toThrow(HttpException);
      try {
        await productController.createProduct(createProductDto);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = error.getResponse();
        expect(response.error).toContain('Bad request error');
      }
    });
  });

  describe('updateProduct', () => {
    const productId = 'product-uuid';

    it('should update and return the product successfully', async () => {
      (productService.updateProduct as jest.Mock).mockResolvedValue(sampleProduct);
      const result = await productController.updateProduct(productId, updateProductDto);
      expect(result).toEqual(sampleProduct);
      expect(productService.updateProduct).toHaveBeenCalledWith(productId, updateProductDto);
    });

    it('should throw HttpException with 404 if NotFoundException is thrown', async () => {
      const notFoundError = new NotFoundException('Product not found');
      (productService.updateProduct as jest.Mock).mockRejectedValue(notFoundError);

      await expect(productController.updateProduct(productId, updateProductDto)).rejects.toThrow(HttpException);
      try {
        await productController.updateProduct(productId, updateProductDto);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = error.getResponse();
        expect(response.error).toContain('Product not found');
      }
    });

    it('should throw HttpException with 400 if BadRequestException is thrown', async () => {
      const badRequestError = new BadRequestException('Bad request error');
      (productService.updateProduct as jest.Mock).mockRejectedValue(badRequestError);

      await expect(productController.updateProduct(productId, updateProductDto)).rejects.toThrow(HttpException);
      try {
        await productController.updateProduct(productId, updateProductDto);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = error.getResponse();
        expect(response.error).toContain('Bad request error');
      }
    });
  });

  describe('deleteProduct', () => {
    const productId = 'product-uuid';

    it('should delete the product successfully', async () => {
      const deleteResponse = { message: `Product with id ${productId} was successfully deleted` };
      (productService.deleteProduct as jest.Mock).mockResolvedValue(deleteResponse);
      const result = await productController.deleteProduct(productId);
      expect(result).toEqual(deleteResponse);
      expect(productService.deleteProduct).toHaveBeenCalledWith(productId);
    });
  });

  describe('getProductsByCategory', () => {
    const category = ProductCategory.Lanches;

    it('should return products by category successfully', async () => {
      const products = [sampleProduct];
      (productService.findProductsByCategory as jest.Mock).mockResolvedValue(products);
      const result = await productController.getProductsByCategory(category);
      expect(result).toEqual(products);
      expect(productService.findProductsByCategory).toHaveBeenCalledWith(category);
    });

    it('should throw HttpException with 404 if NotFoundException is thrown', async () => {
      const notFoundError = new NotFoundException('No products found in this category');
      (productService.findProductsByCategory as jest.Mock).mockRejectedValue(notFoundError);

      await expect(productController.getProductsByCategory(category)).rejects.toThrow(HttpException);
      try {
        await productController.getProductsByCategory(category);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = error.getResponse();
        expect(response.error).toContain('No products found in this category');
      }
    });

    it('should throw HttpException with 400 if BadRequestException is thrown', async () => {
      const badRequestError = new BadRequestException('Bad request');
      (productService.findProductsByCategory as jest.Mock).mockRejectedValue(badRequestError);

      await expect(productController.getProductsByCategory(category)).rejects.toThrow(HttpException);
      try {
        await productController.getProductsByCategory(category);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = error.getResponse();
        expect(response.error).toContain('Bad request');
      }
    });
  });
});
