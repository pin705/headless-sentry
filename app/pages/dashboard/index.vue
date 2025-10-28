<template>
  <div class="p-4 sm:p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">API Giám sát</h1>
      <UButton to="/dashboard/new" icon="i-heroicons-plus-solid" label="Thêm mới" />
    </div>

    <UCard>
      <UTable
        :data="monitors"
        :columns="columns"
        :loading="pending"
        :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Chưa có API nào được giám sát.' }"
      >
        <template #name-data="{ row }">
          <span class="font-medium">{{ row.name }}</span>
        </template>

        <template #endpoint-data="{ row }">
          <span class="text-gray-500 dark:text-gray-400 text-sm">{{ row.endpoint }}</span>
        </template>

        <template #status-data="{ row }">
          <UBadge :label="row.status" :color="row.status === 'ACTIVE' ? 'primary' : 'gray'" variant="soft" />
        </template>

        <template #frequency-data="{ row }">
          <span>{{ row.frequency }} giây</span>
        </template>

         <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatTimeAgo(new Date(row.createdAt)) }}</span>
        </template>

        <template #actions-data="{ row }">
           <UDropdown :items="items(row)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const columns = [
  { accessorKey: 'name', header: 'Tên' },
  { accessorKey: 'endpoint', header: 'Endpoint' },
  { accessorKey: 'status', header: 'Trạng thái' },
  { accessorKey: 'frequency', header: 'Tần suất' },
  // { key: 'avgLatency', label: 'Độ trễ TB' }, // Cần lấy từ results
  { accessorKey: 'createdAt', header: 'Tạo lúc' },
  { accessorKey: 'actions', header: '' }
]

// Hàm tạo items cho dropdown actions
const items = (row: any) => [
  [{
    label: 'Sửa',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => console.log('Edit', row.id) // TODO: Implement Edit
  }, {
    label: row.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt',
    icon: row.status === 'ACTIVE' ? 'i-heroicons-pause-circle-20-solid' : 'i-heroicons-play-circle-20-solid',
    click: () => console.log('Toggle Status', row.id) // TODO: Implement Toggle Status
  }],
  [{
    label: 'Xóa',
    icon: 'i-heroicons-trash-20-solid',
    click: () => console.log('Delete', row.id) // TODO: Implement Delete
  }]
]

// Gọi API /server/api/monitors để lấy data
const { data: monitors, pending, error, refresh } = await useFetch('/api/monitors', {
  lazy: true, // Không block page load
  default: () => [] // Giá trị mặc định khi đang tải
})

if (error.value) {
  console.error("Lỗi tải monitors:", error.value);
  // Có thể dùng useToast để báo lỗi
}
</script>
