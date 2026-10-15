import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private config: ConfigService) {
    this.apiKey = config.get('OPENROUTER_API_KEY', '');
  }

  async chat(model: string, messages: any[], systemPrompt: string, stream: boolean, res?: Response): Promise<any> {
    if (!this.apiKey) throw new ServiceUnavailableException('OpenRouter API Key غير مضبوط');

    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ofoq-ai-platform.tech',
      'X-Title': 'Ofoq AI Platform',
    };

    const body: any = { model, messages: allMessages, max_tokens: 8096 };

    try {
      if (stream && res) {
        return this.streamResponse(headers, { ...body, stream: true }, res);
      }

      const response = await axios.post(`${this.baseUrl}/chat/completions`, body, { headers, timeout: 120000 });
      const data = response.data;

      return {
        content: data.choices?.[0]?.message?.content || '',
        model: data.model || model,
        provider: 'openrouter',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (err) {
      this.logger.error(`OpenRouter error: ${err.response?.data?.error?.message || err.message}`);
      throw new ServiceUnavailableException('خطأ في OpenRouter API');
    }
  }

  private async streamResponse(headers: any, body: any, res: Response) {
    const response = await axios.post(`${this.baseUrl}/chat/completions`, body, {
      headers,
      responseType: 'stream',
      timeout: 120000,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    let buffer = '';
    response.data.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content, provider: 'openrouter' })}\n\n`);
            }
            if (data.choices?.[0]?.finish_reason === 'stop') {
              res.write(`data: ${JSON.stringify({ done: true, provider: 'openrouter' })}\n\n`);
            }
          } catch {}
        }
      }
    });

    response.data.on('end', () => res.end());
    response.data.on('error', () => { res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`); res.end(); });
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
