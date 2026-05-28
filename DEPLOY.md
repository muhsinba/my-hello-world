# Deploying to a single Google Compute Engine VM

Target: one `e2-small` VM in `europe-west3-a`, Debian 12, Node 20, Caddy fronting Next.js on port 3000. Initially served over **HTTP only** — adding HTTPS later is one config swap (see "Switching to HTTPS later" below). SQLite file lives on the VM's persistent boot disk at `/var/lib/myapp/app.db`.

You will need:

- A GCP project with billing enabled.
- The `gcloud` CLI installed and authenticated locally (`gcloud auth login`).
- A domain — **not required for the initial HTTP deploy**, but needed when you turn on HTTPS later.

## 1. Create the VM

Run these locally. Replace `YOUR_PROJECT_ID`.

```bash
gcloud config set project YOUR_PROJECT_ID

# Enable the Compute Engine API (idempotent, ~30s on first run)
gcloud services enable compute.googleapis.com

gcloud compute instances create myapp \
  --zone=europe-west3-a \
  --machine-type=e2-small \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --tags=http-server,https-server
```

The `http-server` / `https-server` tags only do something if matching firewall rules target them. Older GCP projects had `default-allow-http` / `default-allow-https` rules pre-created; newer ones often don't. Create them explicitly:

```bash
gcloud compute firewall-rules create default-allow-http \
  --network=default --direction=INGRESS --action=ALLOW \
  --rules=tcp:80 --source-ranges=0.0.0.0/0 --target-tags=http-server

gcloud compute firewall-rules create default-allow-https \
  --network=default --direction=INGRESS --action=ALLOW \
  --rules=tcp:443 --source-ranges=0.0.0.0/0 --target-tags=https-server
```

If you see `already exists`, the rule was pre-created — safe to ignore.

Get the VM's external IP:

```bash
gcloud compute instances describe myapp --zone=europe-west3-a \
  --format='value(networkInterfaces[0].accessConfigs[0].natIP)'
```

Note that IP for later — you'll visit `http://THAT_IP/` once the app is up.

## 2. SSH in and provision

```bash
gcloud compute ssh myapp --zone=europe-west3-a
```

Everything below runs **on the VM**.

### 2a. Install Node 20, Caddy, and build tools

```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential python3 ca-certificates debian-keyring debian-archive-keyring apt-transport-https

# Node 20 from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Caddy from the official repo
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

`build-essential` and `python3` are required because `better-sqlite3` builds a native binding during `npm ci`.

### 2b. Create the app user and directories

```bash
sudo useradd --system --shell /usr/sbin/nologin --home /opt/myapp myapp
sudo mkdir -p /opt/myapp /var/lib/myapp
sudo chown -R myapp:myapp /opt/myapp /var/lib/myapp
```

### 2c. Clone, build, and install

```bash
sudo -u myapp git clone https://github.com/muhsinba/my-hello-world.git /opt/myapp
cd /opt/myapp
sudo -u myapp npm ci
sudo -u myapp npm run build
```

### 2d. Create the env file

```bash
sudo cp /opt/myapp/deploy/app.env.example /etc/myapp.env
sudo chown myapp:myapp /etc/myapp.env
sudo chmod 600 /etc/myapp.env

# Generate a real session secret and edit the file
openssl rand -base64 48
sudo nano /etc/myapp.env   # paste the secret into SESSION_SECRET
```

### 2e. Install and start the systemd unit

```bash
sudo cp /opt/myapp/deploy/myapp.service /etc/systemd/system/myapp.service
sudo systemctl daemon-reload
sudo systemctl enable --now myapp
sudo systemctl status myapp
```

If it failed to start, check logs with `sudo journalctl -u myapp -e`.

### 2f. Configure Caddy (HTTP for now)

```bash
sudo cp /opt/myapp/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

The shipped Caddyfile listens on `:80` and reverse-proxies to Next.js on `:3000` — no domain or TLS cert needed.

Visit `http://VM_EXTERNAL_IP/` in your browser (use the IP you got at the end of §1). The home page should load, and login should work — `SECURE_COOKIES=false` in the env file lets the session cookie ride plain HTTP.

## Switching to HTTPS later

When you have a domain, three changes turn on TLS:

1. **DNS** — create an A record for the domain pointing at the VM's external IP. Confirm with `nslookup your-domain.com`.

2. **Caddyfile** — on the VM, replace `/etc/caddy/Caddyfile` with a domain block:

   ```caddyfile
   your-domain.com {
       encode gzip
       reverse_proxy localhost:3000
   }
   ```

   Then `sudo systemctl reload caddy`. First request takes ~10 seconds while Caddy fetches a Let's Encrypt cert.

3. **Flip the secure-cookie flag** — edit `/etc/myapp.env`:

   ```
   SECURE_COOKIES=true
   ```

   Then `sudo systemctl restart myapp`. Do this **after** HTTPS is working — flipping it before TLS means the browser drops the session cookie and login silently fails.

## Updating the app later

```bash
gcloud compute ssh myapp --zone=europe-west3-a
cd /opt/myapp
sudo -u myapp git pull
sudo -u myapp npm ci
sudo -u myapp npm run build
sudo systemctl restart myapp
```

## Backing up the database

The whole DB is three files. Snapshot them while the app is briefly stopped (SQLite WAL files can be inconsistent if copied mid-write):

```bash
sudo systemctl stop myapp
sudo tar czf ~/myapp-backup-$(date +%F).tar.gz -C /var/lib/myapp .
sudo systemctl start myapp
```

For zero-downtime backups, use SQLite's online backup API instead — beyond the scope of this demo.

## Tearing down

```bash
gcloud compute instances delete myapp --zone=europe-west3-a
```

That deletes the VM and its boot disk (including `app.db`). Done.

## Caveats for a demo deployment

- **Single instance, single point of failure.** If the VM dies, the app is down until you re-provision.
- **No automated backups.** You own this.
- **No CI/CD.** Updates are SSH-and-run.
- **`better-sqlite3` writes are serialized.** Fine at low traffic; a real app with concurrent writers should be on Cloud SQL.
- **OS updates are manual.** `sudo apt-get update && sudo apt-get upgrade` periodically, or enable unattended-upgrades.
