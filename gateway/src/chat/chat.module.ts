import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RouterService } from './router.service';
import { OllamaService } from './providers/ollama.service';
import { ClaudeService } from './providers/claude.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { UsageModule } from '../usage/usage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    UsageModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, RouterService, OllamaService, ClaudeService],
  exports: [ChatService],
})
export class ChatModule {}
