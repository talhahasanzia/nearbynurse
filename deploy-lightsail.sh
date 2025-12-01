#!/bin/bash

###############################################################################
# NearbyNurse - Amazon Lightsail Deployment Script
#
# This script automates the deployment of NearbyNurse to Amazon Lightsail
#
# Prerequisites:
# - Amazon Lightsail instance running Amazon Linux 2
# - SSH access configured
# - Firewall rules: Port 80, 443, 22 open
#
# Usage:
#   chmod +x deploy-lightsail.sh
#   ./deploy-lightsail.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="https://github.com/talhahasanzia/nearbynurse.git"
PROJECT_DIR="$HOME/nearbynurse"
PUBLIC_IP="54.254.253.205"  # Hardcoded public IP

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

###############################################################################
# Step 1: System Update
###############################################################################

step_system_update() {
    print_header "Step 1: Updating System Packages"

    sudo yum update -y

    print_success "System packages updated"
}

###############################################################################
# Step 2: Install Docker
###############################################################################

step_install_docker() {
    print_header "Step 2: Installing Docker"

    # Install Docker
    sudo yum install docker -y

    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker

    # Add current user to docker group
    sudo usermod -a -G docker $USER

    print_success "Docker installed successfully"
    docker --version
}

###############################################################################
# Step 3: Install Docker Compose
###############################################################################

step_install_docker_compose() {
    print_header "Step 3: Installing Docker Compose"

    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose

    # Create symlink if needed
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    print_success "Docker Compose installed successfully"
    docker-compose --version
}

###############################################################################
# Step 4: Install Git
###############################################################################

step_install_git() {
    print_header "Step 4: Installing Git"

    sudo yum install git -y

    print_success "Git installed successfully"
    git --version
}

###############################################################################
# Step 5: Clone Repository
###############################################################################

step_clone_repository() {
    print_header "Step 5: Cloning Repository"

    # Remove existing directory if it exists
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Removing existing project directory..."
        rm -rf "$PROJECT_DIR"
    fi

    # Clone repository
    cd ~

    git clone "$GITHUB_REPO"
    cd "$PROJECT_DIR"

    print_success "Repository cloned successfully"
}

###############################################################################
# Step 6: Get Public IP
###############################################################################

step_get_public_ip() {
    print_header "Step 6: Using Configured Public IP Address"

    print_success "Public IP Address: $PUBLIC_IP"
    print_info "Using hardcoded IP from configuration"

    export PUBLIC_IP
}

###############################################################################
# Step 7: Configure Nginx
###############################################################################

step_configure_nginx() {
    print_header "Step 7: Configuring Nginx"

    cd "$PROJECT_DIR"

    # Backup original nginx.conf
    cp nginx/nginx.conf nginx/nginx.conf.backup

    # Update server_name with public IP
    sed -i "s/server_name localhost nearbynurse.local;/server_name $PUBLIC_IP;/" nginx/nginx.conf

    print_success "Nginx configured with public IP: $PUBLIC_IP"
}

###############################################################################
# Step 8: Configure Backend Environment
###############################################################################

step_configure_backend() {
    print_header "Step 8: Configuring Backend Environment"

    cd "$PROJECT_DIR"

    # Create backend/.env file
    cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
NODE_ENV=production
KEYCLOAK_ISSUER=http://$PUBLIC_IP/auth/realms/master
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=nearbynurse-frontend
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
EOF

    print_success "Backend environment configured"
    print_info "Location: backend/.env"
}

###############################################################################
# Step 9: Configure Root Environment
###############################################################################

step_configure_root_env() {
    print_header "Step 9: Configuring Root Environment"

    cd "$PROJECT_DIR"

    # Create .env file
    echo "VITE_API_URL=/api" > .env

    print_success "Root environment configured"
    print_info "Location: .env"
}

###############################################################################
# Step 10: Build and Start Services
###############################################################################

step_start_services() {
    print_header "Step 10: Building and Starting Docker Services"

    cd "$PROJECT_DIR"

    print_info "This may take 3-5 minutes for the first build..."

    # Build and start services
    docker-compose up -d --build

    print_success "Docker services started"
}

###############################################################################
# Step 11: Wait for Services to be Healthy
###############################################################################

step_wait_for_services() {
    print_header "Step 11: Waiting for Services to be Healthy"

    cd "$PROJECT_DIR"

    print_info "Waiting for all services to pass health checks..."
    print_info "This may take 1-2 minutes (Keycloak takes longest)..."

    # Wait up to 3 minutes for services to be healthy
    timeout=180
    elapsed=0
    interval=5

    while [ $elapsed -lt $timeout ]; do
        healthy=$(docker-compose ps | grep -c "Up (healthy)" || true)
        total=$(docker-compose ps | grep -c "Up" || true)

        if [ $healthy -ge 4 ]; then
            print_success "All services are healthy!"
            break
        fi

        echo -ne "\r⏳ Waiting... ($elapsed/$timeout seconds) - Healthy: $healthy/$total services"
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    echo "" # New line after progress

    if [ $elapsed -ge $timeout ]; then
        print_warning "Timeout reached. Some services may still be starting."
        print_info "Run 'docker-compose ps' to check status"
    fi

    # Show final status
    print_info "\nService Status:"
    docker-compose ps
}

###############################################################################
# Step 12: Display Keycloak Configuration Instructions
###############################################################################

step_keycloak_instructions() {
    print_header "Step 12: Keycloak Configuration Required"

    echo -e "${YELLOW}"
    cat << EOF
⚠️  IMPORTANT: You need to configure Keycloak manually ⚠️

1. Open your browser and navigate to:
   ${GREEN}http://$PUBLIC_IP/auth/admin${YELLOW}

2. Login with:
   Username: admin
   Password: admin

3. Go to: Clients → Create client

4. Configure the client:
   - Client ID: nearbynurse-frontend
   - Click Next → Next → Save

5. Edit client settings:
   - Valid redirect URIs: http://$PUBLIC_IP/*
   - Valid post logout redirect URIs: http://$PUBLIC_IP/*
   - Web origins: http://$PUBLIC_IP
   - Enable: Direct access grants ✓
   - Click Save

6. (Optional but recommended) Create a test user:
   - Go to: Users → Create new user
   - Username: testuser
   - Email: test@example.com
   - Click Create
   - Go to: Credentials tab → Set password

EOF
    echo -e "${NC}"
}

###############################################################################
# Step 13: Verify Deployment
###############################################################################

step_verify_deployment() {
    print_header "Step 13: Verifying Deployment"

    print_info "Testing backend health endpoint..."

    # Wait a moment for services to settle
    sleep 2

    # Test backend
    if curl -s -f "http://localhost/api" > /dev/null; then
        print_success "Backend is responding ✓"
    else
        print_warning "Backend may not be ready yet. Try: curl http://localhost/api"
    fi

    # Test frontend
    if curl -s -f "http://localhost" > /dev/null; then
        print_success "Frontend is responding ✓"
    else
        print_warning "Frontend may not be ready yet. Try: curl http://localhost"
    fi
}

###############################################################################
# Step 14: Display Access Information
###############################################################################

step_display_access_info() {
    print_header "🎉 Deployment Complete!"

    echo -e "${GREEN}"
    cat << EOF
✓ NearbyNurse has been deployed successfully!

Access your application:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Frontend:       http://$PUBLIC_IP
  Backend API:    http://$PUBLIC_IP/api
  Keycloak Admin: http://$PUBLIC_IP/auth/admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keycloak Credentials:
  Username: admin
  Password: admin

Project Directory: $PROJECT_DIR

Useful Commands:
  View logs:        docker-compose logs -f
  Restart service:  docker-compose restart <service>
  Stop all:         docker-compose down
  Status:           docker-compose ps

EOF
    echo -e "${NC}"
}

###############################################################################
# Step 15: Display Security Recommendations
###############################################################################

step_security_recommendations() {
    print_header "🔒 Security Recommendations"

    echo -e "${YELLOW}"
    cat << EOF
For production deployment, consider these security improvements:

1. Change Keycloak Admin Password:
   - Edit backend/.env: KEYCLOAK_ADMIN_PASSWORD=YourStrongPassword
   - Run: docker-compose up -d --build keycloak

2. Change Database Passwords:
   - Edit docker-compose.yml with strong passwords
   - Rebuild: docker-compose up -d --build

3. Set Up HTTPS/SSL:
   - Register a domain name
   - Install Let's Encrypt SSL certificate
   - Update nginx.conf for HTTPS

4. Use Domain Instead of IP:
   - Point DNS A record to $PUBLIC_IP
   - Update all references from IP to domain

5. Enable Firewall Rules:
   - Only allow ports 80, 443, 22
   - Restrict SSH access by IP if possible

6. Regular Updates:
   - Keep Docker images updated
   - Monitor security advisories
   - Enable automatic security updates

EOF
    echo -e "${NC}"
}

###############################################################################
# Cleanup Function (on error)
###############################################################################

cleanup_on_error() {
    print_error "Deployment failed!"
    print_info "Check the error messages above"
    print_info "You can run this script again after fixing the issues"

    # Show logs if Docker is running
    if docker-compose ps > /dev/null 2>&1; then
        print_info "\nDocker service logs:"
        docker-compose logs --tail=50
    fi

    exit 1
}

# Set trap for errors
trap cleanup_on_error ERR

###############################################################################
# Main Execution
###############################################################################

main() {
    clear

    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║   🏥  NearbyNurse - Amazon Lightsail Deployment Script        ║
║                                                                ║
║   This script will install and configure:                     ║
║   • Docker & Docker Compose                                   ║
║   • NearbyNurse application                                   ║
║   • Nginx reverse proxy                                       ║
║   • Keycloak authentication                                   ║
║   • PostgreSQL databases                                      ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"

    read -p "Press Enter to start deployment, or Ctrl+C to cancel..."

    # Execute all steps
    step_system_update
    step_install_docker
    step_install_docker_compose
    step_install_git
    step_clone_repository
    step_get_public_ip
    step_configure_nginx
    step_configure_backend
    step_configure_root_env
    step_start_services
    step_wait_for_services
    step_verify_deployment
    step_display_access_info
    step_keycloak_instructions
    step_security_recommendations

    print_success "\n✓ All deployment steps completed successfully!\n"
}

# Run main function
main

