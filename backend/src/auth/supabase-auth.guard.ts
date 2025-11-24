import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing token');

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      throw new UnauthorizedException('SUPABASE_JWT_SECRET not configured');
    }

    try {
      // Supabase uses HS256 (HMAC with SHA-256) for JWT signing
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      req.user = decoded; // Attach decoded user to request
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

