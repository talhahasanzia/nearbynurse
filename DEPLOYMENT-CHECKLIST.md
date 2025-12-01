# Deployment Checklist

Use this checklist when deploying to AWS Lightsail.

## Pre-Deployment

### Local Setup
- [ ] Review `DEPLOYMENT-UPDATE-SUMMARY.md`
- [ ] Review `INTERACTIVE-DEPLOYMENT.md`
- [ ] Ensure `.gitignore` includes `.env` files
- [ ] Commit and push changes to repository (excluding .env files)
- [ ] Prepare strong passwords for production

### AWS Lightsail Setup
- [ ] Instance is running (Ubuntu 22.04 recommended)
- [ ] Security group allows inbound traffic on ports 80 and 443
- [ ] SSH key is configured
- [ ] Public IP is noted: `54.254.253.205`

## Deployment Steps

### 1. Connect to Instance
```bash
ssh -i your-key.pem ubuntu@54.254.253.205
```
- [ ] Successfully connected

### 2. Prepare Environment
```bash
sudo apt update
sudo apt upgrade -y
```
- [ ] System updated

### 3. Clone/Download Project
```bash
# Option A: Clone from Git
git clone <your-repository-url>
cd nearbynurse

# Option B: Upload deploy script
# Upload deploy-lightsail.sh and project files
```
- [ ] Project files on server

### 4. Run Deployment Script
```bash
sudo ./deploy-lightsail.sh
```
- [ ] Script is executable
- [ ] Script started successfully

### 5. Interactive Configuration

#### Database Configuration
- [ ] PostgreSQL Password: `_______________`
- [ ] Database Name: `_______________`

#### Keycloak Database
- [ ] Keycloak DB User: `_______________`
- [ ] Keycloak DB Password: `_______________`
- [ ] Keycloak DB Name: `_______________`

#### Keycloak Admin
- [ ] Admin Username: `_______________`
- [ ] Admin Password: `_______________`

#### Application Settings
- [ ] Backend Port: `3000`
- [ ] Node Environment: `production`
- [ ] Keycloak Realm: `master`
- [ ] Keycloak Client ID: `nearbynurse-frontend`
- [ ] API URL: `/api`

#### Confirmation
- [ ] Reviewed configuration summary
- [ ] Confirmed configuration (answered 'y')

### 6. Wait for Deployment
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Public IP detected
- [ ] Environment files created
- [ ] Nginx configured
- [ ] Services building (may take 5-15 minutes)
- [ ] Services started
- [ ] Health checks passing

### 7. Verify Deployment
- [ ] Frontend accessible: `http://54.254.253.205`
- [ ] Backend API accessible: `http://54.254.253.205/api`
- [ ] Keycloak accessible: `http://54.254.253.205/auth`
- [ ] Keycloak Admin accessible: `http://54.254.253.205/auth/admin`

## Post-Deployment

### 1. Configure Keycloak Client

#### Access Keycloak Admin Console
URL: `http://54.254.253.205/auth/admin`
- [ ] Logged in with admin credentials

#### Update Client Settings
Navigate to: Clients → `nearbynurse-frontend`

- [ ] **Valid Redirect URIs** updated to:
  ```
  http://54.254.253.205/*
  ```

- [ ] **Valid Post Logout Redirect URIs** updated to:
  ```
  http://54.254.253.205/*
  ```

- [ ] **Web Origins** updated to:
  ```
  http://54.254.253.205
  ```

- [ ] Saved changes

### 2. Test Authentication

- [ ] Navigate to `http://54.254.253.205`
- [ ] Click Login/Register
- [ ] Redirected to Keycloak
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Redirected back to app
- [ ] User info displayed
- [ ] Can logout successfully

### 3. Security Hardening

#### Passwords
- [ ] Changed default database passwords
- [ ] Changed default Keycloak admin password
- [ ] Passwords are strong (16+ chars, mixed case, numbers, symbols)
- [ ] Passwords documented securely (password manager)

#### Firewall
- [ ] Lightsail firewall rules configured
- [ ] Only ports 80 and 443 open
- [ ] Direct access to 3000, 5173, 8080 blocked

#### Environment Files
- [ ] `.env` files have restricted permissions (600)
  ```bash
  chmod 600 .env.docker backend/.env frontend/.env
  ```
- [ ] `.env` files not in Git repository

### 4. SSL/TLS Setup (Production)

- [ ] Domain name configured (if applicable)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Nginx configured for HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Updated all URLs to use `https://`
- [ ] Updated Keycloak client redirect URIs to HTTPS
- [ ] Updated environment variables to use HTTPS

### 5. Monitoring & Maintenance

#### Check Service Status
```bash
sudo docker-compose ps
```
- [ ] All services running
- [ ] All services healthy

#### View Logs
```bash
sudo docker-compose logs -f
```
- [ ] No critical errors
- [ ] Services responding normally

#### Set Up Monitoring
- [ ] Configure Lightsail monitoring
- [ ] Set up alerts for high CPU/memory
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

### 6. Backup Strategy

- [ ] Database backup scheduled
  ```bash
  # Example: Add to crontab
  0 2 * * * docker exec nearbynurse-db-1 pg_dump -U postgres mydb > /backup/db_$(date +\%Y\%m\%d).sql
  ```
- [ ] Keycloak database backup scheduled
- [ ] `.env` files backed up securely
- [ ] Backup restoration tested

### 7. Documentation

- [ ] Document deployment date and configuration
- [ ] Document admin credentials (securely)
- [ ] Document any custom changes made
- [ ] Update team wiki/documentation
- [ ] Share access information with team

## Troubleshooting

If issues occur, check:

### Services Not Starting
```bash
sudo docker-compose logs keycloak
sudo docker-compose logs backend
sudo docker-compose logs frontend
sudo docker-compose logs nginx
```

### Authentication Not Working
- [ ] Keycloak client redirect URIs correct
- [ ] Web origins configured
- [ ] JWT issuer matches in backend/.env
- [ ] Browser console for errors

### Database Connection Issues
- [ ] Database container running
- [ ] DATABASE_URL correct in backend/.env
- [ ] Database initialized

### Nginx Issues
- [ ] Nginx container running
- [ ] Server name includes public IP
- [ ] Proxy settings correct

### Reset and Redeploy
```bash
sudo docker-compose down -v  # WARNING: Deletes all data!
sudo ./deploy-lightsail.sh
```

## Production Checklist

Additional steps for production:

- [ ] Use strong, unique passwords (16+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules properly
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Set up log aggregation
- [ ] Document disaster recovery plan
- [ ] Test backup restoration
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline
- [ ] Perform security audit
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable security headers
- [ ] Set up DDoS protection

## Success Criteria

Deployment is successful when:

- [x] All services are running
- [x] All health checks passing
- [x] Frontend loads correctly
- [x] API responds to requests
- [x] Keycloak authentication works
- [x] Users can register and login
- [x] No critical errors in logs
- [x] Security best practices implemented

## Sign-Off

- Deployed by: `_______________`
- Date: `_______________`
- Environment: `[ ] Development  [ ] Staging  [ ] Production`
- Notes: `_______________________________________________`

---

**Congratulations on your deployment! 🎉**

