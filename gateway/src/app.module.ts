import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UsageModule } from './usage/usage.module';
import { ModelsModule } from './models/models.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME') || config.get('DB_USER') || 'ofoq',
        password: config.get('DB_PASSWORD') || config.get('DB_PASS') || 'ofoq_secret',
        database: config.get('DB_DATABASE') || config.get('DB_NAME') || 'ofoq_ai',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    AuthModule,
    ChatModule,
    UsageModule,
    ModelsModule,
    HealthModule,
  ],
})
export class AppModule {}
