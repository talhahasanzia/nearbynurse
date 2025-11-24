import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private jwks: any = null;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing token');

    const jwksUrl = process.env.SUPABASE_JWKS_URL;
    if (!jwksUrl) {
      throw new UnauthorizedException('SUPABASE_JWKS_URL not configured');
    }

    if (!this.jwks) {
      const anonKey = process.env.SUPABASE_ANON_KEY;
      const headers = anonKey ? { apikey: anonKey } : {};
      const res = await axios.get(jwksUrl, { headers });
      this.jwks = res.data.keys;
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid token format');
    }

    const jwk = this.jwks.find((key) => key.kid === decoded.header.kid);
    if (!jwk) {
      throw new UnauthorizedException('Invalid token key');
    }

    const pem = jwkToPem(jwk);

    try {
      jwt.verify(token, pem, { algorithms: ['RS256'] });
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

