# Dashboard Components Documentation

This document describes the reusable dashboard components created for the Headless Sentry UI/UX improvements.

## StatsCard

A flexible card component for displaying statistical metrics with different visual variants.

### Props

- `label` (string, required): The label/title of the metric
- `value` (string | number, required): The main value to display
- `unit` (string, optional): Unit text (e.g., "ms", "dịch vụ")
- `subtitle` (string, optional): Additional subtitle text
- `description` (string, optional): Descriptive text below the value
- `icon` (string, optional): Lucide icon name
- `variant` ('default' | 'success' | 'warning' | 'error' | 'info', default: 'default'): Color variant

### Example Usage

```vue
<StatsCard
  label="Tổng số"
  :value="totalMonitors"
  unit="dịch vụ"
  icon="i-lucide-server"
  variant="default"
/>

<StatsCard
  label="Đang Hoạt động"
  :value="totalUp"
  icon="i-lucide-check-circle"
  variant="success"
/>
```

## MonitorCard

A card component for displaying monitor information with status, metrics, and SSL indicators.

### Props

- `monitor` (Monitor, required): Monitor object with:
  - `_id`: Monitor ID
  - `name`: Monitor name
  - `endpoint`: API endpoint URL
  - `status`: 'up' or 'down'
  - `isPaused`: Boolean
  - `sslExpiry`: Date (optional)
  - `updatedAt`: Date
  - `stats.uptime24h`: Number (optional)
  - `stats.avgLatency`: Number (optional)
- `projectId` (string, required): Project ID for navigation

### Slots

- `actions`: Slot for action buttons (e.g., dropdown menu)

### Example Usage

```vue
<MonitorCard
  :monitor="monitor"
  :project-id="projectId"
>
  <template #actions>
    <UDropdownMenu :items="actionItems">
      <UButton icon="i-lucide-more-vertical" />
    </UDropdownMenu>
  </template>
</MonitorCard>
```

## AlertTable

A table component for displaying alerts or errors with custom columns.

### Props

- `data` (Array, required): Array of alert/error objects
- `columns` (Array, required): Column definitions with accessorKey, header, cell
- `title` (string, optional, default: 'Alerts'): Table title
- `emptyMessage` (string, optional, default: 'No alerts found'): Empty state message
- `emptyIcon` (string, optional, default: 'i-lucide-bell-off'): Empty state icon

### Slots

- `actions`: Slot for header action buttons

### Example Usage

```vue
<AlertTable
  :data="recentErrors"
  :columns="errorColumns"
  title="Lỗi Gần Đây (24 Giờ)"
  empty-message="Không có lỗi nào gần đây"
  empty-icon="i-lucide-check-circle"
/>
```

## LatencyChart

A line chart component for displaying latency trends over time.

### Props

- `data` (Array, required): Array of data points with `hour` and `avgLatency`
- `title` (string, optional, default: 'Latency Chart'): Chart title
- `emptyMessage` (string, optional, default: 'No data available'): Empty state message
- `curveType` (string, optional, default: 'basis'): Line curve type

### Slots

- `actions`: Slot for header action buttons

### Example Usage

```vue
<LatencyChart
  :data="latencyChartData"
  title="Độ trễ trung bình (24 Giờ qua)"
  empty-message="Không đủ dữ liệu để vẽ biểu đồ"
/>
```

## SSLStatusCard

A card component for displaying SSL certificate status and expiry information.

### Props

- `expiryDate` (Date | string | null, optional): SSL certificate expiry date
- `checkEnabled` (boolean, optional, default: true): Whether SSL checking is enabled

### Example Usage

```vue
<SSLStatusCard
  :expiry-date="sslExpiryDate"
  :check-enabled="true"
/>
```

## OverviewHeader

A header component for dashboard sections with title, description, and action slots.

### Props

- `title` (string, required): Section title
- `description` (string, optional): Section description

### Slots

- `actions`: Slot for header action buttons

### Example Usage

```vue
<OverviewHeader
  title="Tổng quan"
  description="Xem thống kê tổng quan về các dịch vụ giám sát"
>
  <template #actions>
    <UButton label="Refresh" icon="i-lucide-refresh-cw" />
  </template>
</OverviewHeader>
```

## Design Principles

### Spacing
- Card body padding: `p-5` (20px)
- Page content padding: `p-6` (24px)
- Gap between elements: `gap-4` (16px)
- Border radius: `rounded-xl` (12px)

### Colors
- **Success**: Green (`success-500/600`)
- **Warning**: Yellow (`warning-500/600`)
- **Error**: Red (`error-500/600`)
- **Info**: Blue (`blue-500/600`)
- **Neutral**: Gray (`gray-400/500/600`)

### Icons
All icons use the Lucide icon set:
- Navigation: `i-lucide-layout-dashboard`, `i-lucide-activity`, `i-lucide-settings`
- Actions: `i-lucide-plus`, `i-lucide-refresh-cw`, `i-lucide-more-vertical`
- Status: `i-lucide-check-circle`, `i-lucide-alert-triangle`, `i-lucide-shield-check`
- Misc: `i-lucide-server`, `i-lucide-globe`, `i-lucide-calendar`

### Hover States
- Cards: Add ring transition on hover (`hover:ring-gray-300`)
- Links: Color transition to primary (`hover:text-primary-600`)
- Buttons: Built-in Nuxt UI hover states

### Responsive Grid
- Mobile: 1 column (`grid-cols-1`)
- Tablet: 2 columns (`sm:grid-cols-2`)
- Desktop: 3-4 columns (`lg:grid-cols-3` or `lg:grid-cols-4`)

## Integration Guide

### 1. Import Components

Components are auto-imported by Nuxt, so just use them directly:

```vue
<template>
  <StatsCard :value="10" label="Total" />
</template>
```

### 2. Using with Existing Data

The components are designed to work with existing API responses:

```vue
<script setup>
const { data } = await useFetch('/api/dashboard')
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatsCard
      label="Total Monitors"
      :value="data.totalMonitors"
      icon="i-lucide-server"
    />
  </div>
</template>
```

### 3. Customizing Styles

Use Nuxt UI's `ui` prop to override styles:

```vue
<UCard
  :ui="{
    body: { padding: 'p-6' },
    ring: 'ring-2 ring-primary-500'
  }"
>
  <!-- content -->
</UCard>
```

## Best Practices

1. **Consistent Spacing**: Use the predefined spacing values (p-5, p-6, gap-4)
2. **Semantic Colors**: Use variant props to convey meaning (success/warning/error)
3. **Loading States**: Always provide loading skeletons for better UX
4. **Empty States**: Use descriptive messages and icons for empty states
5. **Responsive Design**: Test layouts on different screen sizes
6. **Icon Consistency**: Stick to Lucide icons throughout the app
7. **Accessibility**: Use semantic HTML and ARIA labels where needed

## Examples

See the following pages for real-world usage examples:
- `/app/pages/[projectId]/index.vue` - Dashboard overview with stats cards and charts
- `/app/pages/[projectId]/monitoring/index.vue` - Monitor cards with actions
- `/app/pages/index.vue` - Project cards with empty states
