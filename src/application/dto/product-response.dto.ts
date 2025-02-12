import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from './create-product.dto';

export class ProductResponseDto {
  @ApiProperty({
    description: 'ID of the product',
    example: '98375106-9b27-435a-99fa-0f339d6c35bb',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the product',
    example: 'X-Burger Bacon',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'A delicious beef burger with cheese, lettuce and bacon',
  })
  description: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 45,
  })
  price: number;

  @ApiProperty({
    description: 'Category of the product',
    enum: ProductCategory,
    example: 'Lanches',
  })
  category: ProductCategory;

  @ApiProperty({
    description: 'Image URL of the product',
    example:
      'https://br.freepik.com/fotos-gratis/hamburguer-saboroso-isolado-no-fundo-branco-fastfood-de-hamburguer-fresco-com-carne-e-queijo_38117312.htm#query=hamburger&position=0&from_view=keyword&track=ais_hybrid&uuid=eb04e18e-d429-473e-8681-77d6ab6ae7b1',
  })
  imageUrl: string;
}
