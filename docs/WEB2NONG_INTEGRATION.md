# Hướng dẫn Tích hợp Agrid JS vào Web 2Nông

Tài liệu chi tiết về cách tích hợp Agrid JS vào ứng dụng Web 2Nông để tracking và analytics.

## 🎯 Mục tiêu

- Track user behavior trên Web 2Nông
- Phân tích usage patterns của nông dân
- A/B testing các tính năng mới
- Session recording để debug và cải thiện UX
- Feature flags để roll out tính năng từ từ

## 📦 Cài đặt

### Option 1: NPM (Khuyến nghị)

```bash
npm install @agrid/browser
```

### Option 2: CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@agrid/browser/dist/index.js"></script>
```

## 🚀 Tích hợp nhanh

### JavaScript thuần

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Web 2Nông</title>
</head>
<body>
    <script type="module">
        import posthog from '@agrid/browser'

        // Khởi tạo Agrid cho Web 2Nông
        posthog.init('2nong_project_api_key', {
            api_host: 'https://agrid.2nong.vn',
            capture_pageview: true,
            capture_pageleave: true,
            session_recording: {
                maskAllInputs: true,
                maskTextSelector: '.sensitive-data'
            },
            loaded: (posthog) => {
                console.log('✅ Agrid đã sẵn sàng cho Web 2Nông')
            }
        })

        // Expose để debug
        window.posthog = posthog
    </script>
</body>
</html>
```

### ReactJS

```jsx
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
    }
  })
}

export { posthog }
```

```jsx
// src/App.jsx
import { AgridProvider } from '@agrid/react'
import { posthog } from './agrid'

function App() {
  return (
    <AgridProvider client={posthog}>
      <Web2NongApp />
    </AgridProvider>
  )
}
```

## 📊 Tracking Events cho Web 2Nông

### 1. User Authentication

```javascript
// Đăng ký tài khoản
posthog.capture('farmer_registered', {
  registration_method: 'email', // email, phone, google, facebook
  farmer_type: 'individual', // individual, cooperative, enterprise
  location: {
    province: 'An Giang',
    district: 'Châu Phú'
  },
  referral_source: 'google_ads'
})

// Đăng nhập thành công
posthog.capture('farmer_logged_in', {
  login_method: 'email',
  user_id: 'farmer_123'
})

// Identify user
posthog.identify('farmer_123', {
  email: 'farmer@example.com',
  name: 'Nguyễn Văn A',
  phone: '+84901234567',
  farmer_type: 'individual',
  location: {
    province: 'An Giang',
    district: 'Châu Phú',
    commune: 'Xã A'
  },
  farm_count: 3,
  registration_date: '2024-01-15'
})
```

### 2. Farm Management

```javascript
// Tạo farm mới
posthog.capture('farm_created', {
  farm_id: 'farm_123',
  farm_name: 'Trang trại lúa An Giang',
  farm_type: 'rice', // rice, vegetable, fruit, livestock, etc.
  area: 5.5, // hecta
  location: {
    province: 'An Giang',
    district: 'Châu Phú',
    coordinates: [10.5, 105.2]
  },
  soil_type: 'alluvial', // alluvial, red, black, etc.
  irrigation_type: 'canal' // canal, pump, rain, etc.
})

// Cập nhật thông tin farm
posthog.capture('farm_updated', {
  farm_id: 'farm_123',
  updated_fields: ['area', 'location'],
  reason: 'land_expansion'
})

// Xóa farm
posthog.capture('farm_deleted', {
  farm_id: 'farm_123',
  reason: 'sold_land'
})
```

### 3. Crop Management

```javascript
// Tạo vụ mùa mới
posthog.capture('crop_created', {
  crop_id: 'crop_456',
  farm_id: 'farm_123',
  crop_type: 'rice',
  variety: 'IR64',
  season: 'winter-spring', // winter-spring, summer-autumn, etc.
  planting_date: '2024-01-15',
  expected_harvest_date: '2024-04-20',
  area: 2.5, // hecta
  planting_method: 'direct_seeding' // direct_seeding, transplanting
})

// Ghi nhận chăm sóc
posthog.capture('cultivation_activity', {
  crop_id: 'crop_456',
  activity_type: 'fertilizing', // fertilizing, watering, pest_control, weeding
  product_used: 'NPK 20-20-15',
  quantity: 50, // kg
  cost: 500000, // VND
  date: '2024-02-01'
})

// Thu hoạch
posthog.capture('harvest_completed', {
  crop_id: 'crop_456',
  farm_id: 'farm_123',
  harvest_date: '2024-04-18',
  yield: 6.5, // tấn/hecta
  total_yield: 16.25, // tấn
  quality_grade: 'A', // A, B, C
  price_per_kg: 8500, // VND
  total_revenue: 138125000, // VND
  moisture_content: 14, // %
  storage_method: 'warehouse' // warehouse, silo, etc.
})
```

### 4. Weather & Advisory

```javascript
// Xem dự báo thời tiết
posthog.capture('weather_forecast_viewed', {
  farm_id: 'farm_123',
  location: {
    province: 'An Giang',
    coordinates: [10.5, 105.2]
  },
  forecast_period: '7_days', // 3_days, 7_days, 15_days
  viewed_from: 'dashboard' // dashboard, farm_detail, mobile_app
})

// Nhận tư vấn nông nghiệp
posthog.capture('advisory_received', {
  advisory_type: 'pest_control', // pest_control, fertilization, irrigation, etc.
  crop_type: 'rice',
  crop_stage: 'tillering', // seedling, tillering, booting, heading, etc.
  source: 'ai_recommendation', // ai_recommendation, expert_advice, community
  action_taken: true,
  effectiveness_rating: 4 // 1-5
})
```

### 5. Marketplace & Transactions

```javascript
// Xem sản phẩm trên marketplace
posthog.capture('product_viewed', {
  product_id: 'prod_789',
  product_type: 'fertilizer', // fertilizer, seed, pesticide, equipment
  category: 'organic',
  price: 500000,
  seller_id: 'seller_123'
})

// Thêm vào giỏ hàng
posthog.capture('product_added_to_cart', {
  product_id: 'prod_789',
  quantity: 2,
  total_price: 1000000
})

// Hoàn thành đơn hàng
posthog.capture('order_completed', {
  order_id: 'order_101',
  total_amount: 2500000,
  payment_method: 'bank_transfer',
  delivery_method: 'home_delivery',
  items: [
    { product_id: 'prod_789', quantity: 2, price: 1000000 },
    { product_id: 'prod_790', quantity: 1, price: 1500000 }
  ]
})
```

### 6. Learning & Community

```javascript
// Xem bài viết/tutorial
posthog.capture('content_viewed', {
  content_id: 'article_123',
  content_type: 'article', // article, video, tutorial
  category: 'rice_cultivation',
  reading_time: 300, // seconds
  completion_rate: 0.85 // 0-1
})

// Tham gia forum
posthog.capture('forum_post_created', {
  post_id: 'post_456',
  topic: 'pest_control',
  has_images: true,
  word_count: 150
})

// Đánh giá ứng dụng
posthog.capture('app_rated', {
  rating: 5, // 1-5
  feedback: 'Rất hữu ích cho nông dân',
  version: '2.0.0'
})
```

## 🎨 Feature Flags cho Web 2Nông

### Sử dụng Feature Flags

```javascript
// Kiểm tra tính năng mới
const showNewDashboard = posthog.isFeatureEnabled('new-dashboard-v2')
if (showNewDashboard) {
  renderNewDashboard()
} else {
  renderOldDashboard()
}

// A/B testing pricing
const pricingTier = posthog.getFeatureFlag('pricing-tier')
if (pricingTier === 'premium') {
  showPremiumFeatures()
}
```

### Ví dụ Feature Flags cho Web 2Nông

```javascript
// Feature: AI Advisory
const aiAdvisoryEnabled = posthog.isFeatureEnabled('ai-advisory-v2')
if (aiAdvisoryEnabled) {
  enableAIPoweredAdvisory()
}

// Feature: New Farm Management UI
const newFarmUI = posthog.isFeatureEnabled('new-farm-management-ui')
if (newFarmUI) {
  renderNewFarmManagementInterface()
}

// Feature: Marketplace Integration
const marketplaceEnabled = posthog.isFeatureEnabled('marketplace-integration')
if (marketplaceEnabled) {
  showMarketplaceTab()
}
```

## 🔒 Bảo mật và Privacy

### Masking thông tin nhạy cảm

```javascript
posthog.init('YOUR_API_KEY', {
  api_host: 'https://agrid.2nong.vn',
  session_recording: {
    maskAllInputs: true, // Ẩn tất cả input fields
    maskTextSelector: '.sensitive-data, .password, .credit-card',
    blockSelector: '.no-record', // Không record các element này
    ignoreClass: 'ph-ignore'
  }
})
```

### Opt-out

```javascript
// Cho phép user opt-out
posthog.opt_out_capturing()

// Opt-in lại
posthog.opt_in_capturing()
```

## 📈 Dashboard và Analytics

Sau khi tích hợp, bạn có thể xem analytics tại:
- Dashboard: `https://agrid.2nong.vn/project/YOUR_PROJECT_ID`
- Events: Xem tất cả events đã capture
- Funnels: Phân tích conversion funnel
- Retention: Phân tích user retention
- Feature Flags: Quản lý feature flags

## 🧪 Testing

### Development Mode

```javascript
if (process.env.NODE_ENV === 'development') {
  posthog.debug() // Bật debug mode
  posthog.capture('test_event', { test: true })
}
```

### Staging Environment

```javascript
const isProduction = process.env.NODE_ENV === 'production'
posthog.init('YOUR_API_KEY', {
  api_host: 'https://agrid.2nong.vn',
  debug: !isProduction,
  loaded: (posthog) => {
    if (!isProduction) {
      console.log('Agrid initialized in', process.env.NODE_ENV, 'mode')
    }
  }
})
```

## 📝 Checklist tích hợp

- [ ] Cài đặt package `@agrid/browser` hoặc `@agrid/react`
- [ ] Khởi tạo Agrid với API key và host
- [ ] Identify user sau khi đăng nhập
- [ ] Capture các events quan trọng (farm_created, harvest_completed, etc.)
- [ ] Setup session recording với masking phù hợp
- [ ] Sử dụng feature flags cho A/B testing
- [ ] Test trong development environment
- [ ] Deploy và monitor trong production

## 🔗 Tài liệu tham khảo

- [Agrid JS Documentation](../README.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [API Reference](../packages/browser/README.md)

## 💬 Hỗ trợ

Nếu cần hỗ trợ tích hợp:
- Email: team@agridhub.vn
- GitHub Issues: https://github.com/BTuyen/agrid-js/issues

