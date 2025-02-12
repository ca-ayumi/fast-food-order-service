import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('client')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  cpf: string;

  @Column()
  email: string;

  @BeforeInsert()
  @BeforeUpdate()
  formatCPF() {
    this.cpf = this.cpf.replace(/\D/g, '');
  }
}
