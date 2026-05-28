# Deploying to a single Google Compute Engine VM

Target: one `e2-small` VM in `europe-west3-a`, Debian 12, Node 20, Caddy fronting Next.js on port 3000 with auto-HTTPS. SQLite file lives on the VM's persistent boot disk at `/var/lib/myapp/app.db`.

You will need:

- A GCP project with billing enabled.
- The `gcloud` CLI installed and authenticated locally (`gcloud auth login`).
- A domain (or subdomain) you control, so Caddy can get a Let's Encrypt cert.

## 1. Create the VM

Run these locally. Replace `YOUR_PROJECT_ID`.

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud compute instances create myapp \
  --zone=europe-west3-a \
  --machine-type=e2-small \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --tags=http-server,https-server
```

The `http-server` and `https-server` tags map to GCP's default firewall rules — ports 80 and 443 will be open to the internet.

Get the VM's external IP:

```bash
gcloud compute instances describe myapp --zone=europe-west3-a \
  --format='value(networkInterfaces[0].accessConfigs[0].natIP)'
```

## 2. Point your domain at the VM

In your DNS provider, create an **A record** for the domain you want to use (e.g. `myapp.example.com`) pointing at the IP from the previous step. Wait a minute or two for it to propagate. You can sanity-check with:

```bash
nslookup myapp.example.com
```

Caddy will refuse to issue a cert until DNS resolves correctly.

## 3. SSH in and provision

```bash
gcloud compute ssh myapp --zone=europe-west3-a
```

Everything below runs **on the VM**.

### 3a. Install Node 20, Caddy, and build tools

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

### 3b. Create the app user and directories

```bash
sudo useradd --system --shell /usr/sbin/nologin --home /opt/myapp myapp
sudo mkdir -p /opt/myapp /var/lib/myapp
sudo chown -R myapp:myapp /opt/myapp /var/lib/myapp
```

### 3c. Clone, build, and install

```bash
sudo -u myapp git clone https://github.com/muhsinba/my-hello-world.git /opt/myapp
cd /opt/myapp
sudo -u myapp npm ci
sudo -u myapp npm run build
```

### 3d. Create the env file

```bash
sudo cp /opt/myapp/deploy/app.env.example /etc/myapp.env
sudo chown myapp:myapp /etc/myapp.env
sudo chmod 600 /etc/myapp.env

# Generate a real session secret and edit the file
openssl rand -base64 48
sudo nano /etc/myapp.env   # paste the secret into SESSION_SECRET
```

### 3e. Install and start the systemd unit

```bash
sudo cp /opt/myapp/deploy/myapp.service /etc/systemd/system/myapp.service
sudo systemctl daemon-reload
sudo systemctl enable --now myapp
sudo systemctl status myapp
```

If it failed to start, check logs with `sudo journalctl -u myapp -e`.

### 3f. Configure Caddy

Edit the placeholder domain to match yours, then install:

```bash
sudo cp /opt/myapp/deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile   # change your-domain.example.com to your real domain
sudo systemctl reload caddy
```

Visit `https://your-domain.example.com` — first request may take ~10 seconds while Caddy fetches the TLS cert. After that, the home page should load over HTTPS, and login should work.

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
