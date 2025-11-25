import { Injectable } from '@nestjs/common';
// Import PassportStrategy from package internal path to ensure type resolution
import { PassportStrategy } from '@nestjs/passport/dist/passport/passport.strategy';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class KeycloakJwtStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    // Use KEYCLOAK_URL (internal Docker URL) for JWKS fetching
    // Use KEYCLOAK_ISSUER (public URL) for token issuer validation
    const keycloakUrl = process.env.KEYCLOAK_URL
      ? `${process.env.KEYCLOAK_URL}/realms/master`
      : process.env.KEYCLOAK_ISSUER;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer: process.env.KEYCLOAK_ISSUER, // Must match token's 'iss' claim
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: `${keycloakUrl}/protocol/openid-connect/certs`,
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
