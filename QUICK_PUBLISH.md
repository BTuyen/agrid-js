# Hướng dẫn Publish Nhanh @agrid/core

## Trạng thái hiện tại ✅
- ✅ Package đã được build thành công
- ✅ Dry-run đã pass
- ✅ Package name chưa tồn tại trên npm (có thể publish)
- ⚠️  Chưa login npm

## Các bước để publish:

### Bước 1: Login npm
```bash
npm login
```
Nhập:
- Username: (tài khoản npm của bạn)
- Password: (mật khẩu)
- Email: (email đã đăng ký)
- OTP: (nếu bật 2FA)

### Bước 2: Publish package
Sau khi login thành công, chạy một trong các lệnh sau:

**Cách 1: Sử dụng script helper (Khuyến nghị)**
```bash
./scripts/publish-package.sh @agrid/core
```

**Cách 2: Publish trực tiếp**
```bash
pnpm publish --filter=@agrid/core --no-git-checks
```

**Cách 3: Publish từ thư mục package**
```bash
cd packages/core
pnpm publish --no-git-checks
```

### Bước 3: Kiểm tra sau khi publish
```bash
# Xem package trên npm
npm view @agrid/core

# Xem tất cả versions
npm view @agrid/core versions

# Test install
mkdir test-install && cd test-install
npm init -y
npm install @agrid/core
```

## Lưu ý:
- Có một số file chưa commit (git status), nhưng không ảnh hưởng đến publish
- Nếu muốn commit trước, có thể chạy: `git add . && git commit -m "Prepare for publish"`
- Hoặc dùng flag `--no-git-checks` để bỏ qua kiểm tra git

## Sau khi publish thành công:
Package sẽ có tại: https://www.npmjs.com/package/@agrid/core

