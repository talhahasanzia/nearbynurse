import { Controller, Get, UseGuards } from '@nestjs/common';
import { KeycloakAuthGuard } from './auth/keycloak-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

@Controller('demo')
@UseGuards(KeycloakAuthGuard, RolesGuard)
export class DemoController {
  @Get('protected')
  getProtected() {
    return { ok: true };
  }

  @Roles('admin')
  @Get('admin-only')
  getAdmin() {
    return { secret: 'admin data' };
  }
}

