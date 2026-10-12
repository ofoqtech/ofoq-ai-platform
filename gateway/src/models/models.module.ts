import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { OllamaService } from '../chat/providers/ollama.service';
import { ClaudeService } from '../chat/providers/claude.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ModelsController],
  providers: [OllamaService, ClaudeService],
})
export class ModelsModule {}
