import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum ProductCategory {
  Lanches = 'Lanches',
  Acompanhamento = 'Acompanhamento',
  Bebida = 'Bebida',
  Sobremesa = 'Sobremesa',
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'Burger',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'A delicious beef burger with cheese and lettuce',
  })
  description: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 12.99,
  })
  price: number;

  @ApiProperty({
    description: 'Category of the product',
    example: ProductCategory.Lanches,
    enum: ProductCategory,
  })
  @IsEnum(ProductCategory, {
    message:
      'Category must be one of: Lanches, Acompanhamento, Bebida, Sobremesa',
  })
  category: ProductCategory;

  @ApiProperty({
    description: 'URL of the product image',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  imageUrl: string;
}
