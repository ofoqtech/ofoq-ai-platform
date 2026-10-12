import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { RouterService, ModelProvider } from './router.service';
import { OllamaService } from './providers/ollama.service';
import { ClaudeService } from './providers/claude.service';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    private router: RouterService,
    private ollama: OllamaService,
    private claude: ClaudeService,
    private usage: UsageService,
  ) {}

  async createConversation(userId: string, title?: string, systemPrompt?: string) {
    const conv = this.convRepo.create({ userId, title: title || 'محادثة جديدة', systemPrompt });
    return this.convRepo.save(conv);
  }

  async getConversations(userId: string) {
    return this.convRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
    });
  }

  async getConversation(id: string, userId: string) {
    const conv = await this.convRepo.findOne({
      where: { id, userId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } } as any,
    });
    if (!conv) throw new NotFoundException('المحادثة غير موجودة');
    return conv;
  }

  async deleteConversation(id: string, userId: string) {
    const conv = await this.convRepo.findOne({ where: { id, userId } });
    if (!conv) throw new NotFoundException('المحادثة غير موجودة');
    await this.convRepo.remove(conv);
  }

  async chat(
    userId: string,
    conversationId: string,
    userMessage: string,
    stream: boolean,
    forceProvider: string | undefined,
    res?: Response,
  ) {
    // Verify ownership
    const conv = await this.convRepo.findOne({
      where: { id: conversationId, userId },
      relations: ['messages'],
    });
    if (!conv) throw new NotFoundException('المحادثة غير موجودة');

    // Check token limit
    await this.usage.checkLimit(userId);

    // Save user message
    const userMsg = this.msgRepo.create({ role: 'user', content: userMessage, conversationId });
    await this.msgRepo.save(userMsg);

    // Build messages array for LLM
    const history = conv.messages.map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: userMessage });

    // Smart routing decision
    const decision = this.router.route(history, forceProvider);

    let result: any;
    if (decision.provider === ModelProvider.CLAUDE) {
      result = await this.claude.chat(decision.model, history, conv.systemPrompt || '', stream, res);
    } else {
      const ollamaMessages = conv.systemPrompt
        ? [{ role: 'system', content: conv.systemPrompt }, ...history]
        : history;
      result = await this.ollama.chat(decision.model, ollamaMessages, stream, res);
    }

    // If streaming, response already sent — just log usage async
    if (stream) {
      this.logAssistantMessage(conversationId, decision, result?.content || '', result?.usage?.totalTokens || 0, userId);
      return null;
    }

    // Save assistant message
    await this.logAssistantMessage(conversationId, decision, result.content, result.usage?.totalTokens || 0, userId);

    // Update conversation title if first exchange
    if (conv.messages.length <= 1 && !conv.title?.startsWith('م') === false) {
      const shortTitle = userMessage.slice(0, 50);
      await this.convRepo.update(conversationId, { title: shortTitle });
    }

    return {
      ...result,
      routing: { provider: decision.provider, model: decision.model, reason: decision.reason },
    };
  }

  private async logAssistantMessage(
    conversationId: string,
    decision: any,
    content: string,
    tokensUsed: number,
    userId: string,
  ) {
    const msg = this.msgRepo.create({
      role: 'assistant',
      content,
      conversationId,
      provider: decision.provider,
      model: decision.model,
      tokensUsed,
      routingReason: decision.reason,
    });
    await this.msgRepo.save(msg);
    await this.usage.record(userId, tokensUsed, decision.provider);
  }
}
