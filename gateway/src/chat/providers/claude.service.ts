import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(private config: ConfigService) {
    this.apiKey = config.get('CLAUDE_API_KEY', '');
  }

  async chat(model: string, messages: any[], systemPrompt: string, stream: boolean, res?: Response): Promise<any> {
    if (!this.apiKey) throw new ServiceUnavailableException('Claude API Key غير مضبوط');

    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };

    const body: any = {
      model,
      max_tokens: 8096,
      messages,
    };
    if (systemPrompt) body.system = systemPrompt;

    try {
      if (stream && res) {
        return this.streamResponse(headers, body, res);
      }

      const response = await axios.post(`${this.baseUrl}/messages`, body, { headers, timeout: 120000 });
      const data = response.data;

      return {
        content: data.content?.[0]?.text || '',
        model: data.model,
        provider: 'claude',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    } catch (err) {
      this.logger.error(`Claude API error: ${err.response?.data?.error?.message || err.message}`);
      throw new ServiceUnavailableException('خطأ في Claude API');
    }
  }

  private async streamResponse(headers: any, body: any, res: Response) {
    const response = await axios.post(`${this.baseUrl}/messages`, { ...body, stream: true }, {
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
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              res.write(`data: ${JSON.stringify({ content: data.delta.text, provider: 'claude' })}\n\n`);
            }
            if (data.type === 'message_delta' && data.usage) {
              res.write(`data: ${JSON.stringify({ done: true, totalTokens: data.usage.output_tokens, provider: 'claude' })}\n\n`);
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
