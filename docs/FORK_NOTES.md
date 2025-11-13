# Ghi chú về Fork từ PostHog JS

Tài liệu này mô tả về việc fork project từ PostHog JS sang Agrid JS và các thay đổi đã thực hiện.

## 📋 Tổng quan

Agrid JS được fork từ [PostHog JS](https://github.com/PostHog/posthog-js) và được tùy chỉnh cho nền tảng **Agrid** - một hệ thống analytics và event tracking cho nông nghiệp.

## 🔄 Các thay đổi chính

### 1. Package Names

| PostHog | Agrid |
|---------|-------|
| `posthog-js` | `@agrid/browser` |
| `posthog-js-lite` | `agrid-js-lite` |
| `@posthog/core` | `@agrid/core` |
| `@posthog/react` | `@agrid/react` |
| `posthog-node` | `@agrid/node` |
| `posthog-react-native` | `@agrid/react-native` |
| `@posthog/nuxt` | `@agrid/nuxt` |
| `@posthog/nextjs-config` | `@agrid/nextjs-config` |
| `@posthog/ai` | `@agrid/ai` |

### 2. Repository

- **Original**: https://github.com/PostHog/posthog-js
- **Forked**: https://github.com/BTuyen/agrid-js

### 3. Branding

- Tất cả references đến "PostHog" đã được thay bằng "Agrid"
- Logo và branding đã được cập nhật
- Documentation URLs đã được thay đổi

### 4. API Host

- **PostHog**: `https://us.i.posthog.com` (hoặc các region khác)
- **Agrid**: `https://agrid.2nong.vn` (hoặc custom instance)

## ✅ Đảm bảo Fork đúng cách

### Kiểm tra Package Names

Tất cả packages đã được đổi tên từ `@posthog/*` sang `@agrid/*`:

```bash
# Kiểm tra package names
grep -r "name.*@agrid" packages/*/package.json
```

### Kiểm tra Repository URLs

Tất cả repository URLs đã được cập nhật:

```bash
# Kiểm tra repository URLs
grep -r "github.com/BTuyen/agrid-js" packages/*/package.json
```

### Kiểm tra Documentation

- README.md đã được cập nhật với thông tin Agrid
- Tài liệu tích hợp đã được tạo mới
- Examples đã được cập nhật

## 🔧 Cấu hình cho Web 2Nông

### API Configuration

```javascript
posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://agrid.2nong.vn', // Agrid instance cho Web 2Nông
  // ... other config
})
```

### Environment Variables

```bash
# .env
REACT_APP_AGRID_API_KEY=your_api_key
REACT_APP_AGRID_HOST=https://agrid.2nong.vn
```

## 📝 Lưu ý khi sử dụng

1. **API Compatibility**: Agrid JS tương thích với PostHog API, nhưng cần point đến Agrid instance
2. **Feature Flags**: Sử dụng Agrid dashboard để quản lý feature flags
3. **Session Recording**: Session recordings được lưu trên Agrid instance
4. **Data Privacy**: Dữ liệu được lưu trữ trên Agrid infrastructure

## 🔗 Links

- [PostHog JS Original](https://github.com/PostHog/posthog-js) - Repository gốc
- [Agrid JS Fork](https://github.com/BTuyen/agrid-js) - Repository fork
- [Agrid Platform](https://agridhub.vn) - Nền tảng Agrid

## 🙏 Acknowledgments

Cảm ơn PostHog team đã tạo ra một codebase tuyệt vời và cho phép fork để tùy chỉnh cho nhu cầu cụ thể.

