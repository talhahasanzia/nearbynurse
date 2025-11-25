import { Injectable } from '@nestjs/common';
// Import PassportStrategy from package internal path to ensure type resolution
import { PassportStrategy } from '@nestjs/passport/dist/passport/passport.strategy';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class KeycloakJwtStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer: process.env.KEYCLOAK_ISSUER, // e.g., "https://auth.myapp.com/realms/myrealm"
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 3,
      }),
    });
  }

  async validate(payload: any) {
    // payload.realm_access.roles contains roles when available
    return payload;
  }
}
