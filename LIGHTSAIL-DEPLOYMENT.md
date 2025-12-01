# 🚀 Amazon Lightsail Deployment Guide

Complete guide for deploying NearbyNurse to Amazon Lightsail VPS.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment (Automated Script)](#quick-deployment-automated-script)
3. [Manual Deployment Steps](#manual-deployment-steps)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Verification](#verification)
6. [Management Commands](#management-commands)
7. [Troubleshooting](#troubleshooting)
8. [Security Hardening](#security-hardening)
9. [Updating the Application](#updating-the-application)

---

## 🎯 Prerequisites

### Amazon Lightsail Instance

1. **Create Lightsail Instance:**
   - OS: Amazon Linux 2
   - Plan: At least 2GB RAM recommended (for all containers)
   - Region: Choose closest to your users

2. **Configure Firewall Rules:**
   - Go to: Instance → Networking tab
   - Add these rules:
     - HTTP: TCP, Port 80
     - HTTPS: TCP, Port 443
     - SSH: TCP, Port 22

3. **Setup SSH Access:**
   - Download SSH key from Lightsail console
   - Set permissions: `chmod 400 your-key.pem`

### Local Machine

- SSH client
- Git (to push code to your repository)

---

## 🚀 Quick Deployment (Automated Script)

### Option 1: Direct Deployment on Server

**Best for:** First-time deployment

```bash
# 1. SSH into your Lightsail instance
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# 2. Download the deployment script
curl -O https://raw.githubusercontent.com/yourusername/nearbynurse/main/deploy-lightsail.sh

# 3. Make it executable
chmod +x deploy-lightsail.sh

# 4. Edit the script to set your GitHub repository URL
nano deploy-lightsail.sh
# Change: GITHUB_REPO="https://github.com/yourusername/nearbynurse.git"

# 5. Run the deployment script
./deploy-lightsail.sh

# 6. Follow the on-screen instructions
```

### Option 2: Deploy from Your Repository

**Best for:** When you already have code in repository

```bash
# 1. Push deployment script to your repository
git add deploy-lightsail.sh
git commit -m "Add deployment script"
git push origin main

# 2. SSH into Lightsail instance
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# 3. Clone repository
git clone https://github.com/yourusername/nearbynurse.git
cd nearbynurse

# 4. Run deployment script
chmod +x deploy-lightsail.sh
./deploy-lightsail.sh
```

### What the Script Does

The automated script performs these steps:

1. ✅ Updates system packages
2. ✅ Installs Docker and Docker Compose
3. ✅ Installs Git
4. ✅ Clones your repository
5. ✅ Detects public IP address
6. ✅ Configures Nginx with public IP
7. ✅ Creates backend environment configuration
8. ✅ Creates root environment configuration
9. ✅ Builds and starts Docker containers
10. ✅ Waits for services to be healthy
11. ✅ Verifies deployment
12. ✅ Displays access information
13. ✅ Shows Keycloak configuration steps
14. ✅ Provides security recommendations

---

## 🔧 Manual Deployment Steps

If you prefer to understand each step or the script fails:

### Step 1: Connect to Instance

```bash
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
```

### Step 2: Update System

```bash
sudo yum update -y
```

### Step 3: Install Docker

```bash
# Install Docker
sudo yum install docker -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (avoid sudo)
sudo usermod -a -G docker ec2-user

# Verify installation
docker --version
```

**Important:** Logout and login again after adding user to docker group:

```bash
exit
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
```

### Step 4: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 5: Install Git

```bash
sudo yum install git -y
git --version
```

### Step 6: Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/nearbynurse.git
cd nearbynurse
```

### Step 7: Get Public IP

```bash
# Auto-detect public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Public IP: $PUBLIC_IP"

# Or get from Lightsail console
```

### Step 8: Configure Nginx

```bash
# Update nginx.conf with your public IP
nano nginx/nginx.conf

# Change this line:
# server_name localhost nearbynurse.local;
# To:
# server_name YOUR_PUBLIC_IP;
```

### Step 9: Configure Backend

```bash
# Create backend/.env
cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
NODE_ENV=production
KEYCLOAK_ISSUER=http://YOUR_PUBLIC_IP/auth/realms/master
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=nearbynurse-frontend
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
EOF

# Replace YOUR_PUBLIC_IP with actual IP
```

### Step 10: Configure Root Environment

```bash
echo "VITE_API_URL=/api" > .env
```

### Step 11: Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# This takes 3-5 minutes for first build
```

### Step 12: Monitor Startup

```bash
# Watch logs
docker-compose logs -f

# Check service status
docker-compose ps

# Wait until all services show "Up (healthy)"
# Keycloak takes 1-2 minutes to fully start
```

---

## ⚙️ Post-Deployment Configuration

### Configure Keycloak Client

**IMPORTANT:** This step is required for authentication to work.

1. **Access Keycloak Admin Console:**
   ```
   http://YOUR_PUBLIC_IP/auth/admin
   ```

2. **Login:**
   - Username: `admin`
   - Password: `admin`

3. **Create Client:**
   - Go to: **Clients** → **Create client**
   - Client ID: `nearbynurse-frontend`
   - Click **Next** → **Next** → **Save**

4. **Configure Client Settings:**
   - **Valid redirect URIs:** `http://YOUR_PUBLIC_IP/*`
   - **Valid post logout redirect URIs:** `http://YOUR_PUBLIC_IP/*`
   - **Web origins:** `http://YOUR_PUBLIC_IP`
   - **Enable:** ✅ Direct access grants
   - Click **Save**

5. **Create Test User (Optional):**
   - Go to: **Users** → **Create new user**
   - Username: `testuser`
   - Email: `test@example.com`
   - Click **Create**
   - Go to: **Credentials** tab
   - Set password: `Test123!`
   - Toggle off **Temporary**
   - Click **Save**

---

## ✅ Verification

### Test Backend API

```bash
# From server
curl http://localhost/api

# Expected output:
# {"message":"Hello World!"}

# From browser
http://YOUR_PUBLIC_IP/api
```

### Test Frontend

```bash
# From browser
http://YOUR_PUBLIC_IP

# Should load React application
```

### Test Keycloak

```bash
# Check Keycloak realm info
curl http://localhost/auth/realms/master

# Should return JSON with realm configuration
```

### Test Full Authentication Flow

1. Open browser: `http://YOUR_PUBLIC_IP`
2. Click **Register** or navigate to registration
3. Create a new account
4. Login with created account
5. Access protected routes

### Check Container Health

```bash
# All services should show "Up (healthy)"
docker-compose ps

# Check individual service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs keycloak
docker-compose logs nginx
```

---

## 🛠️ Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f keycloak
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100

# Since specific time
docker-compose logs --since 10m
```

### Restart Services

```bash
# Restart single service
docker-compose restart backend

# Restart all services
docker-compose restart

# Stop and start (full restart)
docker-compose down
docker-compose up -d
```

### Stop Services

```bash
# Stop but keep containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Check Status

```bash
# Service status
docker-compose ps

# Resource usage (CPU, Memory)
docker stats

# Disk usage
docker system df
df -h
```

### Execute Commands in Containers

```bash
# Shell in backend container
docker-compose exec backend sh

# Shell in database
docker-compose exec db psql -U postgres -d mydb

# Check backend environment variables
docker-compose exec backend env
```

### Database Operations

```bash
# Access PostgreSQL (app database)
docker-compose exec db psql -U postgres -d mydb

# Backup database
docker-compose exec db pg_dump -U postgres mydb > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U postgres -d mydb
```

---

## 🐛 Troubleshooting

### Issue: Can't Access Application

**Check Lightsail Firewall:**
```bash
# Verify port 80 is open in Lightsail console
# Instance → Networking → Firewall
```

**Check Nginx:**
```bash
# Check if nginx is running
docker-compose ps nginx

# Check nginx logs
docker-compose logs nginx

# Test nginx locally
curl http://localhost
```

### Issue: Backend Not Responding

**Check Backend Logs:**
```bash
docker-compose logs backend

# Common issues:
# - Can't connect to database
# - Can't connect to Keycloak
# - Environment variables not set
```

**Verify Backend Environment:**
```bash
docker-compose exec backend env | grep -E "DATABASE_URL|KEYCLOAK"
```

**Restart Backend:**
```bash
docker-compose restart backend
```

### Issue: Keycloak Not Accessible

**Wait for Keycloak to Start:**
```bash
# Keycloak takes 1-2 minutes to fully start
docker-compose logs -f keycloak

# Wait for this message:
# "Keycloak ... started in ...ms"
```

**Check Keycloak Health:**
```bash
docker-compose ps keycloak

# Should show "Up (healthy)"
```

### Issue: Authentication Fails

**Verify Keycloak Client Configuration:**
1. Check client exists: `nearbynurse-frontend`
2. Verify redirect URIs include your IP
3. Ensure "Direct access grants" is enabled

**Check Backend Keycloak URL:**
```bash
docker-compose exec backend env | grep KEYCLOAK_ISSUER

# Should output:
# KEYCLOAK_ISSUER=http://YOUR_PUBLIC_IP/auth/realms/master
```

### Issue: Out of Memory

**Check Memory Usage:**
```bash
free -h
docker stats
```

**Solution:** Upgrade to larger Lightsail plan (at least 2GB RAM)

### Issue: Docker Permission Denied

**Fix User Group:**
```bash
# Add user to docker group
sudo usermod -a -G docker $USER

# Logout and login again
exit
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
```

### Issue: Services Won't Start

**Check Logs:**
```bash
docker-compose logs

# Look for error messages
```

**Clean Rebuild:**
```bash
# Stop everything
docker-compose down -v

# Clean Docker system
docker system prune -a

# Rebuild and start
docker-compose up -d --build
```

---

## 🔒 Security Hardening

### 1. Change Default Passwords

**Keycloak Admin Password:**
```bash
# Edit backend/.env
nano backend/.env

# Change:
KEYCLOAK_ADMIN_PASSWORD=YourStrongPassword123!

# Rebuild keycloak
docker-compose up -d --build keycloak
```

**Database Passwords:**
```bash
# Edit docker-compose.yml
nano docker-compose.yml

# Change POSTGRES_PASSWORD in both db services
# Update DATABASE_URL in backend/.env accordingly

# Rebuild
docker-compose up -d --build
```

### 2. Set Up HTTPS (Recommended)

**Using Let's Encrypt (Free SSL):**

```bash
# 1. Register a domain and point to your IP
# 2. Install certbot
sudo yum install certbot -y

# 3. Stop nginx temporarily
docker-compose stop nginx

# 4. Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# 5. Update nginx.conf for HTTPS
# 6. Restart nginx
docker-compose start nginx
```

### 3. Use Domain Instead of IP

**Benefits:**
- Professional appearance
- Required for SSL
- Easier to remember

**Steps:**
1. Register domain (e.g., `nearbynurse.com`)
2. Add DNS A record pointing to your Lightsail IP
3. Update all configurations:
   - `nginx/nginx.conf`: `server_name yourdomain.com;`
   - `backend/.env`: `KEYCLOAK_ISSUER=https://yourdomain.com/auth/realms/master`
4. Rebuild: `docker-compose up -d --build`

### 4. Enable Firewall on Instance

```bash
# Install firewalld
sudo yum install firewalld -y
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow only necessary ports
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### 5. Regular Updates

```bash
# Create update script
cat > ~/update-nearbynurse.sh << 'EOF'
#!/bin/bash
cd ~/nearbynurse
git pull origin main
docker-compose up -d --build
docker image prune -f
EOF

chmod +x ~/update-nearbynurse.sh

# Run weekly via cron
crontab -e
# Add: 0 2 * * 0 /home/ec2-user/update-nearbynurse.sh
```

### 6. Monitoring and Alerts

**Set up basic monitoring:**
```bash
# Create monitoring script
cat > ~/monitor-services.sh << 'EOF'
#!/bin/bash
cd ~/nearbynurse
if ! docker-compose ps | grep -q "Up (healthy)"; then
    echo "Services unhealthy, restarting..."
    docker-compose restart
fi
EOF

chmod +x ~/monitor-services.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /home/ec2-user/monitor-services.sh
```

---

## 🔄 Updating the Application

### Update Code

```bash
# 1. SSH into instance
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# 2. Navigate to project
cd ~/nearbynurse

# 3. Pull latest changes
git pull origin main

# 4. Rebuild and restart
docker-compose up -d --build

# 5. Verify deployment
docker-compose ps
```

### Update Specific Service

```bash
# Update only backend
docker-compose up -d --build backend

# Update only frontend
docker-compose up -d --build frontend
```

### Rollback to Previous Version

```bash
# 1. Check git history
git log --oneline

# 2. Rollback to specific commit
git checkout <commit-hash>

# 3. Rebuild
docker-compose up -d --build

# 4. Or rollback one commit
git reset --hard HEAD^
docker-compose up -d --build
```

### Zero-Downtime Deployment (Advanced)

```bash
# Use Docker Compose rolling update
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

---

## 📊 Monitoring and Maintenance

### Daily Checks

```bash
# Check service health
docker-compose ps

# Check disk space
df -h

# Check memory
free -h
```

### Weekly Tasks

```bash
# Clean unused Docker images
docker image prune -f

# Check logs for errors
docker-compose logs --since 7d | grep -i error

# Backup database
docker-compose exec db pg_dump -U postgres mydb > backup-$(date +%Y%m%d).sql
```

### Monthly Tasks

```bash
# Update system packages
sudo yum update -y

# Update Docker images
docker-compose pull
docker-compose up -d --build

# Review security
# - Check Lightsail firewall rules
# - Review user accounts
# - Check for security advisories
```

---

## 📞 Support and Resources

### Useful Commands Cheat Sheet

```bash
# Service Management
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose restart            # Restart all
docker-compose restart backend    # Restart one

# Logs
docker-compose logs -f            # Follow all logs
docker-compose logs backend       # View backend logs
docker-compose logs --tail=100    # Last 100 lines

# Status
docker-compose ps                 # Service status
docker stats                      # Resource usage
docker system df                  # Disk usage

# Maintenance
docker image prune -f             # Clean images
docker system prune -a            # Clean everything
docker volume prune               # Clean volumes

# Database
docker-compose exec db psql -U postgres -d mydb    # DB access
docker-compose exec db pg_dump -U postgres mydb    # Backup
```

### Documentation Links

- [NearbyNurse README](../README.md)
- [Keycloak Setup Guide](../KEYCLOAK-SETUP.md)
- [Docker Documentation](https://docs.docker.com)
- [Amazon Lightsail Documentation](https://docs.aws.amazon.com/lightsail/)

### Getting Help

1. Check logs: `docker-compose logs`
2. Review this guide's troubleshooting section
3. Check GitHub issues
4. Contact your team lead

---

## ✅ Deployment Checklist

Use this checklist to ensure successful deployment:

### Pre-Deployment
- [ ] Lightsail instance created (2GB+ RAM)
- [ ] Firewall rules configured (80, 443, 22)
- [ ] SSH key downloaded and configured
- [ ] Code pushed to GitHub repository

### Deployment
- [ ] SSH connection working
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Repository cloned
- [ ] Public IP detected
- [ ] Nginx configured with public IP
- [ ] Backend .env created
- [ ] Root .env created
- [ ] Services built and started
- [ ] All services healthy

### Post-Deployment
- [ ] Keycloak client configured
- [ ] Test user created
- [ ] Backend API responding
- [ ] Frontend loading
- [ ] Authentication working
- [ ] Protected routes working

### Security
- [ ] Changed Keycloak admin password
- [ ] Changed database passwords
- [ ] Firewall rules verified
- [ ] HTTPS configured (if using domain)
- [ ] Regular backups scheduled

---

**🎉 Congratulations! Your NearbyNurse application is now deployed on Amazon Lightsail!**

For questions or issues, refer to the troubleshooting section or contact your team.

