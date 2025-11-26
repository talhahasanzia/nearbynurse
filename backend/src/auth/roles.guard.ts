import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', ctx.getHandler());
    if (!requiredRoles) return true;

    const { user } = ctx.switchToHttp().getRequest();

    const roles: string[] = user?.realm_access?.roles || [];

    const hasRole = requiredRoles.every((r) => roles.includes(r));
    if (!hasRole) throw new ForbiddenException('Missing required roles');

    return true;
  }
}

