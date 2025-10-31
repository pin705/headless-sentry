<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Bảng Giá Gói Dịch Vụ
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Chọn gói phù hợp với nhu cầu giám sát của bạn. Nâng cấp hoặc hạ cấp bất cứ lúc nào.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <!-- Free Plan -->
        <UCard
          :ui="{
            body: { padding: 'p-8' },
            ring: 'ring-2 ring-gray-200 dark:ring-gray-800'
          }"
        >
          <div class="space-y-6">
            <!-- Plan Header -->
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ PLAN_FEATURES.free.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ PLAN_FEATURES.free.description }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">
                {{ PLAN_FEATURES.free.price }}
              </span>
              <span class="text-gray-600 dark:text-gray-400">
                {{ PLAN_FEATURES.free.priceDescription }}
              </span>
            </div>

            <!-- CTA Button -->
            <UButton
              v-if="currentPlan === 'free'"
              :label="PLAN_FEATURES.free.cta.label"
              block
              size="lg"
              color="neutral"
              variant="outline"
              disabled
            />
            <UButton
              v-else
              label="Hạ cấp xuống Free"
              block
              size="lg"
              color="neutral"
              variant="outline"
              @click="changePlan('free')"
            />

            <!-- Features List -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-800">
              <ul class="space-y-3">
                <li
                  v-for="(feature, idx) in PLAN_FEATURES.free.features"
                  :key="idx"
                  class="flex items-start gap-3"
                >
                  <UIcon
                    :name="feature.available ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                    :class="[
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      feature.available
                        ? 'text-green-500'
                        : 'text-gray-400 dark:text-gray-600'
                    ]"
                  />
                  <span
                    :class="[
                      'text-sm',
                      feature.available
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-500 line-through'
                    ]"
                  >
                    {{ feature.text }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </UCard>

        <!-- Pro Plan -->
        <UCard
          :ui="{
            body: { padding: 'p-8' },
            ring: 'ring-2 ring-primary-500 dark:ring-primary-400'
          }"
        >
          <div class="space-y-6">
            <!-- Popular Badge -->
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ PLAN_FEATURES.pro.name }}
              </h3>
              <UBadge
                label="Phổ biến"
                color="primary"
                size="sm"
              />
            </div>

            <!-- Plan Description -->
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ PLAN_FEATURES.pro.description }}
            </p>

            <!-- Price -->
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">
                {{ PLAN_FEATURES.pro.price }}
              </span>
              <span class="text-gray-600 dark:text-gray-400">
                {{ PLAN_FEATURES.pro.priceDescription }}
              </span>
            </div>

            <!-- CTA Button -->
            <UButton
              v-if="currentPlan === 'pro'"
              label="Gói hiện tại"
              block
              size="lg"
              color="primary"
              disabled
            />
            <UButton
              v-else
              :label="PLAN_FEATURES.pro.cta.label"
              block
              size="lg"
              color="primary"
              @click="upgradeToPro"
            />

            <!-- Features List -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-800">
              <ul class="space-y-3">
                <li
                  v-for="(feature, idx) in PLAN_FEATURES.pro.features"
                  :key="idx"
                  class="flex items-start gap-3"
                >
                  <UIcon
                    :name="feature.available ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                    :class="[
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      feature.available
                        ? 'text-green-500'
                        : 'text-gray-400 dark:text-gray-600'
                    ]"
                  />
                  <span
                    :class="[
                      'text-sm',
                      feature.available
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-500 line-through'
                    ]"
                  >
                    {{ feature.text }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Payment Methods Info -->
      <div class="mt-16 max-w-5xl mx-auto">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Phương thức thanh toán
            </h3>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-credit-card"
                  class="w-5 h-5 text-primary"
                />
                <h4 class="font-semibold">
                  Lemon Squeezy (Quốc tế)
                </h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Thanh toán quốc tế qua Lemon Squeezy với thẻ tín dụng/ghi nợ.
              </p>
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-banknote"
                  class="w-5 h-5 text-primary"
                />
                <h4 class="font-semibold">
                  Chuyển khoản (Việt Nam)
                </h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Chuyển khoản ngân hàng qua Sepay. Tự động xác nhận và nạp tiền vào tài khoản.
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLAN_FEATURES } from '~~/shared/constants/plans'

const { user } = useUserSession()
const toast = useToast()

const currentPlan = computed(() => user.value?.plan || 'free')

async function upgradeToPro() {
  toast.add({
    title: 'Nâng cấp gói Pro',
    description: 'Tính năng thanh toán đang được phát triển. Vui lòng liên hệ support để nâng cấp.',
    color: 'info',
    timeout: 5000
  })
}

async function changePlan(plan: string) {
  toast.add({
    title: 'Thay đổi gói',
    description: 'Tính năng này đang được phát triển.',
    color: 'info'
  })
}

useHead({
  title: 'Bảng Giá - Headless Sentry'
})
</script>
