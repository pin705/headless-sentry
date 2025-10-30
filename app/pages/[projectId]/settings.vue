<template>
  <div class="project-settings-layout">
    <div v-if="pending">Đang tải...</div>
    <div v-else-if="project">
      <h1 class="text-2xl font-bold">Cài đặt cho: {{ project.name }}</h1>
      <p class="text-gray-500">Quản lý dự án của bạn tại đây.</p>
    </div>

    <div class="flex gap-8 mt-6">
      <aside class="w-1/4">
        <nav class="flex flex-col gap-2">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="px-4 py-2 rounded-md"
            active-class="bg-gray-100 font-bold"
          >
            {{ item.name }}
          </NuxtLink>
        </nav>
      </aside>

      <main class="w-3/4">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const projectId = computed(() => route.params.id)

// 1. Logic fetch thông tin project chung
// Dữ liệu này sẽ được chia sẻ cho tất cả các trang con
const { data: project, pending } = await useFetch(`/api/projects/${projectId.value}`, {
  // `useFetch` sẽ tự động lấy key duy nhất,
  // nhưng nếu bạn muốn chia sẻ data, hãy set key rõ ràng:
  key: `project-${projectId.value}`
})

// 2. Định nghĩa menu
const navigation = [
  { name: 'Thông tin chung', to: `/project/${projectId.value}/settings/general` },
  { name: 'Thành viên', to: `/project/${projectId.value}/settings/members` },
  { name: 'Khu vực nguy hiểm', to: `/project/${projectId.value}/settings/danger` },
]

// Nếu truy cập /project/[id]/settings (không có /general),
// tự động chuyển hướng đến tab đầu tiên
if (route.path.endsWith('/settings') || route.path.endsWith('/settings/')) {
  await navigateTo(navigation[0].to)
}
</script>

<style scoped>
/* CSS cho class .router-link-active (hoặc dùng active-class prop) */
.router-link-active {
  background-color: #f3f4f6; /* bg-gray-100 */
  font-weight: 600;
}
</style>
