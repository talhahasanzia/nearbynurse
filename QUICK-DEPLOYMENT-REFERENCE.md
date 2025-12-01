# Deployment Quick Reference

## Initial Deployment

### Run the Automated Script
```bash
# Make script executable
chmod +x deploy-lightsail.sh

# Run deployment
./deploy-lightsail.sh
```

The script will:
1. Update system packages
2. Install Docker & Docker Compose
3. Install Docker Buildx
4. Install Git
5. Clone repository
6. Configure environment variables (interactive)
7. Build and start all services
8. Wait for health checks
9. Display access information

---

## Manual Deployment Steps

If you prefer manual deployment or need to troubleshoot:

### 1. Install Prerequisites
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose V2
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o $DOCKER_CONFIG/cli-plugins/docker-compose
sudo chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Install Buildx
BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep 'tag_name' | cut -d '"' -f 4)
curl -SL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o $DOCKER_CONFIG/cli-plugins/docker-buildx
chmod +x $DOCKER_CONFIG/cli-plugins/docker-buildx

# Start new shell or run
newgrp docker
```

### 2. Clone Repository
```bash
cd ~
git clone https://github.com/talhahasanzia/nearbynurse.git
cd nearbynurse
```

### 3. Configure Environment
```bash
# Get your public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Your Public IP: $PUBLIC_IP"

# Create .env file
cat > .env << EOF
PUBLIC_IP=${PUBLIC_IP}
DB_PASSWORD=password
DB_NAME=mydb
KC_DB_NAME=keycloak
KC_DB_USER=keycloak
KC_DB_PASSWORD=keycloak
KC_ADMIN_USER=admin
KC_ADMIN_PASSWORD=admin
VITE_API_URL=/api
VITE_KEYCLOAK_URL=http://${PUBLIC_IP}/auth
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=nearbynurse-frontend
EOF

# Create backend/.env
cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
NODE_ENV=production
KEYCLOAK_ISSUER=http://${PUBLIC_IP}/auth/realms/master
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=nearbynurse-frontend
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
EOF

# Create frontend/.env
cat > frontend/.env << EOF
VITE_API_URL=/api
VITE_KEYCLOAK_URL=http://${PUBLIC_IP}/auth
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=nearbynurse-frontend
EOF
```

### 4. Update Nginx Configuration
```bash
# Update server_name with your public IP
sed -i "s/server_name localhost nearbynurse.local;/server_name ${PUBLIC_IP};/" nginx/nginx.conf
```

### 5. Build and Start Services
```bash
cd ~/nearbynurse

# Build and start (use 'docker compose' or 'docker-compose')
docker compose up -d --build

# Monitor logs
docker compose logs -f
```

---

## Common Commands

### Service Management
```bash
cd ~/nearbynurse

# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# Rebuild and restart
docker compose up -d --build

# View status
docker compose ps
```

### Logs
```bash
cd ~/nearbynurse

# All logs
docker compose logs

# Follow logs
docker compose logs -f

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs keycloak
docker compose logs nginx

# Last N lines
docker compose logs --tail=100
```

### Health Checks
```bash
# Check service status
docker compose ps

# Test backend
curl http://localhost/api

# Test frontend
curl http://localhost

# Test Keycloak
curl http://localhost/auth
```

---

## Access URLs

Replace `YOUR_IP` with your actual public IP address:

- **Frontend**: `http://YOUR_IP`
- **Backend API**: `http://YOUR_IP/api`
- **Keycloak Admin**: `http://YOUR_IP/auth/admin`

Default Keycloak credentials:
- Username: `admin`
- Password: `admin`

---

## Keycloak Configuration

After deployment, configure Keycloak:

1. Navigate to: `http://YOUR_IP/auth/admin`
2. Login with admin/admin
3. Create client:
   - Client ID: `nearbynurse-frontend`
   - Client Protocol: `openid-connect`
   - Access Type: `public`
4. Configure client:
   - Valid Redirect URIs: `http://YOUR_IP/*`
   - Valid Post Logout Redirect URIs: `http://YOUR_IP/*`
   - Web Origins: `http://YOUR_IP`
   - Enable "Direct Access Grants"
5. Save changes

### Create Test User (Optional)
1. Go to Users → Add user
2. Username: `testuser`
3. Email: `test@example.com`
4. Save
5. Go to Credentials tab
6. Set password (disable "Temporary")

---

## Updating Deployment

### Pull Latest Changes
```bash
cd ~/nearbynurse
git pull
docker compose down
docker compose up -d --build
```

### Update Single Service
```bash
cd ~/nearbynurse

# Rebuild single service
docker compose up -d --build backend

# Or rebuild specific services
docker compose up -d --build frontend backend
```

### Update Environment Variables
```bash
# Edit .env files
nano .env
nano backend/.env
nano frontend/.env

# Restart services to apply changes
docker compose down
docker compose up -d
```

---

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker compose logs

# Check Docker service
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Try rebuilding
docker compose down
docker system prune -a  # Warning: removes all unused data
docker compose up -d --build
```

### Port Already in Use
```bash
# Find process using port 80
sudo lsof -i :80
sudo kill <PID>

# Or change port in docker-compose.yml
```

### Permission Errors
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Test
docker ps
```

### Can't Access from Browser
```bash
# Check firewall (Lightsail)
# - Ensure port 80 is open in Lightsail console
# - Networking → Firewall → Add rule: HTTP (80)

# Check nginx
docker compose logs nginx

# Check if services are running
docker compose ps
```

---

## Monitoring

### Check Resource Usage
```bash
# Docker stats
docker stats

# System resources
free -h
df -h
top
```

### View Service Details
```bash
# Inspect service
docker compose config

# View service definition
docker compose ps --format json

# Container details
docker inspect <container_name>
```

---

## Backup & Restore

### Backup Database
```bash
# Backup PostgreSQL data
docker compose exec db pg_dump -U postgres mydb > backup.sql

# Backup Keycloak data
docker compose exec keycloak-db pg_dump -U keycloak keycloak > keycloak_backup.sql
```

### Restore Database
```bash
# Restore PostgreSQL
docker compose exec -T db psql -U postgres mydb < backup.sql

# Restore Keycloak
docker compose exec -T keycloak-db psql -U keycloak keycloak < keycloak_backup.sql
```

---

## Security Checklist

- [ ] Change default passwords in `.env` and `backend/.env`
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure domain name (instead of IP)
- [ ] Enable firewall rules (only 80, 443, 22)
- [ ] Restrict SSH access by IP
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Set up backup automation
- [ ] Configure log rotation
- [ ] Enable Docker security scanning

---

## Support

For more detailed troubleshooting, see:
- `DOCKER-TROUBLESHOOTING.md`
- `DEPLOYMENT.md`
- `LIGHTSAIL-DEPLOYMENT.md`

For Keycloak setup:
- `KEYCLOAK-SETUP.md`
- `KEYCLOAK-IMPLEMENTATION.md`

