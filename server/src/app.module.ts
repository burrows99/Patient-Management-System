import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { CasbinModule } from './casbin/casbin.module';
import { User } from './entities/user.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PatientInvite } from './entities/patient-invite.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'patient_mgmt',
        entities: [User, EmailVerificationToken, PatientInvite],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    PatientsModule,
    CasbinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
