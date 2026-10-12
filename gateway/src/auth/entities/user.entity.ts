import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ApiKey } from './api-key.entity';

export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.DEVELOPER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 100000 })
  monthlyTokenLimit: number;

  @Column({ type: 'int', default: 0 })
  tokensUsedThisMonth: number;

  @OneToMany(() => ApiKey, (key) => key.user)
  apiKeys: ApiKey[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
