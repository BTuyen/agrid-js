# Agrid JS

<p align="center">
  <img alt="agrid-logo" src="https://img.shields.io/badge/Agrid-JS-blue?style=for-the-badge">
</p>

<p align="center">
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/BTuyen/agrid-js"/>
  <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields'/></a>
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/BTuyen/agrid-js"/>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg"/>
</p>

## 🌾 Giới thiệu

**Agrid JS** là một monorepo chứa nhiều packages JavaScript để tích hợp với nền tảng **Agrid** - một hệ thống analytics và event tracking được fork từ PostHog.

Repository này cung cấp các SDK cho:
- 🌐 **Web/Browser**: Tracking events và analytics trên client-side
- ⚛️ **React**: Components và hooks cho React applications
- 📱 **React Native**: SDK cho mobile apps
- 🖥️ **Node.js**: Backend SDK cho server-side tracking
- 🚀 **Next.js & Nuxt**: Framework integrations
- 🤖 **AI**: AI integrations cho Node.js

## 📦 Packages

### Main Package

**`agrid-js`** - Root package chứa core functionality của Agrid JS SDK.

```bash
npm install agrid-js
```

> ⚠️ **Lưu ý**: Package `@agrid-js/core` đã được deprecated. Vui lòng sử dụng `agrid-js` thay thế.

### SDK Packages

Repository này chứa các packages sau:

| Package | NPM Name | Mô tả |
|---------|----------|-------|
| `browser/` | `@agrid/browser` | Main browser SDK cho client-side analytics và event tracking |
| `web/` | `agrid-js-lite` | Lightweight browser SDK - phiên bản nhẹ cho modern SPAs |
| `core/` | `@agrid/core` | Core functionality được chia sẻ bởi nhiều SDKs |
| `node/` | `@agrid/node` | Node.js backend SDK (yêu cầu Node >= 20) |
| `react/` | `@agrid/react` | React components và hooks cho analytics |
| `react-native/` | `@agrid/react-native` | React Native mobile SDK |
| `nuxt/` | `@agrid/nuxt` | Nuxt framework module |
| `nextjs-config/` | `@agrid/nextjs-config` | Next.js configuration helper |
| `ai/` | `@agrid/ai` | AI integrations cho Node.js |

## 🚀 Bắt đầu nhanh

### Cài đặt

```bash
# Core package (recommended)
npm install agrid-js

# Browser SDK
npm install @agrid/browser

# Lightweight Web SDK
npm install agrid-js-lite

# React SDK
npm install @agrid/react

# Node.js SDK
npm install @agrid/node

# React Native SDK
npm install @agrid/react-native
```

> ⚠️ **Deprecated**: `@agrid-js/core` đã được thay thế bằng `agrid-js`. Vui lòng cập nhật dependencies của bạn.

### Sử dụng cơ bản

#### Browser SDK
```javascript
import posthog from '@agrid/browser'

posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://your-agrid-instance.com'
})

posthog.capture('user_signed_up', {
  plan: 'premium'
})
```

#### React SDK
```jsx
import { PostHogProvider } from '@agrid/react'

function App() {
  return (
    <PostHogProvider apiKey="YOUR_PROJECT_API_KEY">
      <YourApp />
    </PostHogProvider>
  )
}
```

#### Node.js SDK
```javascript
import { PostHog } from '@agrid/node'

const posthog = new PostHog('YOUR_PROJECT_API_KEY', {
  host: 'https://your-agrid-instance.com'
})

posthog.capture({
  distinctId: 'user123',
  event: 'purchase',
  properties: {
    amount: 99.99
  }
})
```

## 📚 Tài liệu

### Tài liệu tích hợp
- **[Quick Start Guide](./docs/QUICK_START.md)** - Bắt đầu trong 5 phút
- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** - Hướng dẫn tích hợp chi tiết cho JS thuần và ReactJS
- **[Web 2Nông Integration](./docs/WEB2NONG_INTEGRATION.md)** - Hướng dẫn tích hợp cụ thể cho Web 2Nông

### Tài liệu tham khảo
- [Agrid JS Documentation](https://agridhub.vn/docs/agrid-js)
- [React SDK Documentation](https://agrid.dev/docs/libraries/react)
- [API Reference](./packages/browser/README.md)
- [Tất cả tài liệu](./docs/README.md)

## 🛠️ Development

### Yêu cầu

- Node.js >= 20
- pnpm >= 8

### Setup

```bash
# Clone repository
git clone https://github.com/BTuyen/agrid-js.git
cd agrid-js

# Cài đặt dependencies
pnpm install

# Build tất cả packages
pnpm build

# Chạy tests
pnpm test
```

### Cấu trúc thư mục

```
agrid-js/
├── packages/          # Tất cả SDK packages
│   ├── browser/       # Browser SDK
│   ├── web/           # Lightweight web SDK
│   ├── core/          # Core shared functionality
│   ├── node/          # Node.js SDK
│   ├── react/         # React SDK
│   ├── react-native/  # React Native SDK
│   └── ...
├── examples/          # Example projects
├── playground/        # Development playground
├── tooling/          # Shared development tooling
└── scripts/          # Build và utility scripts
```

### Scripts

```bash
# Build tất cả packages
pnpm build

# Watch mode cho development
pnpm dev

# Chạy tests
pnpm test

# Lint code
pnpm lint

# Tạo tarballs cho local testing
pnpm package

# Clean build artifacts
pnpm clean
```

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng xem [CONTRIBUTING.md](./CONTRIBUTING.md) để biết thêm chi tiết.

### Quy trình

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## 📄 License

MIT License - xem [LICENSE](./LICENSE) để biết thêm chi tiết.

## 🔗 Links

- **Website**: [agridhub.vn](https://agridhub.vn)
- **Documentation**: [agridhub.vn/docs](https://agridhub.vn/docs)
- **GitHub**: [github.com/BTuyen/agrid-js](https://github.com/BTuyen/agrid-js)
- **Issues**: [GitHub Issues](https://github.com/BTuyen/agrid-js/issues)

## 🙏 Acknowledgments

Agrid JS được fork từ [PostHog JS](https://github.com/PostHog/posthog-js) và được tùy chỉnh cho nền tảng Agrid.

Cảm ơn PostHog team đã tạo ra một codebase tuyệt vời!

📖 Xem thêm: [Fork Notes](./docs/FORK_NOTES.md) để biết chi tiết về các thay đổi.

---

<p align="center">
  Made with ❤️ by <a href="https://agridhub.vn">Agrid Team</a>
</p>
