# Docker Compose Troubleshooting Guide

This guide helps resolve common Docker Compose issues during deployment.

## Issue 1: "compose build requires buildx 0.17 or later"

**Cause:** The Docker Compose version requires Docker Buildx, which isn't installed or is outdated.

**Solution:**

### Option A: Install Docker Buildx (Recommended - included in deploy script)
```bash
# Set Docker config directory
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

# Download latest buildx
BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep 'tag_name' | cut -d '"' -f 4)
curl -SL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o $DOCKER_CONFIG/cli-plugins/docker-buildx
chmod +x $DOCKER_CONFIG/cli-plugins/docker-buildx

# Verify installation
docker buildx version
```

### Option B: Use Docker Compose V2
```bash
# Docker Compose V2 comes with buildx built-in
docker compose version
```

### Option C: Start a new shell session
Sometimes Docker plugins require a new session:
```bash
# Log out and back in, or
newgrp docker
```

---

## Issue 2: "version is obsolete" warning

**Cause:** Docker Compose file contains deprecated `version:` field.

**Solution:** The `version:` field has been removed from `docker-compose.yml`. If you still see this:

```bash
cd ~/nearbynurse
# The version field should already be removed in the latest code
head -n 5 docker-compose.yml
```

Expected output should start with:
```yaml
services:
  nginx:
```

---

## Issue 3: "no configuration file provided: not found"

**Cause:** Running `docker-compose` or `docker compose` from wrong directory.

**Solution:**
```bash
# Always run docker compose commands from project directory
cd ~/nearbynurse

# Verify docker-compose.yml exists
ls -la docker-compose.yml

# Then run your commands
docker compose ps
```

---

## Issue 4: Permission Denied Errors

**Cause:** Current user not in docker group.

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or start new session
newgrp docker

# Test docker without sudo
docker ps
```

---

## Issue 5: Services Not Starting

**Cause:** Various reasons - port conflicts, missing environment variables, etc.

**Solution:**
```bash
cd ~/nearbynurse

# Check service status
docker compose ps

# View logs for all services
docker compose logs

# View logs for specific service
docker compose logs backend
docker compose logs keycloak

# Check if ports are already in use
sudo netstat -tlnp | grep -E ':(80|443|3000|5432|8080)'

# Restart services
docker compose restart

# Full rebuild
docker compose down
docker compose up -d --build
```

---

## Issue 6: Docker Compose Command Not Found

**Cause:** Docker Compose not installed or not in PATH.

**Solution:**
```bash
# Check if docker compose (V2) works
docker compose version

# If not, check docker-compose (V1)
docker-compose --version

# If neither works, reinstall:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

## Useful Commands

### Check System Status
```bash
# Docker service status
sudo systemctl status docker

# Docker info
docker info

# Available disk space
df -h
```

### Cleanup
```bash
cd ~/nearbynurse

# Stop all services
docker compose down

# Remove all containers, networks, volumes
docker compose down -v

# Remove unused Docker resources
docker system prune -a
```

### Debugging
```bash
cd ~/nearbynurse

# Follow logs in real-time
docker compose logs -f

# Check container health
docker compose ps

# Inspect a specific service
docker compose logs backend --tail=100

# Enter a running container
docker compose exec backend sh
docker compose exec keycloak sh
```

### Environment Variables
```bash
cd ~/nearbynurse

# View current environment
cat .env

# Check backend environment
cat backend/.env

# Check frontend environment  
cat frontend/.env
```

---

## Quick Deploy After Fixing Issues

After resolving any issues, redeploy with:

```bash
cd ~/nearbynurse

# Ensure you're in the right directory
pwd

# Pull latest changes (if from git)
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build

# Monitor startup
docker compose logs -f
```

---

## Getting Help

If issues persist:

1. **Check logs**: `docker compose logs -f`
2. **Verify configuration**: Review `.env`, `backend/.env`, `frontend/.env`
3. **Check disk space**: `df -h`
4. **Check memory**: `free -h`
5. **Restart Docker**: `sudo systemctl restart docker`
6. **Review deployment script**: Check `deploy-lightsail.sh` for any step that failed

---

## Common Error Messages & Solutions

### "Error response from daemon: driver failed programming external connectivity"
**Solution:** Port already in use. Find and stop the conflicting process:
```bash
sudo lsof -i :80
sudo kill <PID>
```

### "Cannot connect to the Docker daemon"
**Solution:** Start Docker service:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### "permission denied while trying to connect to the Docker daemon socket"
**Solution:** Add user to docker group and restart session:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### "pull access denied" or "manifest unknown"
**Solution:** Check image names in docker-compose.yml and ensure you have internet access:
```bash
ping -c 3 8.8.8.8
curl -I https://hub.docker.com
```

---

## Version Compatibility

This deployment uses:
- **Docker**: 20.10+
- **Docker Compose**: V2 (preferred) or V1.29+
- **Docker Buildx**: 0.17+ (for builds)
- **Amazon Linux**: 2 or 2023

Check versions:
```bash
docker --version
docker compose version
docker buildx version
```

