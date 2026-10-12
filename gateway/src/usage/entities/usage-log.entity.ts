import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('usage_logs')
export class UsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'int' })
  tokens: number;

  @Column() // 'ollama' | 'claude'
  provider: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  costUsd: number;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
