import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakJwtStrategy } from './keycloak.strategy';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'keycloak' })],
  controllers: [AuthController],
  providers: [KeycloakJwtStrategy, RolesGuard, AuthService],
  exports: [RolesGuard, AuthService],
})
export class AuthModule {}
