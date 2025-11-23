import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  getProfile() {
    return { msg: 'Authenticated!' };
  }
}
