<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('apiKeys.title') }}</h1>
        <p class="text-gray-600 mt-1">{{ t('apiKeys.description') }}</p>
      </div>
      <UButton
        icon="i-lucide-plus"
        :label="t('apiKeys.createNew')"
        @click="openCreateModal"
      />
    </div>

    <!-- Warning Alert -->
    <UAlert
      icon="i-lucide-shield-alert"
      color="yellow"
      variant="soft"
      :title="t('apiKeys.securityWarning')"
      :description="t('apiKeys.securityWarningDesc')"
      class="mb-6"
    />

    <!-- API Keys List -->
    <UCard>
      <UTable
        :loading="loading"
        :rows="apiKeys"
        :columns="columns"
        :empty-state="{ icon: 'i-lucide-key', label: t('apiKeys.noKeys') }"
      >
        <template #name-data="{ row }">
          <div class="font-medium">{{ row.name }}</div>
          <div class="text-xs text-gray-500">{{ row.keyPrefix }}***</div>
        </template>

        <template #permissions-data="{ row }">
          <div class="flex gap-1 flex-wrap">
            <UBadge v-for="perm in row.permissions" :key="perm" size="xs">
              {{ perm }}
            </UBadge>
          </div>
        </template>

        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'gray'">
            {{ row.isActive ? t('apiKeys.active') : t('apiKeys.inactive') }}
          </UBadge>
        </template>

        <template #lastUsedAt-data="{ row }">
          <span class="text-sm text-gray-600">
            {{ row.lastUsedAt ? formatDateTime(row.lastUsedAt) : t('apiKeys.neverUsed') }}
          </span>
        </template>

        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-600">
            {{ formatDateTime(row.createdAt) }}
          </span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-power"
              size="xs"
              :color="row.isActive ? 'red' : 'green'"
              variant="ghost"
              :title="row.isActive ? t('apiKeys.deactivate') : t('apiKeys.activate')"
              @click="toggleKeyStatus(row)"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="red"
              variant="ghost"
              :title="t('apiKeys.delete')"
              @click="confirmDelete(row)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Create API Key Modal -->
    <UModal v-model="isCreateModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-bold">{{ t('apiKeys.createNew') }}</h3>
        </template>

        <form @submit.prevent="createApiKey" class="space-y-4">
          <UFormGroup :label="t('apiKeys.name')" required>
            <UInput v-model="newKeyForm.name" :placeholder="t('apiKeys.namePlaceholder')" />
          </UFormGroup>

          <UFormGroup :label="t('apiKeys.permissions')" required>
            <div class="space-y-2">
              <UCheckbox
                v-for="perm in availablePermissions"
                :key="perm.value"
                v-model="newKeyForm.permissions"
                :value="perm.value"
                :label="perm.label"
              />
            </div>
          </UFormGroup>

          <UFormGroup :label="t('apiKeys.expiresAt')" :help="t('apiKeys.expiresAtHelp')">
            <UInput v-model="newKeyForm.expiresAt" type="datetime-local" />
          </UFormGroup>

          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="gray"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isCreateModalOpen = false"
            />
            <UButton
              type="submit"
              :loading="creating"
              :label="t('apiKeys.create')"
            />
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- API Key Created Success Modal -->
    <UModal v-model="isSuccessModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="text-green-600" />
            <h3 class="text-lg font-bold">{{ t('apiKeys.keyCreated') }}</h3>
          </div>
        </template>

        <div class="space-y-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="red"
            variant="soft"
            :title="t('apiKeys.saveKeyWarning')"
            :description="t('apiKeys.saveKeyWarningDesc')"
          />

          <div>
            <label class="text-sm font-medium text-gray-700">{{ t('apiKeys.yourApiKey') }}</label>
            <div class="mt-2 flex gap-2">
              <UInput
                v-model="createdKey"
                readonly
                class="flex-1 font-mono text-sm"
              />
              <UButton
                icon="i-lucide-copy"
                @click="copyApiKey"
              />
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-md">
            <h4 class="font-medium mb-2">{{ t('apiKeys.exampleUsage') }}</h4>
            <pre class="text-xs overflow-auto">curl -X POST {{ siteUrl }}/api/log/ingest \
  -H "X-API-Key: {{ createdKey }}" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "INFO",
    "message": "Application started",
    "metadata": {}
  }'</pre>
          </div>

          <div class="flex justify-end">
            <UButton
              :label="t('common.close')"
              @click="isSuccessModalOpen = false"
            />
          </div>
        </div>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="isDeleteModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-bold">{{ t('apiKeys.confirmDelete') }}</h3>
        </template>

        <p>{{ t('apiKeys.confirmDeleteDesc', { name: keyToDelete?.name }) }}</p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="ghost"
              :label="t('common.cancel')"
              @click="isDeleteModalOpen = false"
            />
            <UButton
              color="red"
              :loading="deleting"
              :label="t('common.delete')"
              @click="deleteApiKey"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const config = useRuntimeConfig()
const projectId = route.params.projectId as string
const siteUrl = config.public.appUrl || 'http://localhost:3000'

// State
const loading = ref(false)
const creating = ref(false)
const deleting = ref(false)
const apiKeys = ref<any[]>([])

const isCreateModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

const createdKey = ref('')
const keyToDelete = ref<any>(null)

const newKeyForm = ref({
  name: '',
  permissions: [] as string[],
  expiresAt: ''
})

// Options
const availablePermissions = [
  { value: 'log:write', label: t('apiKeys.permissions.logWrite') },
  { value: 'heartbeat:write', label: t('apiKeys.permissions.heartbeatWrite') },
  { value: 'deployment:write', label: t('apiKeys.permissions.deploymentWrite') },
  { value: 'monitor:read', label: t('apiKeys.permissions.monitorRead') },
  { value: 'monitor:write', label: t('apiKeys.permissions.monitorWrite') }
]

const columns = [
  { key: 'name', label: t('apiKeys.name') },
  { key: 'permissions', label: t('apiKeys.permissions') },
  { key: 'isActive', label: t('apiKeys.status') },
  { key: 'lastUsedAt', label: t('apiKeys.lastUsed') },
  { key: 'createdAt', label: t('apiKeys.created') },
  { key: 'actions', label: '' }
]

// Fetch API keys
async function fetchApiKeys() {
  loading.value = true
  try {
    const response = await $fetch(`/api/projects/${projectId}/api-keys`)
    if (response.success) {
      apiKeys.value = response.data
    }
  } catch (error) {
    console.error('Error fetching API keys:', error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newKeyForm.value = {
    name: '',
    permissions: [],
    expiresAt: ''
  }
  isCreateModalOpen.value = true
}

async function createApiKey() {
  if (!newKeyForm.value.name || newKeyForm.value.permissions.length === 0) {
    toast.add({
      title: t('common.error'),
      description: t('apiKeys.fillRequired'),
      color: 'red'
    })
    return
  }

  creating.value = true
  try {
    const payload: any = {
      name: newKeyForm.value.name,
      permissions: newKeyForm.value.permissions
    }

    if (newKeyForm.value.expiresAt) {
      payload.expiresAt = new Date(newKeyForm.value.expiresAt).toISOString()
    }

    const response = await $fetch(`/api/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: payload
    })

    if (response.success) {
      createdKey.value = response.data.key
      isCreateModalOpen.value = false
      isSuccessModalOpen.value = true
      fetchApiKeys()
    }
  } catch (error: any) {
    toast.add({
      title: t('common.error'),
      description: error.data?.message || t('apiKeys.createError'),
      color: 'red'
    })
  } finally {
    creating.value = false
  }
}

async function toggleKeyStatus(key: any) {
  try {
    const response = await $fetch(`/api/projects/${projectId}/api-keys/${key._id}`, {
      method: 'PATCH',
      body: { isActive: !key.isActive }
    })

    if (response.success) {
      toast.add({
        title: t('common.success'),
        description: t('apiKeys.statusUpdated'),
        color: 'green'
      })
      fetchApiKeys()
    }
  } catch (error) {
    toast.add({
      title: t('common.error'),
      description: t('apiKeys.updateError'),
      color: 'red'
    })
  }
}

function confirmDelete(key: any) {
  keyToDelete.value = key
  isDeleteModalOpen.value = true
}

async function deleteApiKey() {
  if (!keyToDelete.value) return

  deleting.value = true
  try {
    const response = await $fetch(`/api/projects/${projectId}/api-keys/${keyToDelete.value._id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      toast.add({
        title: t('common.success'),
        description: t('apiKeys.deleteSuccess'),
        color: 'green'
      })
      isDeleteModalOpen.value = false
      fetchApiKeys()
    }
  } catch (error) {
    toast.add({
      title: t('common.error'),
      description: t('apiKeys.deleteError'),
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

function copyApiKey() {
  navigator.clipboard.writeText(createdKey.value)
  toast.add({
    title: t('common.success'),
    description: t('apiKeys.keyCopied'),
    color: 'green'
  })
}

function formatDateTime(date: string | Date) {
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
}

// Initial fetch
onMounted(() => {
  fetchApiKeys()
})
</script>
