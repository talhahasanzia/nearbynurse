import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { KeycloakAuthGuard } from './auth/keycloak-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    // When authenticated via Keycloak, req.user will contain the token payload
    return { user: req.user || null };
  }
}
