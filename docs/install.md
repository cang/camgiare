# Hướng dẫn cài đặt & deploy production

Áp dụng cho VPS Vietnix SSD 4 (4 CPU / 8GB RAM / 50GB SSD), OS `Ubuntu-24.04-LTS-x64` (bản thường, không aaPanel).

Kiến trúc deploy: cài **trực tiếp trên OS (native)**, không dùng Docker — lý do đã ghi trong quyết định hosting (ổ đĩa 50GB cần dành cho ảnh, chưa cần scale nhiều máy). Stack: Node.js (PM2 quản lý process) + MongoDB standalone (native) + Nginx (reverse proxy + SSL).

> `docker-compose.yml` trong repo chỉ định nghĩa container MongoDB cho dev, không dùng cho production.

## 1. Chuẩn bị VPS

SSH vào VPS bằng user root (Vietnix cấp sẵn). Các bước cài đặt hệ thống bên dưới (Node.js, MongoDB, Nginx, certbot...) chạy trực tiếp bằng root, không cần tạo user sudo riêng.

```bash
apt update && apt upgrade -y
```

**Nhưng không chạy process Node.js/PM2 bằng root** — nếu app có lỗ hổng, attacker sẽ có toàn quyền trên cả VPS thay vì chỉ giới hạn trong 1 user. Tạo riêng 1 user chỉ để chạy app, không thêm vào group `sudo`:

```bash
adduser deploy
```

User `deploy` này chỉ dùng để `git pull`, `npm install/build`, `pm2` (xem bước 4 trở đi) — không có quyền admin và không cần có.

Cấu hình firewall cơ bản — chỉ mở SSH, HTTP, HTTPS ra ngoài; port 3000 (Next.js) và 27017 (MongoDB) chỉ nghe trên `127.0.0.1`, không mở ra internet:

```bash
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 2. Cài Node.js

Repo yêu cầu Node `^18.20.2 || >=20.9.0` (xem `engines` trong `package.json`). Ubuntu 24.04 mặc định có bản Node cũ trong apt, nên cài qua NodeSource (khuyến nghị Node 22 LTS):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
npm -v
```

Package manager của project là **npm** (không phải pnpm, dù vài script trong `package.json` còn nhắc pnpm — bản copy này đã bỏ workspace). Cài `pm2` toàn cục để quản lý process:

```bash
npm install -g pm2
```

## 3. Cài MongoDB (native, standalone)

Thêm repo chính thức MongoDB 8.0 cho Ubuntu 24.04 (noble):

```bash
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list

apt update
apt install -y mongodb-org
systemctl enable --now mongod
```

Đây là standalone (không replica set) — Payload tự phát hiện thiếu `replicaSet` trong connection string và tự tắt transaction (`transactionOptions = false`), không cần cấu hình gì thêm, không lỗi (xem `node_modules/@payloadcms/db-mongodb/dist/connect.js:56-59`).

Mặc định `mongod` chỉ bind `127.0.0.1` (kiểm tra `/etc/mongod.conf`, mục `net.bindIp`) — giữ nguyên, không mở ra ngoài. Firewall (`ufw`) ở bước 1 cũng không mở port 27017 ra internet.

**Tạm thời chưa bật `security.authorization`** — quyết định có chủ ý, vì port 27017 không thể bị truy cập từ bên ngoài (chỉ bind localhost + firewall chặn), nên rủi ro thấp ở giai đoạn hiện tại (1 app, mới launch). Connection string cho giai đoạn này không cần user/password:

```
mongodb://127.0.0.1:27017/camgiare
```

> Cần bật lại `authorization: enabled` khi: (1) có thêm app/database khác share chung VPS này (đã bàn ở phần subdomain/domain mới) — không bật auth thì mọi process trên máy đều đọc/ghi được **mọi** database, không chỉ database của riêng nó; hoặc (2) sau này cần mở port 27017 ra ngoài vì lý do nào đó. Khi bật, tạo user theo mẫu dưới đây **trước khi** enable, không làm ngược lại (nếu bật auth mà chưa có user nào thì bị khóa hoàn toàn, phải tắt tạm `authorization` để sửa):
>
> ```bash
> mongosh
> ```
>
> ```js
> use admin
> db.createUser({
>   user: "payloadAdmin",
>   pwd: "<password>",
>   roles: [{ role: "readWrite", db: "camgiare" }]
> })
> // Tạo thêm 1 user quản trị riêng để sau này còn đăng nhập tạo user mới cho db khác:
> db.createUser({
>   user: "dbadmin",
>   pwd: "<password-khac>",
>   roles: [{ role: "root", db: "admin" }]
> })
> exit
> ```
>
> ```yaml
> security:
>   authorization: enabled
> ```
>
> Rồi `systemctl restart mongod`. Connection string lúc đó đổi thành `mongodb://payloadAdmin:<password>@127.0.0.1:27017/camgiare?authSource=admin`.

## 4. Lấy code lên server

Root tạo thư mục và giao quyền cho `deploy`, rồi chuyển sang user `deploy` để làm các bước còn lại (git, npm, build, pm2) — từ đây trở đi, mọi lệnh có tiền tố `deploy$` là chạy dưới user `deploy`, không phải root:

```bash
mkdir -p /var/www/camgiare
chown deploy:deploy /var/www/camgiare
su - deploy
```

```bash
deploy$ cd /var/www/camgiare
deploy$ git clone <repo-url> .
```

Cài dependency (dùng npm, không dùng pnpm — theo `.npmrc` đã set `legacy-peer-deps=true`):

```bash
deploy$ npm install
```

## 5. Cấu hình `.env` production

Copy từ `.env.example` rồi chỉnh lại các giá trị cho production:

```bash
deploy$ cp .env.example .env
```

Các biến bắt buộc phải đổi so với `.env.example`:

- `PAYLOAD_SECRET` — sinh chuỗi ngẫu nhiên mới (không dùng `mygeneratedsecret`), ví dụ `openssl rand -base64 32`.
- `DATABASE_URL` — connection string MongoDB đã tạo ở bước 3, ví dụ `mongodb://payloadAdmin:<password>@127.0.0.1:27017/camgiare?authSource=admin`.
- `PAYLOAD_PUBLIC_SERVER_URL` và `NEXT_PUBLIC_SERVER_URL` — đổi từ `http://localhost:3000` thành domain thật, ví dụ `https://camgiare.vn`.
- `PREVIEW_SECRET` — đổi khỏi giá trị demo.
- Các biến Stripe (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOKS_SIGNING_SECRET`) — điền key thật nếu đã bật thanh toán, nếu chưa dùng thì để nguyên placeholder.

## 6. Build

Build cần nhiều RAM (script `build` đã set `--max-old-space-size=8000`, tận dụng gần hết 8GB RAM của VPS) — không chạy build song song với việc khác nặng tài nguyên trên cùng máy:

```bash
deploy$ npm run build
```

## 7. Chạy bằng PM2

Tạo file `ecosystem.config.cjs` (không commit vào repo, chỉ tồn tại trên server) tại `/var/www/camgiare/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'camgiare',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/camgiare',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1500M',
    },
  ],
}
```

Khởi động (vẫn dưới user `deploy`) và cho PM2 tự chạy lại khi VPS reboot:

```bash
deploy$ pm2 start ecosystem.config.cjs
deploy$ pm2 save
deploy$ pm2 startup systemd -u deploy --hp /home/deploy
```

Lệnh cuối in ra 1 dòng lệnh bắt đầu bằng `env PATH=...` — thoát về root (`exit`) rồi chạy đúng dòng đó để đăng ký service systemd (bước này bắt buộc phải chạy bằng root, `deploy` không có quyền):

```bash
deploy$ exit
```

```bash
env PATH=... pm2 startup systemd -u deploy --hp /home/deploy
```

Xem log / trạng thái (chạy được ở cả 2 user, nhưng thường tiện nhất là `su - deploy` lại):

```bash
pm2 logs camgiare
pm2 status
```

## 8. Nginx reverse proxy + SSL

Chạy bằng root:

```bash
apt install -y nginx
```

Tạo file `/etc/nginx/sites-available/camgiare`:

```nginx
server {
    listen 80;
    server_name camgiare.vn www.camgiare.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt site và cấp SSL bằng Let's Encrypt:

```bash
ln -s /etc/nginx/sites-available/camgiare /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

apt install -y certbot python3-certbot-nginx
certbot --nginx -d camgiare.vn -d www.camgiare.vn
```

Certbot tự cấu hình lại block `server` để redirect HTTP → HTTPS và tự gia hạn chứng chỉ (systemd timer `certbot.timer` đã bật sẵn sau khi cài).

## 9. Backup MongoDB

Không có replica set nên không có failover tự động — backup định kỳ là bắt buộc. Ví dụ cron chạy `mongodump` hàng đêm (chạy bằng root):

```bash
crontab -e
```

```
0 2 * * * mongodump --uri="mongodb://payloadAdmin:<password>@127.0.0.1:27017/camgiare?authSource=admin" --out=/var/backups/mongo/$(date +\%F) --gzip
```

Nên đồng bộ thư mục backup này ra một nơi khác VPS (vd rclone lên cloud storage) để tránh mất dữ liệu nếu VPS gặp sự cố phần cứng.

## 10. Quy trình deploy khi có code mới

Chạy dưới user `deploy` (`su - deploy` từ root nếu đang ở phiên root):

```bash
deploy$ cd /var/www/camgiare
deploy$ git pull
deploy$ npm install
deploy$ npm run build
deploy$ pm2 restart camgiare
```

## 11. Việc còn để sau (chưa cần làm ngay)

- **MinIO**: hiện ảnh vẫn lưu trực tiếp trên disk qua `staticDir` (`src/collections/Media.ts`). Sẽ chuyển sang MinIO + `@payloadcms/storage-s3` khi có số liệu dung lượng ảnh thật sau migrate — xem quyết định đã ghi lại, không cần làm ở bước cài đặt ban đầu này.
- **Cổng thanh toán VN** (VNPay/Momo/ZaloPay): `stripeAdapter` hiện có trong `src/plugins/index.ts` nhưng chưa nối để dùng thật.
