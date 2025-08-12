import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RegisterDto, LoginDto, InviteDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.registerDoctor(dto.email, dto.password);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  invite(@Req() req: any, @Body() dto: InviteDto) {
    return this.authService.invitePatient(req.user, dto.email);
  }

  @Get('patient-login')
  patientLogin(@Query('token') token: string) {
    return this.authService.patientLoginWithToken(token);
  }
}
