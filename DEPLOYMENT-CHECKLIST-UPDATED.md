# 🚀 NearbyNurse Deployment Checklist

Use this checklist to ensure a smooth deployment to AWS Lightsail.

## Pre-Deployment ✅

### Local Setup
- [ ] All code changes committed to Git
- [ ] Repository pushed to GitHub
- [ ] Docker-compose.yml updated (version field removed)
- [ ] Environment variables documented

### Lightsail Instance Setup
- [ ] Lightsail instance created (Amazon Linux 2)
- [ ] Instance size: At least 2GB RAM (recommended: 4GB)
- [ ] SSH key pair downloaded and configured
- [ ] Can SSH into instance successfully

### Firewall Configuration
- [ ] Port 22 (SSH) - Open to your IP only
- [ ] Port 80 (HTTP) - Open to all
- [ ] Port 443 (HTTPS) - Open to all (if using SSL)
- [ ] Public IP address noted: `__________________`

---

## Deployment Steps ✅

### Step 1: Connect to Instance
```bash
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
```
- [ ] Successfully connected via SSH
- [ ] Can execute sudo commands

### Step 2: Clone Repository
```bash
cd ~
git clone https://github.com/talhahasanzia/nearbynurse.git
cd nearbynurse
```
- [ ] Repository cloned successfully
- [ ] In correct directory (`~/nearbynurse`)

### Step 3: Make Script Executable
```bash
chmod +x deploy-lightsail.sh
```
- [ ] Script is executable

### Step 4: Run Deployment Script
```bash
./deploy-lightsail.sh
```
- [ ] Script started successfully
- [ ] System packages updated
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Docker Buildx installed
- [ ] Git installed
- [ ] Environment variables configured
- [ ] Services built and started

### Step 5: Verify Installation
```bash
cd ~/nearbynurse
docker compose ps
```
- [ ] All services showing "Up"
- [ ] No errors in `docker compose ps`
- [ ] Backend accessible: `curl http://localhost/api`
- [ ] Frontend accessible: `curl http://localhost`
- [ ] Keycloak accessible: `curl http://localhost/auth`

---

## Post-Deployment Configuration ✅

### Keycloak Setup
Access: `http://YOUR_PUBLIC_IP/auth/admin`

- [ ] Logged in as admin
- [ ] Created realm or using master
- [ ] Created client: `nearbynurse-frontend`
- [ ] Configured client settings:
  - [ ] Valid Redirect URIs: `http://YOUR_PUBLIC_IP/*`
  - [ ] Valid Post Logout URIs: `http://YOUR_PUBLIC_IP/*`
  - [ ] Web Origins: `http://YOUR_PUBLIC_IP`
  - [ ] Direct Access Grants enabled
  - [ ] Client saved
- [ ] Created test user (optional)
  - [ ] Username: _______________
  - [ ] Password set
  - [ ] Email verified (if required)

### Application Testing
- [ ] Frontend loads: `http://YOUR_PUBLIC_IP`
- [ ] Can see login page
- [ ] Can register new user
- [ ] Can log in with test user
- [ ] Backend API responding: `http://YOUR_PUBLIC_IP/api`
- [ ] No console errors in browser

---

## Security Hardening ✅

### Change Default Passwords
```bash
cd ~/nearbynurse
nano .env
nano backend/.env
```

- [ ] Changed `DB_PASSWORD`
- [ ] Changed `KC_DB_PASSWORD`
- [ ] Changed `KC_ADMIN_PASSWORD`
- [ ] Changed other sensitive credentials
- [ ] Restarted services: `docker compose down && docker compose up -d`

### Firewall Rules
- [ ] SSH restricted to your IP only
- [ ] Unnecessary ports closed
- [ ] Only 80, 443, 22 open

### SSL/HTTPS Setup (Recommended)
- [ ] Domain name configured (optional)
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Nginx configured for HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal configured

---

## Monitoring Setup ✅

### Log Monitoring
```bash
cd ~/nearbynurse
docker compose logs -f
```
- [ ] Can view logs
- [ ] No critical errors
- [ ] Services healthy

### Resource Monitoring
```bash
docker stats
free -h
df -h
```
- [ ] CPU usage acceptable
- [ ] Memory usage acceptable
- [ ] Disk space sufficient (>20% free)

### Health Checks
- [ ] Backend health endpoint: `curl http://localhost/api`
- [ ] Frontend responds: `curl http://localhost`
- [ ] Database accessible
- [ ] Keycloak responds: `curl http://localhost/auth`

---

## Backup Configuration ✅

### Database Backup
```bash
# Create backup script
cat > ~/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cd ~/nearbynurse
docker compose exec -T db pg_dump -U postgres mydb > ~/backups/db_$DATE.sql
docker compose exec -T keycloak-db pg_dump -U keycloak keycloak > ~/backups/kc_$DATE.sql
find ~/backups -name "*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup.sh
mkdir -p ~/backups
```

- [ ] Backup script created
- [ ] Can run backup manually: `~/backup.sh`
- [ ] Backup files created in `~/backups/`
- [ ] Cron job configured (optional): `0 2 * * * ~/backup.sh`

---

## Documentation ✅

### Record Important Information

**Server Details:**
- Public IP: `__________________`
- Instance ID: `__________________`
- Region: `__________________`
- Instance Type: `__________________`

**Access URLs:**
- Frontend: `http://________________/`
- Backend API: `http://________________/api`
- Keycloak Admin: `http://________________/auth/admin`

**Credentials (Store Securely!):**
- SSH Key Location: `__________________`
- Keycloak Admin User: `__________________`
- Keycloak Admin Pass: `__________________`
- DB Password: `__________________`

**Important Files:**
- Environment: `~/nearbynurse/.env`
- Backend Env: `~/nearbynurse/backend/.env`
- Frontend Env: `~/nearbynurse/frontend/.env`
- Docker Compose: `~/nearbynurse/docker-compose.yml`
- Nginx Config: `~/nearbynurse/nginx/nginx.conf`

---

## Troubleshooting Reference ✅

### Quick Diagnostics
```bash
cd ~/nearbynurse

# Check service status
docker compose ps

# View all logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs keycloak

# Restart services
docker compose restart

# Full rebuild
docker compose down
docker compose up -d --build
```

### Common Issues
- [ ] Services won't start → Check `DOCKER-TROUBLESHOOTING.md`
- [ ] Can't access from browser → Check firewall rules
- [ ] Keycloak errors → Check `KEYCLOAK-SETUP.md`
- [ ] Build errors → Ensure Buildx installed
- [ ] Permission errors → Check docker group: `groups`

---

## Maintenance Schedule ✅

### Daily
- [ ] Check service status: `docker compose ps`
- [ ] Review logs for errors
- [ ] Monitor disk space: `df -h`

### Weekly
- [ ] Review access logs
- [ ] Check for security updates
- [ ] Verify backups working
- [ ] Test restore procedure

### Monthly
- [ ] Update system packages: `sudo yum update`
- [ ] Update Docker images: `docker compose pull && docker compose up -d`
- [ ] Review and rotate logs
- [ ] Security audit

---

## Rollback Plan ✅

If deployment fails:

### Option 1: Restart Services
```bash
cd ~/nearbynurse
docker compose down
docker compose up -d --build
```

### Option 2: Check Logs
```bash
docker compose logs -f
# Identify the problem
# Fix configuration
# Restart
```

### Option 3: Fresh Deployment
```bash
cd ~
rm -rf nearbynurse
git clone https://github.com/talhahasanzia/nearbynurse.git
cd nearbynurse
./deploy-lightsail.sh
```

### Option 4: Restore from Backup
```bash
cd ~/nearbynurse
docker compose down -v
# Restore database
docker compose up -d db
cat ~/backups/db_LATEST.sql | docker compose exec -T db psql -U postgres mydb
docker compose up -d
```

---

## Success Criteria ✅

Deployment is successful when:

- [ ] ✅ All services running (`docker compose ps` shows all "Up")
- [ ] ✅ Frontend accessible from browser
- [ ] ✅ Backend API responding
- [ ] ✅ Keycloak admin console accessible
- [ ] ✅ User can register
- [ ] ✅ User can log in
- [ ] ✅ No errors in logs
- [ ] ✅ All security measures implemented
- [ ] ✅ Backups configured
- [ ] ✅ Monitoring in place

---

## Additional Resources

- **Full Deployment Guide**: `LIGHTSAIL-DEPLOYMENT.md`
- **Troubleshooting**: `DOCKER-TROUBLESHOOTING.md`
- **Quick Reference**: `QUICK-DEPLOYMENT-REFERENCE.md`
- **Fixes Summary**: `DEPLOYMENT-FIXES-SUMMARY.md`
- **Keycloak Setup**: `KEYCLOAK-SETUP.md`

---

## Notes

**Deployment Date**: _______________

**Deployed By**: _______________

**Issues Encountered**:
- 
- 
- 

**Resolutions**:
- 
- 
- 

**Additional Comments**:




---

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Failed

---

_This checklist is based on the fixed deployment process with all known issues resolved._
_Last Updated: December 1, 2025_

