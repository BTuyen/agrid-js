# Kiểm tra package.json

## Kết quả kiểm tra

### ✅ Các field đã đúng:

1. **name**: `@agrid-js/core` ✅
2. **publishConfig**:
   - `access: "public"` ✅
   - `provenance: true` ✅
3. **repository**:
   - `type: "git"` ✅
   - `url: "https://github.com/BTuyen/agrid-js.git"` ✅

### ⚠️ Các field cần lưu ý:

1. **version**: `1.5.2` (yêu cầu: `1.0.0`)
   - Version hiện tại là 1.5.2, có thể giữ nguyên hoặc đổi về 1.0.0 tùy nhu cầu

2. **main**: `packages/core/dist/index.js` (yêu cầu: `dist/index.js`)
   - Hiện tại đúng với cấu trúc monorepo
   - Nếu muốn publish root package với main là `dist/index.js`, cần:
     - Copy files từ `packages/core/dist/` sang `dist/` sau khi build
     - Hoặc thay đổi build process

## Đề xuất

Vì đây là **monorepo**, có 2 lựa chọn:

### Option 1: Giữ nguyên cấu trúc hiện tại (Khuyến nghị)
- Main: `packages/core/dist/index.js`
- Phù hợp với monorepo structure
- Files field đã include `packages/core/dist`

### Option 2: Điều chỉnh để main là `dist/index.js`
- Cần thêm build step để copy files
- Hoặc thay đổi cấu trúc build

## Quyết định

Bạn muốn:
- [ ] Giữ nguyên (main: `packages/core/dist/index.js`)
- [ ] Điều chỉnh (main: `dist/index.js`)

