import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; accessToken: string }> {
    const { email, password, tenantId, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists in this tenant');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = this.userRepository.create({
      ...userData,
      email,
      tenantId,
      passwordHash,
    });

    await this.userRepository.save(user);

    // Generate JWT
    const accessToken = this.generateAccessToken(user);

    return { user, accessToken };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate JWT
    const accessToken = this.generateAccessToken(user);

    return { user, accessToken };
  }

  async inviteWorker(tenantId: string, email: string, managerUserId: string): Promise<{ inviteToken: string }> {
    // Check if worker already exists
    const existingUser = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (existingUser) {
      throw new BadRequestException('Worker with this email already exists');
    }

    // Generate invite token (valid for 7 days)
    const inviteToken = this.jwtService.sign(
      {
        email,
        tenantId,
        invitedBy: managerUserId,
        type: 'worker_invite',
      },
      { expiresIn: '7d' },
    );

    // TODO: Send email with invite link

    return { inviteToken };
  }

  async inviteAccountant(tenantId: string, email: string, managerUserId: string): Promise<{ inviteToken: string }> {
    // Generate invite token (valid for 30 days)
    const inviteToken = this.jwtService.sign(
      {
        email,
        tenantId,
        invitedBy: managerUserId,
        type: 'accountant_invite',
      },
      { expiresIn: '30d' },
    );

    // TODO: Send email with invite link

    return { inviteToken };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload);
  }
}
