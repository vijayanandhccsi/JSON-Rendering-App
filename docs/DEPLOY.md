# DEPLOY.md: set up and deploy App 1 on the Bluehost VPS

The preview app is a static site: `pnpm build` produces a folder of files that a web server serves. There is no backend to run.

Commands below assume **Ubuntu 22.04 or 24.04 with no cPanel**. Bluehost VPS plans can differ (some come with cPanel/WHM and AlmaLinux). **Check first** (step 1) and adjust.

---

## 1. Check the server

Log in over SSH and run:

```
cat /etc/os-release
whoami
which nginx apache2 httpd
sudo ss -tlnp | grep -E ':80|:443'
ls /usr/local/cpanel 2>/dev/null
```

What to look for:
- **Ubuntu or Debian:** commands below work as written.
- **AlmaLinux, CentOS, or Rocky:** use `dnf` instead of `apt`, and `/etc/nginx/conf.d/` for Nginx config.
- **cPanel/WHM present (the `/usr/local/cpanel` folder exists) or Apache already using ports 80 and 443:** do not install Nginx on the same ports. Serve the built files from an Apache virtual host or a cPanel subdomain document root instead, and use `.htaccess` for the password and `noindex`. See section 9.

## 2. Connect Claude Code to the VPS

Pick one:

**Option A: run Claude Code on the VPS (simplest).**
1. SSH in: `ssh youruser@YOUR_VPS_IP`.
2. Install Claude Code on the VPS following Anthropic's current install instructions (check their docs; the install command changes over time).
3. Run `claude` inside the project folder. Everything (install, build, test) then runs on the server.

**Option B: run Claude Code on your computer with remote files.**
Use VS Code Remote-SSH to open the project folder on the VPS, then run Claude Code from the VS Code terminal.

Use SSH keys, not passwords:
```
ssh-keygen -t ed25519
ssh-copy-id youruser@YOUR_VPS_IP
```

## 3. Server basics (once)

```
# Update
sudo apt update && sudo apt upgrade -y

# Create a non-root user if you only have root
adduser deploy
usermod -aG sudo deploy

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Tools
sudo apt install -y git nginx certbot python3-certbot-nginx
```

If the server already runs other sites with Nginx (it is fine to add one more), skip the Nginx and firewall lines you already have. A new `preview` site with its own `server_name` does not affect the others. `apache2-utils` (for `htpasswd`) and `rsync` are optional: step 6 shows a password method that needs no extra package, and `deploy.sh` copies the build with `tar` when `rsync` is not installed.

## 4. Install Node and pnpm (once)

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
# open a new shell, then:
nvm install --lts
corepack enable
corepack prepare pnpm@latest --activate
node -v && pnpm -v
```

## 5. Get the code and build

```
cd ~
git clone YOUR_REPO_URL certkraft-pages
cd certkraft-pages
pnpm install
pnpm build
```

The build output is in `apps/preview/dist/`.

## 6. Serve with Nginx behind a password

Example domain: `preview.certkraft.com` (replace with your own). First add a DNS **A record** for it that points to the VPS IP address.

Create the password file (either way, you are asked for the password):
```
sudo htpasswd -c /etc/nginx/.htpasswd-preview YOUR_USERNAME
```
or, without `htpasswd`:
```
printf 'YOUR_USERNAME:%s\n' "$(openssl passwd -apr1)" | sudo tee /etc/nginx/.htpasswd-preview >/dev/null
```

Copy the build to the web folder:
```
sudo mkdir -p /var/www/preview
sudo rsync -a --delete apps/preview/dist/ /var/www/preview/
```

Create `/etc/nginx/sites-available/preview`:
```
server {
    listen 80;
    server_name preview.certkraft.com;

    root /var/www/preview;
    index index.html;

    auth_basic "Preview";
    auth_basic_user_file /etc/nginx/.htpasswd-preview;

    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location /media/ {
        add_header Cache-Control "public, max-age=86400";
        try_files $uri =404;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Enable it and turn on HTTPS:
```
sudo ln -s /etc/nginx/sites-available/preview /etc/nginx/sites-enabled/preview
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d preview.certkraft.com
```

Run certbot straight away: until it adds HTTPS, the password would travel unencrypted. Also add a `robots.txt` in the app's `public/` folder containing `User-agent: *` and `Disallow: /` (the repo already has one).

## 7. Deploy script

Create `deploy.sh` in the repo root:
```
#!/usr/bin/env bash
set -euo pipefail
git pull
pnpm install --frozen-lockfile
pnpm build
sudo rsync -a --delete --exclude 'media/' apps/preview/dist/ /var/www/preview/
echo "Deployed."
```
Make it executable with `chmod +x deploy.sh`, then run `./deploy.sh` after each change.

Images for previewing go in `/var/www/preview/media/`. The `--exclude 'media/'` line keeps them from being deleted on deploy.

## 7a. The files in this repo

- `deploy.sh` (repo root) is the script from step 7, with a `tar` fallback for servers without `rsync`. It also runs the type check and the tests before building, so a broken version is never copied to the server. Set `WEB_ROOT` to use another folder.
- `deploy/nginx-preview.conf` is the Nginx config from step 6. A test checks that it matches the block above, so the two cannot drift apart.
- Image files for previewing go in `/var/www/preview/media/` on the server (or in `apps/preview/public/media/` on your computer). They are not kept in git, and `deploy.sh` does not delete them.
- To point the app at another media address for everyone, build with `VITE_MEDIA_BASE_URL=https://example.com/media/ pnpm build`. Each person can also change it in the app (Media folder).

## 8. Checks after deploying

1. Open `https://preview.certkraft.com`. It should ask for the password.
2. Paste the sample page and confirm it renders.
3. Open it on a phone.
4. Confirm `https://preview.certkraft.com/robots.txt` disallows everything.
5. Run `curl -I` on the URL and confirm the `X-Robots-Tag` header is present.
6. Play one unlisted Vimeo video that has a `hash`. The referrer policy sends only the site name to Vimeo (not the full page address), which is enough for Vimeo's domain checks.

**Vimeo domain restriction:** the free plan has no domain restriction, so nothing breaks yet. After upgrading, check whether domain restriction is included. If it is, add the preview domain and the LMS domain to Vimeo's allowed list.

## 9. If the server uses cPanel or Apache

1. Create a subdomain in cPanel, for example `preview.certkraft.com`, and note its document root.
2. Run the build, then copy the contents of `apps/preview/dist/` into that document root (rsync or cPanel File Manager).
3. Turn on the free SSL certificate for the subdomain (AutoSSL).
4. In cPanel, use **Directory Privacy** on the document root to add a password.
5. Add this to `.htaccess` in the document root so deep links work and search engines are blocked:
```
Header set X-Robots-Tag "noindex, nofollow"
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 10. Security notes

- The app is client-side only. Pasted JSON never leaves the browser.
- The password is the only protection for unpublished lessons. Use a strong one and keep the site on HTTPS.
- Do not put secrets, API keys, or the media library's private files in this app.
- Use SSH keys, turn off root login and password SSH once keys work, and keep the firewall on.
- Back up the repository on GitHub. The server holds only build output and the media folder, so there is nothing else to back up.
