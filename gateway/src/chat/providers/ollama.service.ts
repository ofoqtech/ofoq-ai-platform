import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = config.get('OLLAMA_URL', 'http://ollama:11434');
  }

  async chat(model: string, messages: any[], stream: boolean, res?: Response): Promise<any> {
    const url = `${this.baseUrl}/api/chat`;

    try {
      if (stream && res) {
        return this.streamResponse(url, model, messages, res);
      }

      const response = await axios.post(url, { model, messages, stream: false }, { timeout: 120000 });
      return {
        content: response.data.message?.content || '',
        model,
        provider: 'ollama',
        usage: {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        },
      };
    } catch (err) {
      this.logger.error(`Ollama error: ${err.message}`);
      throw new ServiceUnavailableException('نموذج Ollama غير متاح حالياً');
    }
  }

  private async streamResponse(url: string, model: string, messages: any[], res: Response) {
    const response = await axios.post(url, { model, messages, stream: true }, {
      responseType: 'stream',
      timeout: 120000,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    let totalTokens = 0;
    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            res.write(`data: ${JSON.stringify({ content: data.message.content, provider: 'ollama' })}\n\n`);
          }
          if (data.done && data.eval_count) totalTokens = data.eval_count;
        } catch {}
      }
    });

    response.data.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true, totalTokens, provider: 'ollama' })}\n\n`);
      res.end();
    });

    response.data.on('error', () => {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/tags`);
      return res.data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
}
