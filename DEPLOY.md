# 🚀 Deploy a Producción - Instrucciones Rápidas

## ✅ PASO 1: Generar y configurar Clave SSH

Para un despliegue seguro y automático, usaremos claves SSH.

1.  **En tu PC local**, genera una clave SSH para el despliegue:
    ```bash
    ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f deploy_key
    ```
2.  Copia el contenido de la clave **pública** (`deploy_key.pub`):
    ```bash
    cat deploy_key.pub
    ```
3.  **Conéctate a tu servidor** y añade la clave pública a `~/.ssh/authorized_keys`:
    ```bash
    ssh usuario@dominio.com
    echo "pega_aqui_tu_clave_publica" >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    ```

## ✅ PASO 2: Preparar el Servidor

```bash
ssh usuario@dominio.com

# Instalar dependencias (una sola vez)
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker $USER
sudo systemctl start docker

# Crear carpeta
mkdir -p /home/usuario/app
cd /home/usuario/app

# Crear .env.prod (IMPORTANTE!)
cat > .env.prod << 'EOF'
APP_NAME="TixFlow"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:xxxxxxxxxxxxx

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=tixflow
DB_USERNAME=postgres
DB_PASSWORD=tu_password_bd

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

APP_URL=https://tu_dominio.com
FRONTEND_URL=https://tu_dominio.com
SOCKET_URL=https://tu_dominio.com:3001

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=tu_usuario
MAIL_PASSWORD=tu_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@tu_dominio.com
MAIL_FROM_NAME="TixFlow"

JWT_SECRET=xxxxxxxxxxxxx
SESSION_DRIVER=cookie
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
EOF

chmod 600 .env.prod
```

## ✅ PASO 2: Nginx + SSL (en servidor)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

sudo cat > /etc/nginx/sites-available/tu_dominio.com << 'EOF'
server {
    listen 80;
    server_name tu_dominio.com www.tu_dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu_dominio.com www.tu_dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tu_dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu_dominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

sudo nginx -t
sudo certbot certify -d tu_dominio.com -d www.tu_dominio.com --nginx -n
sudo systemctl restart nginx
```

## ✅ PASO 3: GitHub Secrets

Ve a: https://github.com/TU_USUARIO/TU_REPO/settings/secrets/actions

Crea estos secrets:

| Name | Value |
|------|-------|
| PROD_SERVER_IP | 123.45.67.89 |
| PROD_SERVER_USER | usuario |
| PROD_SERVER_PASSWORD | tu_contraseña_ssh |
| PROD_SERVER_PORT | 22 |
| PROD_DEPLOY_PATH | /home/usuario/app |
| PROD_DOMAIN | tu_dominio.com |
| PROD_GITHUB_REPO | https://github.com/TU_USUARIO/TU_REPO.git |

## ✅ PASO 4: Deploy!

```bash
git add .
git commit -m "Deploy a producción"
git push origin main

# GitHub Actions se dispara automáticamente
```

Ver logs en: https://github.com/TU_USUARIO/TU_REPO/actions

## ✅ Verificar

```
https://tu_dominio.com
```

¡Debe cargar tu app! 🎉
