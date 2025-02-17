import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum ProductCategory {
  Lanches = 'Lanches',
  Acompanhamento = 'Acompanhamento',
  Bebida = 'Bebida',
  Sobremesa = 'Sobremesa',
}

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column({
    type: 'enum',
    enum: ProductCategory,
  })
  category: ProductCategory;

  @Column({ nullable: true })
  imageurl: string;
}
