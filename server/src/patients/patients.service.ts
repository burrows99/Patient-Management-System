import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async getMe(userPayload: { userId: string; role: string }) {
    const user = await this.users.findOne({ where: { id: userPayload.userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, role: user.role };
  }
}
