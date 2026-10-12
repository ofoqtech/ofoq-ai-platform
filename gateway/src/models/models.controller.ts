import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OllamaService } from '../chat/providers/ollama.service';
import { ClaudeService } from '../chat/providers/claude.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('models')
export class ModelsController {
  constructor(private ollama: OllamaService, private claude: ClaudeService) {}

  @Get()
  async list() {
    const ollamaModels = await this.ollama.listModels();
    return {
      ollama: { available: await this.ollama.isAvailable(), models: ollamaModels },
      claude: { available: this.claude.isAvailable(), models: ['claude-sonnet-4-5', 'claude-haiku-4-5-20251001'] },
    };
  }
}
