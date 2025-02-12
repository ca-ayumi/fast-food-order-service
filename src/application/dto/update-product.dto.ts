import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto, ProductCategory } from './create-product.dto';
import { IsEnum } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
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
}
