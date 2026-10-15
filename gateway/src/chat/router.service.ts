import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum ModelProvider {
  OLLAMA = 'ollama',
  CLAUDE = 'claude',
  OPENROUTER = 'openrouter',
}

export interface RoutingDecision {
  provider: ModelProvider;
  model: string;
  reason: string;
}

@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  private readonly complexPatterns = [
    /architect|design pattern|refactor.*large|review.*entire|explain.*codebase/i,
    /debug.*complex|performance.*audit|security.*review/i,
    /مراجعة.*كاملة|تصميم.*معماري|تحليل.*شامل|أمان.*مراجعة/i,
    /\b(typescript|rust|go)\b.*\b(advanced|complex|architecture)\b/i,
  ];

  private readonly codePatterns = [
    /```[\w]*\n|function |class |import |export |def |const |let |var /,
    /fix.*bug|complete.*code|write.*function|add.*method|refactor/i,
    /أكتب.*كود|أصلح.*خطأ|أكمل.*دالة|حسّن.*الكود/i,
  ];

  constructor(private config: ConfigService) {}

  route(messages: any[], forceProvider?: string): RoutingDecision {
    const hasOpenRouter = !!this.config.get('OPENROUTER_API_KEY');

    if (forceProvider === 'claude') {
      return { provider: ModelProvider.CLAUDE, model: this.config.get('CLAUDE_MODEL', 'claude-sonnet-4-5'), reason: 'user_forced' };
    }
    if (forceProvider === 'openrouter') {
      return { provider: ModelProvider.OPENROUTER, model: this.config.get('OPENROUTER_MODEL', 'meta-llama/llama-3.1-70b-instruct:free'), reason: 'user_forced' };
    }
    if (forceProvider === 'ollama') {
      return { provider: ModelProvider.OLLAMA, model: this.config.get('OLLAMA_MODEL', 'qwen2.5-coder:1.5b'), reason: 'user_forced' };
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const totalLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);

    if (totalLength > 8000) {
      return { provider: ModelProvider.CLAUDE, model: this.config.get('CLAUDE_MODEL', 'claude-sonnet-4-5'), reason: 'long_context' };
    }

    for (const pattern of this.complexPatterns) {
      if (pattern.test(lastMessage)) {
        return { provider: ModelProvider.CLAUDE, model: this.config.get('CLAUDE_MODEL', 'claude-sonnet-4-5'), reason: 'complex_task' };
      }
    }

    // Default: OpenRouter (fast + free) if available, else Ollama
    if (hasOpenRouter) {
      return {
        provider: ModelProvider.OPENROUTER,
        model: this.config.get('OPENROUTER_MODEL', 'meta-llama/llama-3.1-70b-instruct:free'),
        reason: 'default_fast',
      };
    }

    return {
      provider: ModelProvider.OLLAMA,
      model: this.config.get('OLLAMA_MODEL', 'qwen2.5-coder:1.5b'),
      reason: 'default',
    };
  }
}
