import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { PatientInvite } from '../entities/patient-invite.entity';
import { createTransport } from 'nodemailer';
import { randomBytes } from 'crypto';
import { CASBIN_ENFORCER } from '../casbin/casbin.module';
import type { Enforcer } from 'casbin';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(EmailVerificationToken) private readonly emailTokens: Repository<EmailVerificationToken>,
    @InjectRepository(PatientInvite) private readonly invites: Repository<PatientInvite>,
    private readonly jwt: JwtService,
    @Inject(CASBIN_ENFORCER) private readonly enforcer: Enforcer,
  ) {}

  private getTransport() {
    return createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }

  async registerDoctor(email: string, password: string) {
    const exists = await this.users.findOne({ where: { email } });
    if (exists) throw new BadRequestException('Email already registered');
    const user = await this.users.save({ email, role: 'doctor', passwordHash: await bcrypt.hash(password, 10), emailVerified: false });
    const token = await this.emailTokens.save({ user, token: cryptoRandom(), expiresAt: futureMinutes(60) });
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify?token=${token.token}`;
    await this.getTransport().sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Verify your email', text: `Verify: ${verifyUrl}` });
    return { message: 'Registered. Check email to verify.' };
  }

  async verifyEmail(tokenValue: string) {
    const token = await this.emailTokens.findOne({ where: { token: tokenValue } });
    if (!token || token.expiresAt < new Date()) throw new BadRequestException('Invalid token');
    await this.users.update({ id: token.user.id }, { emailVerified: true });
    await this.emailTokens.delete({ id: token.id });
    return { message: 'Email verified. You can login now.' };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException();
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException();
    if (!user.emailVerified && user.role === 'doctor') throw new UnauthorizedException('Email not verified');
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, role: user.role };
  }

  async invitePatient(requestUser: any, email: string) {
    if (requestUser.role !== 'doctor') throw new UnauthorizedException('Only doctors can invite');
    const token = await this.invites.save({ email, token: cryptoRandom(), invitedBy: { id: requestUser.userId } as any, expiresAt: futureMinutes(120) });
    const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/patient-login?token=${token.token}`;
    await this.getTransport().sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Patient Login Link', text: `Login: ${link}` });
    return { message: 'Invite sent' };
  }

  async patientLoginWithToken(tokenValue: string) {
    const invite = await this.invites.findOne({ where: { token: tokenValue } });
    if (!invite || invite.expiresAt < new Date()) throw new BadRequestException('Invalid token');
    let user = await this.users.findOne({ where: { email: invite.email } });
    if (!user) {
      user = await this.users.save({ email: invite.email, role: 'patient', emailVerified: true, passwordHash: null });
    }
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    await this.invites.delete({ id: invite.id });
    return { accessToken, role: user.role };
  }
}

function cryptoRandom(): string {
  return randomBytes(16).toString('hex');
}

function futureMinutes(minutes: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

