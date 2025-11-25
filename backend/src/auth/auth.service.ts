import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class AuthService {
  // Use internal Docker URL for API calls, falls back to localhost for local dev
  private readonly keycloakUrl = process.env.KEYCLOAK_URL
    ? `${process.env.KEYCLOAK_URL}/realms/master`
    : (process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/master');

  private readonly keycloakBaseUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  private readonly clientId = process.env.KEYCLOAK_CLIENT_ID || 'nearbynurse-frontend';
  private readonly adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
  private readonly adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

  /**
   * Login user with username/password (Resource Owner Password Credentials flow)
   */
  async login(loginDto: LoginDto): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.clientId,
          username: loginDto.username,
          password: loginDto.password,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error: any) {
      console.error('Keycloak login error:', error.response?.data || error.message);

      // Check for specific Keycloak errors
      if (error.response?.data?.error === 'invalid_client') {
        throw new UnauthorizedException(
          'Keycloak client not configured. Go to http://localhost:8080/admin → Clients → nearbynurse-frontend → Enable "Direct access grants"'
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Register new user via Keycloak Admin API
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      // Get admin access token
      const adminToken = await this.getAdminToken();

      // Extract realm from issuer URL
      const realmMatch = this.keycloakUrl.match(/\/realms\/([^/]+)/);
      const realm = realmMatch ? realmMatch[1] : 'master';

      // Create user
      const createUserResponse = await axios.post(
        `${this.keycloakBaseUrl}/admin/realms/${realm}/users`,
        {
          username: registerDto.username,
          email: registerDto.email,
          firstName: registerDto.firstName || '',
          lastName: registerDto.lastName || '',
          enabled: true,
          emailVerified: true,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Get user ID from Location header
      const locationHeader = createUserResponse.headers.location;
      const userId = locationHeader?.split('/').pop();

      if (!userId) {
        throw new Error('Failed to get user ID after creation');
      }

      // Set password
      await axios.put(
        `${this.keycloakBaseUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
        {
          type: 'password',
          value: registerDto.password,
          temporary: false,
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { message: 'User registered successfully' };
    } catch (error: any) {
      console.error('Keycloak registration error:', error.response?.data || error.message);

      if (error.response?.status === 409) {
        throw new BadRequestException('Username or email already exists');
      }

      throw new BadRequestException('Registration failed: ' + (error.response?.data?.errorMessage || error.message));
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get admin access token for user management
   */
  private async getAdminToken(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.adminUsername,
          password: this.adminPassword,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      console.error('Admin token error:', error.response?.data || error.message);
      throw new Error('Failed to get admin token');
    }
  }
}

