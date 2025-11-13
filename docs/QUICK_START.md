# Quick Start Guide - Agrid JS

Hướng dẫn nhanh để bắt đầu với Agrid JS trong 5 phút.

## 🚀 JavaScript thuần (Vanilla JS)

### 1. Cài đặt

```bash
npm install @agrid/browser
```

### 2. Sử dụng

```javascript
import posthog from '@agrid/browser'

// Khởi tạo
posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://your-agrid-instance.com'
})

// Capture event
posthog.capture('button_clicked', {
  button_name: 'Sign Up'
})

// Identify user
posthog.identify('user_123', {
  email: 'user@example.com'
})
```

## ⚛️ ReactJS

### 1. Cài đặt

```bash
npm install @agrid/react @agrid/browser
```

### 2. Setup Provider

```jsx
// App.jsx
import { AgridProvider } from '@agrid/react'
import { posthog } from './agrid'

function App() {
  return (
    <AgridProvider client={posthog}>
      <YourApp />
    </AgridProvider>
  )
}
```

### 3. Sử dụng Hooks

```jsx
import { usePostHog } from '@agrid/react'

function MyComponent() {
  const posthog = usePostHog()

  const handleClick = () => {
    posthog.capture('button_clicked')
  }

  return <button onClick={handleClick}>Click me</button>
}
```

## 📦 CDN (Không cần build)

```html
<script src="https://cdn.jsdelivr.net/npm/@agrid/browser/dist/index.js"></script>
<script>
  posthog.init('YOUR_API_KEY', {
    api_host: 'https://your-agrid-instance.com'
  })
</script>
```

Xem [Integration Guide](./INTEGRATION_GUIDE.md) để biết thêm chi tiết.

