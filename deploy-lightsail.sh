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
# Interactive Environment Configuration
###############################################################################

collect_env_variables() {
    print_header "Interactive Environment Configuration"

    print_info "Please provide the following configuration values."
    print_info "Press Enter to use default values shown in [brackets].\n"

    # Database Configuration
    echo -e "${BLUE}━━━ Database Configuration ━━━${NC}"
    read -p "PostgreSQL Password [password]: " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-password}

    read -p "Database Name [mydb]: " DB_NAME
    DB_NAME=${DB_NAME:-mydb}

    # Keycloak Database
    echo -e "\n${BLUE}━━━ Keycloak Database ━━━${NC}"
    read -p "Keycloak DB User [keycloak]: " KC_DB_USER
    KC_DB_USER=${KC_DB_USER:-keycloak}

    read -p "Keycloak DB Password [keycloak]: " KC_DB_PASSWORD
    KC_DB_PASSWORD=${KC_DB_PASSWORD:-keycloak}

    read -p "Keycloak DB Name [keycloak]: " KC_DB_NAME
    KC_DB_NAME=${KC_DB_NAME:-keycloak}

    # Keycloak Admin
    echo -e "\n${BLUE}━━━ Keycloak Admin Credentials ━━━${NC}"
    read -p "Keycloak Admin Username [admin]: " KC_ADMIN_USER
    KC_ADMIN_USER=${KC_ADMIN_USER:-admin}

    read -sp "Keycloak Admin Password [admin]: " KC_ADMIN_PASSWORD
    echo ""
    KC_ADMIN_PASSWORD=${KC_ADMIN_PASSWORD:-admin}

    # Application Configuration
    echo -e "\n${BLUE}━━━ Application Configuration ━━━${NC}"
    read -p "Backend Port [3000]: " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-3000}

    read -p "Node Environment [production]: " NODE_ENV
    NODE_ENV=${NODE_ENV:-production}

    read -p "Keycloak Realm [master]: " KC_REALM
    KC_REALM=${KC_REALM:-master}

    read -p "Keycloak Client ID [nearbynurse-frontend]: " KC_CLIENT_ID
    KC_CLIENT_ID=${KC_CLIENT_ID:-nearbynurse-frontend}

    read -p "API URL [/api]: " API_URL
    API_URL=${API_URL:-/api}

    # Confirm configuration
    echo -e "\n${YELLOW}━━━ Configuration Summary ━━━${NC}"
    echo "Database Password: ${DB_PASSWORD}"
    echo "Database Name: ${DB_NAME}"
    echo "Keycloak DB User: ${KC_DB_USER}"
    echo "Keycloak DB Name: ${KC_DB_NAME}"
    echo "Keycloak Admin Username: ${KC_ADMIN_USER}"
    echo "Backend Port: ${BACKEND_PORT}"
    echo "Node Environment: ${NODE_ENV}"
    echo "Keycloak Realm: ${KC_REALM}"
    echo "Keycloak Client ID: ${KC_CLIENT_ID}"
    echo "API URL: ${API_URL}"
    echo "Public IP: ${PUBLIC_IP}"
    echo ""

    read -p "Is this configuration correct? (y/n) [y]: " CONFIRM
    CONFIRM=${CONFIRM:-y}

    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_warning "Configuration cancelled. Restarting..."
        collect_env_variables
        return
    fi

    print_success "Configuration confirmed!"

    # Export for use in other functions
    export DB_PASSWORD DB_NAME KC_DB_USER KC_DB_PASSWORD KC_DB_NAME KC_ADMIN_USER KC_ADMIN_PASSWORD
    export BACKEND_PORT NODE_ENV KC_REALM KC_CLIENT_ID API_URL
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

    # Install Docker Compose V2 (plugin version with buildx support)
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins

    # Download Docker Compose V2
    sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o $DOCKER_CONFIG/cli-plugins/docker-compose

    # Make it executable
    sudo chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

    # Also install as standalone for backward compatibility
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    # Install Docker Buildx
    print_info "Installing Docker Buildx..."
    BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep 'tag_name' | cut -d '"' -f 4)
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m)" -o $DOCKER_CONFIG/cli-plugins/docker-buildx
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-buildx

    # Initialize buildx
    docker buildx version || print_warning "Buildx installation may need a new shell session"

    print_success "Docker Compose installed successfully"
    docker-compose --version || docker compose version
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
# Step 7: Configure Docker Compose Environment
###############################################################################

step_configure_docker_compose() {
    print_header "Step 7: Configuring Docker Compose Environment"

    cd "$PROJECT_DIR"

    # Create docker-compose environment file
    cat > .env.docker << EOF
# Public IP Configuration
PUBLIC_IP=${PUBLIC_IP}

# Database Configuration
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Keycloak Database Configuration
KC_DB_NAME=${KC_DB_NAME}
KC_DB_USER=${KC_DB_USER}
KC_DB_PASSWORD=${KC_DB_PASSWORD}

# Keycloak Admin Configuration
KC_ADMIN_USER=${KC_ADMIN_USER}
KC_ADMIN_PASSWORD=${KC_ADMIN_PASSWORD}

# Frontend Build Args
VITE_API_URL=${API_URL}
VITE_KEYCLOAK_URL=http://${PUBLIC_IP}/auth
VITE_KEYCLOAK_REALM=${KC_REALM}
VITE_KEYCLOAK_CLIENT_ID=${KC_CLIENT_ID}
EOF

    # Link it as the main .env for docker-compose
    ln -sf .env.docker .env

    print_success "Docker Compose environment configured"
    print_info "Location: .env.docker (linked as .env)"
}

###############################################################################
# Step 8: Configure Nginx
###############################################################################

step_configure_nginx() {
    print_header "Step 8: Configuring Nginx"

    cd "$PROJECT_DIR"

    # Backup original nginx.conf
    cp nginx/nginx.conf nginx/nginx.conf.backup

    # Update server_name with public IP
    sed -i "s/server_name localhost nearbynurse.local;/server_name $PUBLIC_IP;/" nginx/nginx.conf

    print_success "Nginx configured with public IP: $PUBLIC_IP"
}

###############################################################################
# Step 9: Configure Backend Environment
###############################################################################

step_configure_backend() {
    print_header "Step 9: Creating Backend Environment File"

    cd "$PROJECT_DIR"

    # Create backend/.env file with user-provided values
    cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/${DB_NAME}
PORT=${BACKEND_PORT}
NODE_ENV=${NODE_ENV}
KEYCLOAK_ISSUER=http://$PUBLIC_IP/auth/realms/${KC_REALM}
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=${KC_CLIENT_ID}
KEYCLOAK_ADMIN_USERNAME=${KC_ADMIN_USER}
KEYCLOAK_ADMIN_PASSWORD=${KC_ADMIN_PASSWORD}
EOF

    print_success "Backend environment file created"
    print_info "Location: backend/.env"
}

###############################################################################
# Step 10: Configure Frontend Environment
###############################################################################

step_configure_root_env() {
    print_header "Step 10: Creating Frontend Environment File"

    cd "$PROJECT_DIR"

    # Create frontend/.env file with user-provided values
    cat > frontend/.env << EOF
VITE_API_URL=${API_URL}
VITE_KEYCLOAK_URL=http://$PUBLIC_IP/auth
VITE_KEYCLOAK_REALM=${KC_REALM}
VITE_KEYCLOAK_CLIENT_ID=${KC_CLIENT_ID}
EOF

    print_success "Frontend environment file created"
    print_info "Location: frontend/.env"
}

###############################################################################
# Step 11: Build and Start Services
###############################################################################

step_start_services() {
    print_header "Step 11: Building and Starting Docker Services"

    cd "$PROJECT_DIR" || {
        print_error "Failed to change to project directory: $PROJECT_DIR"
        exit 1
    }

    # Verify docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $PROJECT_DIR"
        exit 1
    fi

    print_info "This may take 3-5 minutes for the first build..."
    print_info "Current directory: $(pwd)"

    # Use docker compose (V2) if available, fallback to docker-compose
    if docker compose version &> /dev/null; then
        print_info "Using Docker Compose V2"
        docker compose up -d --build
    else
        print_info "Using Docker Compose V1"
        docker-compose up -d --build
    fi

    print_success "Docker services started"
}

###############################################################################
# Step 12: Wait for Services to be Healthy
###############################################################################

step_wait_for_services() {
    print_header "Step 12: Waiting for Services to be Healthy"

    cd "$PROJECT_DIR"

    print_info "Waiting for all services to pass health checks..."
    print_info "This may take 1-2 minutes (Keycloak takes longest)..."

    # Determine which docker compose command to use
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    # Wait up to 3 minutes for services to be healthy
    timeout=180
    elapsed=0
    interval=5

    while [ $elapsed -lt $timeout ]; do
        healthy=$($COMPOSE_CMD ps | grep -c "Up (healthy)" || true)
        total=$($COMPOSE_CMD ps | grep -c "Up" || true)

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
        print_info "Run '$COMPOSE_CMD ps' to check status"
    fi

    # Show final status
    print_info "\nService Status:"
    $COMPOSE_CMD ps
}

###############################################################################
# Step 13: Display Keycloak Configuration Instructions
###############################################################################

step_keycloak_instructions() {
    print_header "Step 13: Keycloak Configuration Required"

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
# Step 14: Verify Deployment
###############################################################################

step_verify_deployment() {
    print_header "Step 14: Verifying Deployment"

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
# Step 15: Display Access Information
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

Useful Commands (use 'docker compose' or 'docker-compose'):
  View logs:        docker compose logs -f
  Restart service:  docker compose restart <service>
  Stop all:         docker compose down
  Status:           docker compose ps

EOF
    echo -e "${NC}"
}

###############################################################################
# Step 16: Display Security Recommendations
###############################################################################

step_security_recommendations() {
    print_header "🔒 Security Recommendations"

    echo -e "${YELLOW}"
    cat << EOF
For production deployment, consider these security improvements:

1. Change Keycloak Admin Password:
   - Edit backend/.env: KEYCLOAK_ADMIN_PASSWORD=YourStrongPassword
   - Run: docker compose up -d --build keycloak

2. Change Database Passwords:
   - Edit docker-compose.yml with strong passwords
   - Rebuild: docker compose up -d --build

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

    # Determine which docker compose command to use
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    # Show logs if Docker is running
    if $COMPOSE_CMD ps > /dev/null 2>&1; then
        print_info "\nDocker service logs:"
        $COMPOSE_CMD logs --tail=50
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
    collect_env_variables
    step_configure_docker_compose
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

