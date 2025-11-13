# Hướng dẫn Setup Trusted Publishing cho NPM

## Trusted Publishing là gì?

Trusted Publishing sử dụng OIDC (OpenID Connect) để xác thực với npm registry mà không cần lưu trữ NPM_TOKEN trong GitHub Secrets. Điều này an toàn hơn và dễ quản lý hơn.

## Setup Trusted Publishing trên NPM

### Bước 1: Tạo Automation Token trên npmjs.com

1. Đăng nhập vào [npmjs.com](https://www.npmjs.com)
2. Vào **Settings** → **Access Tokens**
3. Click **Generate New Token** → Chọn **Automation**
4. Copy token (chỉ hiển thị 1 lần)

### Bước 2: Publish package lần đầu (để tạo package trên npm)

```bash
npm login
npm publish --access public --provenance
```

### Bước 3: Enable Trusted Publishing trên npm

1. Vào package page trên npmjs.com: `https://www.npmjs.com/package/@agrid-js/core`
2. Vào tab **Settings**
3. Scroll xuống phần **Publishing**
4. Click **Enable Trusted Publishing**
5. Chọn GitHub repository: `BTuyen/agrid-js`
6. Chọn workflow file: `.github/workflows/publish.yml`
7. Click **Enable**

### Bước 4: Verify

Sau khi enable, workflow sẽ tự động publish khi bạn tạo GitHub Release.

## Cách sử dụng

### Tạo Release để trigger publish

1. Tạo tag mới:
```bash
git tag v1.5.2
git push origin v1.5.2
```

2. Tạo GitHub Release:
   - Vào GitHub repository
   - Click **Releases** → **Create a new release**
   - Chọn tag vừa tạo
   - Điền release notes
   - Click **Publish release**

3. Workflow sẽ tự động chạy và publish package lên npm

## Lưu ý

- ✅ Không cần NPM_TOKEN secret trong GitHub
- ✅ Provenance được tự động thêm vào package
- ✅ Chỉ publish khi có GitHub Release (an toàn hơn)
- ⚠️ Cần publish package lần đầu thủ công để tạo package trên npm
- ⚠️ Package name phải match với name trong package.json

## Troubleshooting

### Lỗi: "Package not found"
- Package chưa được tạo trên npm
- Cần publish thủ công lần đầu

### Lỗi: "Trusted Publishing not enabled"
- Chưa enable trusted publishing trên npm
- Kiểm tra lại bước 3

### Lỗi: "Workflow not found"
- Đảm bảo file `.github/workflows/publish.yml` tồn tại
- Kiểm tra tên workflow trong npm settings

