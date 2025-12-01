# Interactive Deployment Guide

## Overview

The `deploy-lightsail.sh` script has been updated with **interactive environment variable collection**. Instead of using hardcoded values, the script now prompts you for each configuration value during deployment.

## What's New

### Interactive Configuration Prompts

When you run the deployment script, it will ask you for:

1. **Database Configuration**
   - PostgreSQL Password (default: `password`)
   - Database Name (default: `mydb`)

2. **Keycloak Database**
   - Keycloak DB User (default: `keycloak`)
   - Keycloak DB Password (default: `keycloak`)
   - Keycloak DB Name (default: `keycloak`)

3. **Keycloak Admin Credentials**
   - Admin Username (default: `admin`)
   - Admin Password (default: `admin`, input is hidden)

4. **Application Configuration**
   - Backend Port (default: `3000`)
   - Node Environment (default: `production`)
   - Keycloak Realm (default: `master`)
   - Keycloak Client ID (default: `nearbynurse-frontend`)
   - API URL (default: `/api`)

### Automatic Configuration Summary

After entering all values, the script displays a summary and asks for confirmation. If you notice any mistakes, you can restart the configuration process.

## Deployment Steps

### 1. Prepare Your AWS Lightsail Instance

```bash
# SSH into your Lightsail instance
ssh -i your-key.pem ubuntu@54.254.253.205
```

### 2. Download the Deployment Script

```bash
# If cloning from repository
git clone https://github.com/your-repo/nearbynurse.git
cd nearbynurse

# Or if uploading the script
wget https://your-url/deploy-lightsail.sh
chmod +x deploy-lightsail.sh
```

### 3. Run the Interactive Deployment

```bash
sudo ./deploy-lightsail.sh
```

### 4. Follow the Prompts

The script will guide you through:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Interactive Environment Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide the following configuration values.
Press Enter to use default values shown in [brackets].

━━━ Database Configuration ━━━
PostgreSQL Password [password]: mySecurePassword123
Database Name [mydb]: nearbynurse_db

━━━ Keycloak Database ━━━
Keycloak DB User [keycloak]: kc_user
Keycloak DB Password [keycloak]: kcSecurePass456
Keycloak DB Name [keycloak]: keycloak_db

━━━ Keycloak Admin Credentials ━━━
Keycloak Admin Username [admin]: myadmin
Keycloak Admin Password [admin]: (hidden input)

━━━ Application Configuration ━━━
Backend Port [3000]: 3000
Node Environment [production]: production
Keycloak Realm [master]: master
Keycloak Client ID [nearbynurse-frontend]: nearbynurse-frontend
API URL [/api]: /api

━━━ Configuration Summary ━━━
Database Password: mySecurePassword123
Database Name: nearbynurse_db
Keycloak DB User: kc_user
Keycloak DB Name: keycloak_db
Keycloak Admin Username: myadmin
Backend Port: 3000
Node Environment: production
Keycloak Realm: master
Keycloak Client ID: nearbynurse-frontend
API URL: /api
Public IP: 54.254.253.205

Is this configuration correct? (y/n) [y]: y
```

## Generated Files

The script automatically creates and configures:

### 1. `.env.docker` (linked as `.env`)
Docker Compose environment file with all your configuration:
```env
PUBLIC_IP=54.254.253.205
DB_PASSWORD=mySecurePassword123
DB_NAME=nearbynurse_db
KC_DB_NAME=keycloak_db
KC_DB_USER=kc_user
KC_DB_PASSWORD=kcSecurePass456
KC_ADMIN_USER=myadmin
KC_ADMIN_PASSWORD=yourSecurePassword
VITE_API_URL=/api
VITE_KEYCLOAK_URL=http://54.254.253.205/auth
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=nearbynurse-frontend
```

### 2. `backend/.env`
Backend-specific configuration:
```env
DATABASE_URL=postgresql://postgres:mySecurePassword123@db:5432/nearbynurse_db
PORT=3000
NODE_ENV=production
KEYCLOAK_ISSUER=http://54.254.253.205/auth/realms/master
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=nearbynurse-frontend
KEYCLOAK_ADMIN_USERNAME=myadmin
KEYCLOAK_ADMIN_PASSWORD=yourSecurePassword
```

### 3. `frontend/.env`
Frontend-specific configuration:
```env
VITE_API_URL=/api
VITE_KEYCLOAK_URL=http://54.254.253.205/auth
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=nearbynurse-frontend
```

## Benefits of Interactive Deployment

✅ **Security**: No hardcoded credentials in scripts or repositories
✅ **Flexibility**: Different values for dev/staging/production
✅ **Validation**: Confirmation step before deployment
✅ **Documentation**: Clear summary of all configured values
✅ **Repeatability**: Easy to redeploy with different configurations

## Using Default Values

To quickly deploy with all defaults (useful for development):

Simply press **Enter** for each prompt to accept the default value.

## Password Security

- Keycloak admin password input is **hidden** (uses `-sp` flag)
- Passwords are never logged or displayed
- All sensitive values are stored in `.env` files (should be in `.gitignore`)

## Post-Deployment Configuration

After deployment completes, you still need to configure Keycloak:

### 1. Access Keycloak Admin Console

URL: `http://54.254.253.205/auth/admin`
Username: `<your configured admin username>`
Password: `<your configured admin password>`

### 2. Update Client Configuration

1. Navigate to: **Clients** → `nearbynurse-frontend`
2. Update **Valid Redirect URIs**:
   ```
   http://54.254.253.205/*
   ```
3. Update **Web Origins**:
   ```
   http://54.254.253.205
   ```
4. Click **Save**

## Troubleshooting

### Configuration Mistakes

If you entered wrong values:
- Answer `n` when asked for confirmation
- The script will restart the configuration process

### Restart Deployment

If deployment fails:
```bash
cd nearbynurse
sudo docker-compose down -v  # Warning: removes all data!
sudo ./deploy-lightsail.sh
```

### View Generated Configuration

```bash
cat .env.docker
cat backend/.env
cat frontend/.env
```

### Manual Configuration Update

If you need to change values after deployment:

1. Edit the environment files:
```bash
nano .env.docker
nano backend/.env
nano frontend/.env
```

2. Rebuild and restart:
```bash
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

## Environment Variables Reference

| Variable | Description | Default | Used By |
|----------|-------------|---------|---------|
| `PUBLIC_IP` | Server public IP address | Auto-detected | All services |
| `DB_PASSWORD` | PostgreSQL password | `password` | Database |
| `DB_NAME` | PostgreSQL database name | `mydb` | Database, Backend |
| `KC_DB_USER` | Keycloak DB username | `keycloak` | Keycloak DB |
| `KC_DB_PASSWORD` | Keycloak DB password | `keycloak` | Keycloak DB |
| `KC_DB_NAME` | Keycloak DB name | `keycloak` | Keycloak DB |
| `KC_ADMIN_USER` | Keycloak admin username | `admin` | Keycloak |
| `KC_ADMIN_PASSWORD` | Keycloak admin password | `admin` | Keycloak |
| `BACKEND_PORT` | Backend server port | `3000` | Backend |
| `NODE_ENV` | Node environment | `production` | Backend |
| `KC_REALM` | Keycloak realm | `master` | All services |
| `KC_CLIENT_ID` | Keycloak client ID | `nearbynurse-frontend` | Backend, Frontend |
| `API_URL` | API endpoint URL | `/api` | Frontend |

## Security Best Practices

⚠️ **Important Security Recommendations**:

1. **Change Default Passwords**
   - Use strong, unique passwords for all services
   - Minimum 16 characters with mixed case, numbers, symbols

2. **Protect Environment Files**
   ```bash
   chmod 600 .env.docker backend/.env frontend/.env
   ```

3. **Enable HTTPS**
   - Install SSL certificate (Let's Encrypt)
   - Update all URLs to use `https://`

4. **Firewall Configuration**
   - Only open ports 80 and 443
   - Block direct access to 3000, 5173, 8080

5. **Regular Updates**
   ```bash
   sudo docker-compose pull
   sudo docker-compose up -d --build
   ```

## Next Steps

After successful deployment:

1. ✅ Configure Keycloak client settings
2. ✅ Set up SSL/TLS certificates
3. ✅ Configure firewall rules
4. ✅ Set up monitoring and logging
5. ✅ Create backup strategy
6. ✅ Test authentication flow

## Support

For issues or questions:
- Check deployment logs: `sudo docker-compose logs -f`
- Review error messages in the script output
- Verify all environment variables are set correctly
- Ensure public IP is accessible and ports are open

