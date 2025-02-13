import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from '@domain/service/product.service';
import { Product } from '@domain/entities/product.entity';
import { CreateProductDto, ProductCategory } from '@application/dto/create-product.dto';
import { UpdateProductDto } from '@application/dto/update-product.dto';

describe('ProductService', () => {
  let service: ProductService;
  let repository: Repository<Product>;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));

    jest.clearAllMocks();
  });

  it('should create a product successfully', async () => {
    const createProductDto: CreateProductDto = {
      name: 'Burger',
      description: 'Delicious burger',
      price: 12.99,
      category: ProductCategory.Lanches,
      imageUrl: 'https://example.com/image.jpg',
    };

    const createdProduct: Product = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      ...createProductDto,
    };

    mockProductRepository.findOne.mockResolvedValue(null);
    mockProductRepository.create.mockReturnValue(createdProduct);
    mockProductRepository.save.mockResolvedValue(createdProduct);

    const result = await service.createProduct(createProductDto);

    expect(result).toEqual(createdProduct);
    expect(mockProductRepository.findOne).toHaveBeenCalledWith({
      where: { name: createProductDto.name },
    });
    expect(mockProductRepository.create).toHaveBeenCalledWith(createProductDto);
    expect(mockProductRepository.save).toHaveBeenCalledWith(createdProduct);
  });

  it('should throw BadRequestException when creating a product with an existing name', async () => {
    const createProductDto: CreateProductDto = {
      name: 'Burger',
      description: 'Delicious burger',
      price: 12.99,
      category: ProductCategory.Lanches,
      imageUrl: 'https://example.com/image.jpg',
    };

    mockProductRepository.findOne.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', ...createProductDto });

    await expect(service.createProduct(createProductDto)).rejects.toThrow(BadRequestException);
    expect(mockProductRepository.findOne).toHaveBeenCalledWith({
      where: { name: createProductDto.name },
    });
  });

  it('should update a product successfully', async () => {
    const updateProductDto: Partial<UpdateProductDto> = { name: 'New Burger' };
    const existingProduct: Product = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Burger',
      description: 'Delicious burger',
      price: 12.99,
      category: ProductCategory.Lanches,
      imageUrl: 'https://example.com/image.jpg',
    };

    mockProductRepository.findOne.mockResolvedValueOnce(existingProduct);
    mockProductRepository.findOne.mockResolvedValueOnce(null);
    mockProductRepository.update.mockResolvedValue(undefined);

    const result = await service.updateProduct('123e4567-e89b-12d3-a456-426614174000', updateProductDto);

    expect(result).toBe(`Product with ID 123e4567-e89b-12d3-a456-426614174000 has been successfully updated.`);
    expect(mockProductRepository.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', expect.objectContaining({
      name: 'New Burger'
    }));
  });

  it('should throw NotFoundException when updating a non-existent product', async () => {
    mockProductRepository.findOne.mockResolvedValue(null);

    await expect(service.updateProduct('123e4567-e89b-12d3-a456-426614174000', { name: 'New Burger' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a product successfully', async () => {
    const existingProduct: Product = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Burger',
      description: 'Delicious burger',
      price: 12.99,
      category: ProductCategory.Lanches,
      imageUrl: 'https://example.com/image.jpg',
    };

    mockProductRepository.findOne.mockResolvedValue(existingProduct);
    mockProductRepository.delete.mockResolvedValue({ affected: 1 });

    const result = await service.deleteProduct('123e4567-e89b-12d3-a456-426614174000');

    expect(result).toBe('Product with ID 123e4567-e89b-12d3-a456-426614174000 has been successfully removed.');
    expect(mockProductRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw NotFoundException when deleting a non-existent product', async () => {
    mockProductRepository.findOne.mockResolvedValue(null);

    await expect(service.deleteProduct('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(NotFoundException);
  });

  it('should find products by category', async () => {
    const products: Product[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        category: ProductCategory.Lanches,
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 'uuid-2',
        name: 'Cheeseburger',
        description: 'Tasty cheeseburger',
        price: 14.99,
        category: ProductCategory.Lanches,
        imageUrl: 'https://example.com/image2.jpg',
      },
    ];

    mockProductRepository.find.mockResolvedValue(products);

    const result = await service.findProductsByCategory(ProductCategory.Lanches);

    expect(result).toEqual(products);
    expect(mockProductRepository.find).toHaveBeenCalledWith({ where: { category: ProductCategory.Lanches } });
  });

  it('should throw NotFoundException when no products are found in a category', async () => {
    mockProductRepository.find.mockResolvedValue([]);

    await expect(service.findProductsByCategory(ProductCategory.Lanches)).rejects.toThrow(
      NotFoundException,
    );
  });
});