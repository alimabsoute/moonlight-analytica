# Analytics & Conversion Tracking Setup Guide

## 🔥 CRITICAL: Replace Placeholder IDs Before Going Live

### Required Analytics Account Setup

#### 1. Google Analytics 4 Setup
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for "Moonlight Analytica"
3. Get your **Measurement ID** (format: G-XXXXXXXXXX)
4. Replace `GA_MEASUREMENT_ID` in all HTML files with your actual ID

#### 2. Google Ads Conversion Tracking (Optional)
1. Go to [Google Ads](https://ads.google.com/)
2. Navigate to Tools & Settings > Conversions
3. Create conversion actions for:
   - Email signups (value: $5)
   - Contact form submissions (value: $25)
   - Product page visits (value: $1)
4. Replace `AW-CONVERSION_ID/CONVERSION_LABEL` with actual values

#### 3. Microsoft Clarity (Optional but Recommended)
1. Go to [Microsoft Clarity](https://clarity.microsoft.com/)
2. Create a new project for "Moonlight Analytica"
3. Get your **Project ID** 
4. Replace `CLARITY_PROJECT_ID` with actual ID

## 📊 Analytics Implementation Status

### ✅ Implemented Features

#### Homepage (moonlight-complete-structure.html)
- **Google Analytics 4** with custom parameters
- **Microsoft Clarity** for user session recordings
- **Core Web Vitals** tracking (LCP, FID, CLS)
- **Custom analytics wrapper** (MoonlightAnalytics)
- **Conversion tracking** for email signups and CTA clicks
- **Engagement tracking**: scroll depth, time on page, exit intent
- **Navigation tracking** for all menu items
- **Device/browser info** collection

#### Contact Form (contact.html)
- **Form submission tracking** with validation states
- **Error tracking** for failed submissions
- **Success conversion** tracking
- **Form field interaction** tracking

### 🚧 Tracking Events Implemented

| Event | Category | Description | Value |
|-------|----------|-------------|-------|
| `email_signup` | conversion | Hero email capture | 1 |
| `cta_click` | engagement | Primary CTA clicks | 1 |
| `beta_request` | engagement | Janus Beta requests | 1 |
| `navigation_click` | navigation | Menu navigation | 1 |
| `scroll_depth` | engagement | 25%, 50%, 75%, 100% | milestone % |
| `time_engagement` | engagement | 30+ seconds on page | 30 |
| `exit_intent` | engagement | Mouse leave detection | time spent |
| `contact_form_submit` | conversion | Contact form success | 1 |
| `web_vitals` | performance | Core Web Vitals | metric value |
| `device_info` | technical | Browser/device data | 1 |

## 🎯 Conversion Funnel Tracking

### Lead Generation Funnel
1. **Homepage Visit** → tracked automatically
2. **Email Signup** → `email_signup` event
3. **Product Interest** → `cta_click` event
4. **Contact Form** → `contact_form_submit` event

### Product Funnel
1. **Solutions Page Visit** → tracked automatically
2. **Product Card Click** → tracked via navigation
3. **External Link Click** → tracked automatically
4. **Demo Request** → tracked via form

## 📈 Key Performance Indicators (KPIs)

### Primary Metrics
- **Email Signup Rate**: % of visitors who subscribe
- **Contact Form Conversion**: % of visitors who contact
- **Page Engagement**: Average time on page
- **Bounce Rate**: % single-page sessions
- **Core Web Vitals**: Performance scores

### Secondary Metrics
- **Scroll Depth**: How far users scroll
- **CTA Click Rate**: Primary button engagement
- **Navigation Patterns**: Most popular pages
- **Device Distribution**: Mobile vs desktop usage
- **Exit Intent**: When users consider leaving

## 🛠 Advanced Analytics Features

### Custom Dimensions Available
- `product_interest`: Which product user is interested in
- `user_segment`: lead, interested, early_adopter
- `form_source`: Which form/page generated the conversion
- `traffic_source`: How user arrived at the site

### Performance Monitoring
- **Core Web Vitals**: Automatic LCP, FID, CLS tracking
- **Custom Performance**: Load time, rendering metrics
- **Error Tracking**: JavaScript errors and API failures
- **Uptime Monitoring**: Page availability tracking

## 📱 Mobile Analytics Optimization

### Mobile-Specific Tracking
- **Touch interactions**: Tap vs click differentiation
- **Viewport size**: Screen size analytics
- **Device orientation**: Portrait vs landscape
- **Mobile performance**: Specific mobile Core Web Vitals

### Mobile Conversion Optimization
- **Form completion rates** on mobile
- **Touch-friendly element** interaction rates
- **Mobile navigation** usage patterns
- **Scroll behavior** on mobile devices

## 🚀 Implementation Steps

### Step 1: Replace Placeholder IDs
```javascript
// In all HTML files, replace:
GA_MEASUREMENT_ID → Your actual Google Analytics ID
CLARITY_PROJECT_ID → Your actual Microsoft Clarity ID
AW-CONVERSION_ID/CONVERSION_LABEL → Your Google Ads conversion IDs
```

### Step 2: Test Analytics Setup
1. Open browser developer tools
2. Visit the website
3. Check console for analytics events
4. Verify events appear in Google Analytics Real-Time

### Step 3: Set Up Goals and Conversions
In Google Analytics:
1. Go to Admin > Goals (for Universal Analytics)
2. Or Configure > Conversions (for GA4)
3. Set up goals for email signups, contact forms, etc.

### Step 4: Create Custom Dashboards
1. **Executive Dashboard**: High-level KPIs
2. **Marketing Dashboard**: Conversion funnels
3. **Technical Dashboard**: Performance metrics
4. **Product Dashboard**: Feature usage

## 📋 Testing Checklist

Before going live:
- [ ] Replace all placeholder IDs with real ones
- [ ] Test email signup tracking
- [ ] Test contact form tracking
- [ ] Test navigation click tracking
- [ ] Test Core Web Vitals reporting
- [ ] Verify mobile analytics work
- [ ] Test conversion goal setup
- [ ] Validate real-time data appears

## 🔧 Troubleshooting

### Common Issues
1. **Events not showing**: Check placeholder IDs are replaced
2. **Mobile tracking fails**: Verify touch event handlers
3. **Performance data missing**: Check browser compatibility
4. **Conversion goals not firing**: Verify conversion setup

### Debug Mode
Add `?debug=true` to URL to enable console logging:
```javascript
// Events will log to console for debugging
console.log('Analytics Event:', event, properties);
```

## 📞 Support Resources

### Documentation Links
- [Google Analytics 4 Setup](https://support.google.com/analytics/answer/9304153)
- [Microsoft Clarity Setup](https://docs.microsoft.com/en-us/clarity/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Google Ads Conversion Tracking](https://support.google.com/google-ads/answer/1722054)

### Analytics Tools
- **Google Tag Assistant**: Verify tracking setup
- **Microsoft Clarity Recordings**: Watch user sessions
- **PageSpeed Insights**: Test Core Web Vitals
- **Google Analytics Debugger**: Chrome extension

---

**Next Steps**: Replace placeholder IDs and test all tracking events before launching the website.