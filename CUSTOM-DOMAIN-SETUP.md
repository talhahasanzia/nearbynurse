# Custom Domain Setup Guide

## Using a Custom Domain Name Locally

Instead of accessing your application via `localhost`, you can use a custom domain like `nearbynurse.local`.

### Step 1: Add the domain to your hosts file

Edit your `/etc/hosts` file to map the custom domain to localhost:

```bash
sudo nano /etc/hosts
```

Add this line:
```
127.0.0.1    nearbynurse.local
```

Save and exit (Ctrl+O, Enter, Ctrl+X in nano).

### Step 2: Configuration is already updated!

I've already updated the following files:
- ✅ `docker-compose.yml` - Keycloak hostname set to `nearbynurse.local`
- ✅ `nginx/nginx.conf` - Server name includes `nearbynurse.local`

### Step 3: Restart your Docker containers

```bash
docker-compose down
docker-compose up -d
```

### Step 4: Access your application

Now you can access your application at:
- **Frontend**: http://nearbynurse.local
- **Backend API**: http://nearbynurse.local/api
- **Keycloak**: http://nearbynurse.local/auth

You can still use `localhost` as well since both are configured in nginx!

---

## How Docker Knows Which Nginx Config to Use

Look at the nginx service in `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

The `volumes` section maps your local file to the container:
- **Left side** (`./nginx/nginx.conf`): Your local file path
- **Right side** (`/etc/nginx/nginx.conf`): Path inside the container
- **`:ro`**: Read-only mode

When nginx starts inside the Docker container, it reads the config from `/etc/nginx/nginx.conf`, which is your local file mounted into the container!

---

## Changing to a Different Custom Domain

If you want to use a different domain (e.g., `myapp.local`):

1. Update `/etc/hosts`:
   ```
   127.0.0.1    myapp.local
   ```

2. Update `docker-compose.yml`:
   ```yaml
   KC_HOSTNAME: myapp.local
   ```

3. Update `nginx/nginx.conf`:
   ```nginx
   server_name localhost myapp.local;
   ```

4. Restart Docker containers

---

## Troubleshooting

**Can't access the custom domain?**
- Make sure you've added it to `/etc/hosts`
- Clear your browser cache
- Try accessing with `http://` explicitly (not `https://`)
- Check containers are running: `docker-compose ps`

**Keycloak redirect issues?**
- The `KC_HOSTNAME` in docker-compose.yml must match your custom domain
- Clear Keycloak cache or recreate the realm

