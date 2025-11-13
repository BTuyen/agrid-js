# Hướng dẫn Tích hợp Agrid JS

Tài liệu này hướng dẫn cách tích hợp Agrid JS vào các ứng dụng web (JavaScript thuần và ReactJS).

## 📦 Cài đặt

### JavaScript thuần (Vanilla JS)

```bash
npm install @agrid/browser
# hoặc
yarn add @agrid/browser
# hoặc
pnpm add @agrid/browser
```

### ReactJS

```bash
npm install @agrid/react
# hoặc
yarn add @agrid/react
# hoặc
pnpm add @agrid/react
```

## 🚀 Tích hợp cho JavaScript thuần

### Bước 1: Import và khởi tạo

```javascript
import posthog from '@agrid/browser'

// Khởi tạo Agrid
posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://your-agrid-instance.com', // URL của Agrid instance
  // Các tùy chọn khác
  capture_pageview: true, // Tự động capture pageview
  capture_pageleave: true, // Tự động capture khi user rời trang
  loaded: (posthog) => {
    // Callback khi Agrid đã load xong
    console.log('Agrid đã sẵn sàng!')
  }
})
```

### Bước 2: Capture Events

```javascript
// Capture event đơn giản
posthog.capture('button_clicked', {
  button_name: 'Sign Up',
  page: 'homepage'
})

// Capture event với user properties
posthog.capture('purchase_completed', {
  amount: 99.99,
  currency: 'USD',
  product_id: 'prod_123'
})

// Identify user
posthog.identify('user_123', {
  email: 'user@example.com',
  name: 'John Doe'
})
```

### Bước 3: Feature Flags

```javascript
// Kiểm tra feature flag
const isFeatureEnabled = posthog.isFeatureEnabled('new-feature')

if (isFeatureEnabled) {
  // Hiển thị feature mới
  showNewFeature()
}

// Lấy giá trị feature flag
const flagValue = posthog.getFeatureFlag('pricing-tier')
console.log('Pricing tier:', flagValue)
```

### Ví dụ hoàn chỉnh cho Web 2Nông

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Web 2Nông - Nông nghiệp thông minh</title>
</head>
<body>
    <h1>Chào mừng đến với Web 2Nông</h1>
    <button id="signup-btn">Đăng ký</button>
    <button id="login-btn">Đăng nhập</button>

    <script type="module">
        import posthog from '@agrid/browser'

        // Khởi tạo Agrid với API key của Web 2Nông
        posthog.init('2nong_project_key', {
            api_host: 'https://agrid.2nong.vn', // URL Agrid instance của Web 2Nông
            capture_pageview: true,
            capture_pageleave: true,
            session_recording: {
                maskAllInputs: true, // Ẩn thông tin nhạy cảm
                maskTextSelector: '.sensitive-data' // Ẩn các element có class này
            },
            loaded: (posthog) => {
                console.log('Agrid đã sẵn sàng cho Web 2Nông')
            }
        })

        // Capture event khi user đăng ký
        document.getElementById('signup-btn').addEventListener('click', () => {
            posthog.capture('user_signup_clicked', {
                source: 'homepage',
                timestamp: new Date().toISOString()
            })
        })

        // Capture event khi user đăng nhập
        document.getElementById('login-btn').addEventListener('click', () => {
            posthog.capture('user_login_clicked', {
                source: 'homepage'
            })
        })

        // Identify user sau khi đăng nhập thành công
        function onLoginSuccess(userId, userEmail, userName) {
            posthog.identify(userId, {
                email: userEmail,
                name: userName,
                platform: 'web2nong'
            })
        }

        // Sử dụng feature flags để A/B testing
        const showNewDashboard = posthog.isFeatureEnabled('new-dashboard-v2')
        if (showNewDashboard) {
            // Hiển thị dashboard mới
            console.log('Hiển thị dashboard mới')
        }
    </script>
</body>
</html>
```

## ⚛️ Tích hợp cho ReactJS

### Bước 1: Setup Provider

```jsx
// src/App.jsx hoặc src/main.jsx
import React from 'react'
import { AgridProvider } from '@agrid/react'
import { posthog } from './agrid'

function App() {
  return (
    <AgridProvider client={posthog}>
      <YourApp />
    </AgridProvider>
  )
}

export default App
```

### Bước 2: Tạo Agrid Client

```javascript
// src/agrid.js
import posthog from '@agrid/browser'

if (typeof window !== 'undefined') {
  posthog.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://your-agrid-instance.com',
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug() // Bật debug mode trong development
      }
    }
  })
}

export { posthog }
```

### Bước 3: Sử dụng Hooks

```jsx
// src/components/ProductCard.jsx
import { usePostHog } from '@agrid/react'

function ProductCard({ product }) {
  const posthog = usePostHog()

  const handleAddToCart = () => {
    posthog.capture('product_added_to_cart', {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      category: product.category
    })
  }

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>Thêm vào giỏ</button>
    </div>
  )
}
```

### Bước 4: Feature Flags trong React

```jsx
// src/components/Dashboard.jsx
import { useFeatureFlag } from '@agrid/react'

function Dashboard() {
  const showNewFeature = useFeatureFlag('new-dashboard-v2')

  return (
    <div>
      {showNewFeature ? (
        <NewDashboard />
      ) : (
        <OldDashboard />
      )}
    </div>
  )
}
```

### Ví dụ hoàn chỉnh cho Web 2Nông (React)

```jsx
// src/App.jsx
import React, { useEffect } from 'react'
import { AgridProvider, usePostHog, useFeatureFlag } from '@agrid/react'
import { posthog } from './agrid'

// Component sử dụng Agrid
function Web2NongApp() {
  const posthog = usePostHog()
  const showNewFarmManagement = useFeatureFlag('new-farm-management')

  useEffect(() => {
    // Capture pageview khi component mount
    posthog.capture('page_viewed', {
      page: 'dashboard',
      platform: 'web2nong'
    })
  }, [posthog])

  const handleFarmCreate = () => {
    posthog.capture('farm_created', {
      farm_type: 'organic',
      location: 'Vietnam'
    })
  }

  return (
    <div>
      <h1>Web 2Nông Dashboard</h1>
      {showNewFarmManagement ? (
        <NewFarmManagement onCreate={handleFarmCreate} />
      ) : (
        <OldFarmManagement onCreate={handleFarmCreate} />
      )}
    </div>
  )
}

// App chính
function App() {
  return (
    <AgridProvider client={posthog}>
      <Web2NongApp />
    </AgridProvider>
  )
}

export default App
```

```javascript
// src/agrid.js
import posthog from '@agrid/browser'

if (typeof window !== 'undefined') {
  posthog.init(process.env.REACT_APP_AGRID_API_KEY, {
    api_host: process.env.REACT_APP_AGRID_HOST || 'https://agrid.2nong.vn',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '.sensitive-data'
    },
    loaded: (posthog) => {
      console.log('Agrid đã sẵn sàng cho Web 2Nông')
    }
  })
}

export { posthog }
```

## 📊 Các Events quan trọng cho Web 2Nông

### Events nông nghiệp

```javascript
// User đăng ký tài khoản
posthog.capture('farmer_registered', {
  farmer_type: 'individual', // hoặc 'cooperative'
  location: 'Mekong Delta',
  farm_size: 'small' // small, medium, large
})

// Tạo farm mới
posthog.capture('farm_created', {
  farm_id: 'farm_123',
  farm_type: 'rice', // rice, vegetable, fruit, etc.
  area: 5.5, // hecta
  location: {
    province: 'An Giang',
    district: 'Châu Phú',
    coordinates: [10.5, 105.2]
  }
})

// Ghi nhận canh tác
posthog.capture('cultivation_recorded', {
  farm_id: 'farm_123',
  crop_type: 'rice',
  variety: 'IR64',
  planting_date: '2024-01-15',
  area: 2.5
})

// Thu hoạch
posthog.capture('harvest_completed', {
  farm_id: 'farm_123',
  crop_id: 'crop_456',
  yield: 6.5, // tấn/hecta
  quality: 'A',
  price: 8500 // VND/kg
})

// Sử dụng tính năng thông minh
posthog.capture('smart_feature_used', {
  feature_name: 'weather_forecast',
  farm_id: 'farm_123',
  action: 'viewed_forecast'
})
```

## 🔧 Cấu hình nâng cao

### Session Recording

```javascript
posthog.init('YOUR_API_KEY', {
  api_host: 'https://your-agrid-instance.com',
  session_recording: {
    recordCrossOriginIframes: true,
    maskAllInputs: true, // Ẩn tất cả input fields
    maskTextSelector: '.sensitive', // Ẩn các element có class này
    blockSelector: '.no-record', // Không record các element này
    ignoreClass: 'ph-ignore' // Bỏ qua các element có class này
  }
})
```

### Autocapture

```javascript
posthog.init('YOUR_API_KEY', {
  api_host: 'https://your-agrid-instance.com',
  autocapture: true, // Tự động capture clicks, form submissions
  capture_forms: true, // Capture form submissions
  capture_clicks: true // Capture button clicks
})
```

### Error Tracking

```javascript
// Tự động capture JavaScript errors
posthog.init('YOUR_API_KEY', {
  api_host: 'https://your-agrid-instance.com',
  capture_exceptions: true
})

// Capture error thủ công
try {
  // Code có thể lỗi
} catch (error) {
  posthog.capture('$exception', {
    $exception_message: error.message,
    $exception_type: error.name,
    $exception_stack: error.stack
  })
}
```

## 🌐 Tích hợp với Next.js

```javascript
// lib/agrid.js
import posthog from '@agrid/browser'

export function initAgrid() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_AGRID_API_KEY, {
      api_host: process.env.NEXT_PUBLIC_AGRID_HOST,
      capture_pageview: false // Tắt auto capture vì Next.js tự handle
    })
  }
  return posthog
}

export { posthog }
```

```jsx
// app/layout.jsx hoặc pages/_app.jsx
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { posthog } from '@/lib/agrid'

export function AgridPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url
      })
    }
  }, [pathname, searchParams])

  return null
}
```

## 📝 Best Practices

1. **Luôn identify user sau khi đăng nhập**
   ```javascript
   posthog.identify(userId, {
     email: userEmail,
     name: userName
   })
   ```

2. **Sử dụng consistent event names**
   ```javascript
   // ✅ Tốt
   posthog.capture('farm_created')
   posthog.capture('harvest_completed')

   // ❌ Không tốt
   posthog.capture('createFarm')
   posthog.capture('HarvestDone')
   ```

3. **Thêm context vào events**
   ```javascript
   posthog.capture('button_clicked', {
     button_name: 'Sign Up',
     page: 'homepage',
     user_type: 'farmer',
     timestamp: new Date().toISOString()
   })
   ```

4. **Sử dụng feature flags cho A/B testing**
   ```javascript
   const showNewUI = posthog.isFeatureFlagEnabled('new-ui-v2')
   ```

5. **Bảo vệ thông tin nhạy cảm**
   ```javascript
   // Sử dụng session recording masking
   session_recording: {
     maskAllInputs: true,
     maskTextSelector: '.password, .credit-card'
   }
   ```

## 🔗 Tài liệu tham khảo

- [Agrid JS Documentation](https://agridhub.vn/docs/agrid-js)
- [React SDK Documentation](https://agrid.dev/docs/libraries/react)
- [API Reference](./packages/browser/README.md)

## 💡 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
- Mở issue trên [GitHub](https://github.com/BTuyen/agrid-js/issues)
- Xem [FAQ](./FAQ.md)
- Liên hệ team: team@agridhub.vn

