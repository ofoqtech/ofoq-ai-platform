import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class CreateConversationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() systemPrompt?: string;
}

class ChatDto {
  @IsString() message: string;
  @IsOptional() @IsString() provider?: string; // 'auto' | 'ollama' | 'claude'
  @IsOptional() stream?: boolean;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'إنشاء محادثة جديدة' })
  create(@Request() req, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.id, dto.title, dto.systemPrompt);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'قائمة المحادثات' })
  list(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'تفاصيل محادثة مع الرسائل' })
  get(@Request() req, @Param('id') id: string) {
    return this.chatService.getConversation(id, req.user.id);
  }

  @Delete('conversations/:id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.chatService.deleteConversation(id, req.user.id);
    return { message: 'تم حذف المحادثة' };
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'إرسال رسالة (stream أو عادي)' })
  async sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ChatDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const stream = dto.stream === true;
    const result = await this.chatService.chat(
      req.user.id, id, dto.message, stream,
      dto.provider === 'auto' ? undefined : dto.provider,
      stream ? res : undefined,
    );

    if (!stream) return result;
  }
}
