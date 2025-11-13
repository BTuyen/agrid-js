# Hướng dẫn Deprecate Package @agrid-js/core

Package `@agrid-js/core` đã được thay thế bằng `agrid-js`. Để deprecate package cũ, chạy lệnh sau:

## Deprecate Package

```bash
npm deprecate @agrid-js/core "This package has been renamed to agrid-js. Please use 'agrid-js' instead. Install with: npm install agrid-js" --otp=<your-otp-code>
```

Hoặc nếu npm tự động mở browser để xác thực:

```bash
npm deprecate @agrid-js/core "This package has been renamed to agrid-js. Please use 'agrid-js' instead. Install with: npm install agrid-js"
```

## Migration Guide

### Trước đây (Deprecated)
```bash
npm install @agrid-js/core
```

```javascript
import { PostHogCore } from '@agrid-js/core'
```

### Hiện tại (Recommended)
```bash
npm install agrid-js
```

```javascript
import { PostHogCore } from 'agrid-js'
```

## Lưu ý

- Package `@agrid-js/core` vẫn hoạt động nhưng sẽ hiển thị warning khi install
- Không thể unpublish package đã publish trên npm
- Deprecate message sẽ hiển thị khi user cài đặt package cũ

