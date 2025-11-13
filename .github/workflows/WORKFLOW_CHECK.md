# Workflow File Check

## ✅ File Status

- **Location**: `.github/workflows/publish.yml`
- **Status**: ✅ Exists and valid
- **Purpose**: Auto-publish to npm when GitHub Release is created

## 📋 Workflow Configuration

### Trigger
- **Event**: `release` with type `published`
- **When**: Khi bạn tạo GitHub Release

### Permissions
- `contents: read` - Đọc repository
- `id-token: write` - OIDC token cho trusted publishing
- `packages: write` - Publish packages

### Steps
1. ✅ Checkout repository
2. ✅ Setup Node.js 20
3. ✅ Setup pnpm 10.12.4
4. ✅ Install dependencies (`pnpm install --frozen-lockfile`)
5. ✅ Build package (`pnpm build` - sẽ tự động copy files vào dist/)
6. ✅ Publish to npm (`npm publish --access public --provenance`)

## 🔍 Validation Results

Tất cả các thành phần cần thiết đã có:
- ✅ Workflow name
- ✅ Trigger configuration
- ✅ Permissions (bao gồm id-token: write cho OIDC)
- ✅ Node.js setup
- ✅ pnpm setup
- ✅ Build step
- ✅ Publish step với provenance

## 🚀 Cách sử dụng

1. **Setup Trusted Publishing trên npm** (chỉ cần làm 1 lần):
   - Vào npmjs.com → Package settings → Enable Trusted Publishing
   - Link với GitHub repository và workflow file

2. **Tạo Release để publish**:
   ```bash
   git tag v1.5.2
   git push origin v1.5.2
   ```
   Sau đó tạo GitHub Release từ tag đó.

3. **Workflow sẽ tự động chạy và publish package**

## 📝 Notes

- Workflow sử dụng **Trusted Publishing** (OIDC) - không cần NPM_TOKEN secret
- `pnpm build` sẽ tự động chạy `copy-dist` script để copy files vào `dist/`
- Provenance được tự động thêm vào package để verify

