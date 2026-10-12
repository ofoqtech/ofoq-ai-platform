import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from './entities/user.entity';
import { ApiKey } from './entities/api-key.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, name: string, password: string, role = UserRole.DEVELOPER) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');

    const hashed = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ email, name, password: hashed, role });
    await this.userRepo.save(user);

    return this.login(user);
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
      select: ['id', 'email', 'name', 'role', 'password', 'monthlyTokenLimit', 'tokensUsedThisMonth'],
    });
    if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    return user;
  }

  async validateJwt(payload: any): Promise<User> {
    return this.userRepo.findOne({ where: { id: payload.sub, isActive: true } });
  }

  async createApiKey(userId: string, name: string): Promise<ApiKey> {
    const key = `oai_${uuidv4().replace(/-/g, '')}`;
    const apiKey = this.apiKeyRepo.create({ key, name, userId });
    return this.apiKeyRepo.save(apiKey);
  }

  async validateApiKey(key: string): Promise<User | null> {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { key, isActive: true },
      relations: ['user'],
    });
    if (!apiKey || !apiKey.user.isActive) return null;

    await this.apiKeyRepo.update(apiKey.id, { lastUsedAt: new Date() });
    return apiKey.user;
  }

  async listApiKeys(userId: string) {
    return this.apiKeyRepo.find({ where: { userId }, select: ['id', 'name', 'isActive', 'lastUsedAt', 'createdAt'] });
  }

  async revokeApiKey(id: string, userId: string) {
    await this.apiKeyRepo.update({ id, userId }, { isActive: false });
  }

  async getUsers() {
    return this.userRepo.find({ select: ['id', 'email', 'name', 'role', 'isActive', 'monthlyTokenLimit', 'tokensUsedThisMonth', 'createdAt'] });
  }

  async updateUserLimit(userId: string, limit: number) {
    await this.userRepo.update(userId, { monthlyTokenLimit: limit });
  }

  async toggleUser(userId: string, isActive: boolean) {
    await this.userRepo.update(userId, { isActive });
  }
}
