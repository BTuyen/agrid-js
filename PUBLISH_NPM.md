# Hướng dẫn Publish Package lên NPM

## Bước 1: Chuẩn bị tài khoản NPM

### 1.1. Tạo tài khoản NPM (nếu chưa có)
- Truy cập: https://www.npmjs.com/signup
- Đăng ký tài khoản mới

### 1.2. Tạo Access Token (khuyến nghị)
1. Đăng nhập vào npmjs.com
2. Vào **Settings** → **Access Tokens**
3. Click **Generate New Token**
4. Chọn loại token:
   - **Automation**: Cho CI/CD (không hết hạn)
   - **Publish**: Cho publish thủ công (có thể set thời hạn)
5. Copy token và lưu lại (chỉ hiển thị 1 lần)

## Bước 2: Đăng nhập NPM

### Cách 1: Sử dụng `npm login` (cho publish thủ công)
```bash
npm login
# Nhập username, password, email và OTP (nếu bật 2FA)
```

### Cách 2: Sử dụng Access Token (khuyến nghị)
```bash
# Tạo file .npmrc trong thư mục home
echo "//registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN" > ~/.npmrc

# Hoặc set environment variable
export NODE_AUTH_TOKEN=YOUR_NPM_TOKEN
```

## Bước 3: Kiểm tra và cập nhật thông tin package

### 3.1. Kiểm tra package.json
Đảm bảo các thông tin sau đã đúng:
- `name`: Tên package (phải unique trên npm)
- `version`: Version mới (theo semver)
- `description`: Mô tả package
- `license`: License (thường là "MIT")
- `repository`: Link GitHub
- `keywords`: Từ khóa tìm kiếm
- `author`: Thông tin tác giả

### 3.2. Kiểm tra package name có sẵn
```bash
npm view @agrid/core
# Nếu trả về 404 thì tên chưa được sử dụng
# Nếu có thông tin thì package đã tồn tại
```

## Bước 4: Build package

```bash
# Build tất cả packages
pnpm build

# Hoặc build package cụ thể
pnpm turbo --filter=@agrid/core build
```

## Bước 5: Kiểm tra package trước khi publish

### 5.1. Tạo tarball để kiểm tra
```bash
cd packages/core
pnpm pack
# Sẽ tạo file @agrid-core-1.5.2.tgz
```

### 5.2. Kiểm tra nội dung package
```bash
tar -tzf @agrid-core-1.5.2.tgz | head -20
# Xem các file sẽ được publish
```

### 5.3. Test install local
```bash
# Tạo project test
mkdir test-install && cd test-install
npm init -y
npm install ../packages/core/@agrid-core-1.5.2.tgz
# Kiểm tra xem package có hoạt động không
```

## Bước 6: Publish package

> **Lưu ý**: Package `@agrid/core` đã có `publishConfig.access: "public"` trong package.json, nên không cần thêm `--access public` nữa.

### 6.1. Sử dụng script helper (Khuyến nghị)
```bash
# Publish với tag latest (mặc định)
./scripts/publish-package.sh @agrid/core

# Publish với tag alpha/beta
./scripts/publish-package.sh @agrid/core alpha
./scripts/publish-package.sh @agrid/core beta
```

Script này sẽ:
- ✅ Kiểm tra đã login npm chưa
- ✅ Build package tự động
- ✅ Kiểm tra version đã tồn tại chưa
- ✅ Chạy dry-run trước
- ✅ Xác nhận trước khi publish

### 6.2. Publish package đơn lẻ
```bash
cd packages/core
pnpm publish
```

### 6.3. Publish từ root với filter
```bash
# Từ root directory
pnpm publish --filter=@agrid/core
```

### 6.4. Publish với tag (cho pre-release)
```bash
# Alpha/Beta release
pnpm publish --filter=@agrid/core --tag alpha

# Hoặc
pnpm publish --filter=@agrid/core --tag beta
```

### 6.5. Dry run (kiểm tra trước khi publish thật)
```bash
pnpm publish --filter=@agrid/core --dry-run
```

## Bước 7: Kiểm tra sau khi publish

### 7.1. Kiểm tra trên npmjs.com
- Truy cập: https://www.npmjs.com/package/@agrid/core
- Xác nhận version mới đã xuất hiện

### 7.2. Test install từ npm
```bash
mkdir test-npm-install && cd test-npm-install
npm init -y
npm install @agrid/core
# Kiểm tra xem package có hoạt động không
```

## Bước 8: Cập nhật version cho lần publish tiếp theo

### 8.1. Sử dụng npm version
```bash
cd packages/core
npm version patch  # 1.5.2 -> 1.5.3
npm version minor  # 1.5.2 -> 1.6.0
npm version major  # 1.5.2 -> 2.0.0
```

### 8.2. Hoặc chỉnh sửa thủ công trong package.json
```json
{
  "version": "1.5.4"
}
```

## Lưu ý quan trọng

### 1. Scoped packages (@agrid/core)
- Scoped packages mặc định là **private**
- Package `@agrid/core` đã có `publishConfig.access: "public"` trong package.json
- Nếu package khác chưa có, thêm vào package.json:
```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 2. Versioning
- Tuân theo [Semantic Versioning](https://semver.org/):
  - **PATCH** (1.5.2 → 1.5.3): Bug fixes
  - **MINOR** (1.5.2 → 1.6.0): New features (backward compatible)
  - **MAJOR** (1.5.2 → 2.0.0): Breaking changes

### 3. Files được publish
- Chỉ các file trong `files` field của package.json
- Hoặc các file mặc định: package.json, README.md, LICENSE, etc.
- Kiểm tra bằng `pnpm pack` trước khi publish

### 4. Two-Factor Authentication (2FA)
- Nếu bật 2FA, cần OTP khi login
- Hoặc sử dụng Access Token (không cần OTP)

## Troubleshooting

### Lỗi: "You do not have permission to publish"
- Kiểm tra bạn đã login chưa: `npm whoami`
- Kiểm tra tên package có bị trùng không
- Với scoped package, đảm bảo có `publishConfig.access: "public"` trong package.json hoặc thêm `--access public`

### Lỗi: "Package name already exists"
- Tên package đã được sử dụng
- Cần đổi tên hoặc liên hệ owner của package đó

### Lỗi: "Version already exists"
- Version này đã được publish
- Cần tăng version trong package.json

### Lỗi: "Invalid package name"
- Tên package không hợp lệ
- Không được có chữ hoa, khoảng trắng, ký tự đặc biệt (trừ `-`, `_`, `.`)
- Scoped package: `@scope/package-name`

## Ví dụ workflow hoàn chỉnh

### Cách 1: Sử dụng script helper (Đơn giản nhất)
```bash
# 1. Login npm
npm login

# 2. Publish (script sẽ tự động build và kiểm tra)
./scripts/publish-package.sh @agrid/core

# 3. Kiểm tra
npm view @agrid/core versions
```

### Cách 2: Publish thủ công
```bash
# 1. Login npm
npm login

# 2. Build package
cd /Users/b.tuyen/advn/agrid-js
pnpm build

# 3. Kiểm tra package
cd packages/core
pnpm pack --dry-run

# 4. Publish (không cần --access public vì đã có publishConfig)
pnpm publish

# 5. Kiểm tra
npm view @agrid/core versions
```

## Tự động hóa với CI/CD

Xem file `.github/workflows/release.yml` để setup tự động publish khi có tag mới.

