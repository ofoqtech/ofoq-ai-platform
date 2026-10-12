import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum ModelProvider {
  OLLAMA = 'ollama',
  CLAUDE = 'claude',
}

export interface RoutingDecision {
  provider: ModelProvider;
  model: string;
  reason: string;
}

/**
 * Smart router: decides whether to use local Ollama or Claude API
 * based on task complexity, user preference, and cost optimization.
 */
@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  // Patterns that indicate complex tasks → route to Claude
  private readonly complexPatterns = [
    /architect|design pattern|refactor.*large|review.*entire|explain.*codebase/i,
    /debug.*complex|performance.*audit|security.*review/i,
    /مراجعة.*كاملة|تصميم.*معماري|تحليل.*شامل|أمان.*مراجعة/i,
    /\b(typescript|rust|go)\b.*\b(advanced|complex|architecture)\b/i,
  ];

  // Code-related patterns → prefer Ollama Qwen2.5-Coder
  private readonly codePatterns = [
    /```[\w]*\n|function |class |import |export |def |const |let |var /,
    /fix.*bug|complete.*code|write.*function|add.*method|refactor/i,
    /أكتب.*كود|أصلح.*خطأ|أكمل.*دالة|حسّن.*الكود/i,
  ];

  constructor(private config: ConfigService) {}

  route(messages: any[], forceProvider?: string): RoutingDecision {
    if (forceProvider === 'claude') {
      return { provider: ModelProvider.CLAUDE, model: 'claude-sonnet-4-5', reason: 'user_forced' };
    }
    if (forceProvider === 'ollama') {
      return { provider: ModelProvider.OLLAMA, model: this.config.get('OLLAMA_MODEL', 'qwen2.5-coder:7b'), reason: 'user_forced' };
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const totalLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);

    // Very long context → Claude handles it better
    if (totalLength > 8000) {
      return { provider: ModelProvider.CLAUDE, model: 'claude-sonnet-4-5', reason: 'long_context' };
    }

    // Complex architectural/review tasks → Claude
    for (const pattern of this.complexPatterns) {
      if (pattern.test(lastMessage)) {
        return { provider: ModelProvider.CLAUDE, model: 'claude-sonnet-4-5', reason: 'complex_task' };
      }
    }

    // Code tasks → Ollama Qwen2.5-Coder (fast + free)
    for (const pattern of this.codePatterns) {
      if (pattern.test(lastMessage)) {
        return {
          provider: ModelProvider.OLLAMA,
          model: this.config.get('OLLAMA_MODEL', 'qwen2.5-coder:7b'),
          reason: 'code_task',
        };
      }
    }

    // Default: Ollama for simple tasks
    return {
      provider: ModelProvider.OLLAMA,
      model: this.config.get('OLLAMA_MODEL', 'qwen2.5-coder:7b'),
      reason: 'default',
    };
  }
}
