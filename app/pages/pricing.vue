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

    <!-- Payment Modal -->
    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Nâng cấp lên gói Pro
          </h3>
        </template>

        <div
          v-if="!paymentInfo"
          class="space-y-6"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Chọn phương thức thanh toán để nâng cấp lên gói Pro với giá 200.000 VNĐ/tháng
          </p>

          <!-- Payment Method Selection -->
          <div class="space-y-3">
            <label
              class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950': selectedPaymentMethod === 'balance' }"
            >
              <input
                v-model="selectedPaymentMethod"
                type="radio"
                value="balance"
                class="mt-1"
              >
              <div class="flex-1">
                <div class="font-semibold">Số dư tài khoản</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Số dư hiện tại: {{ (user?.balance || 0).toLocaleString('vi-VN') }} VNĐ
                </div>
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950': selectedPaymentMethod === 'sepay' }"
            >
              <input
                v-model="selectedPaymentMethod"
                type="radio"
                value="sepay"
                class="mt-1"
              >
              <div class="flex-1">
                <div class="font-semibold">Chuyển khoản ngân hàng</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Chuyển khoản qua Sepay (Việt Nam)
                </div>
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950': selectedPaymentMethod === 'lemon_squeezy' }"
            >
              <input
                v-model="selectedPaymentMethod"
                type="radio"
                value="lemon_squeezy"
                class="mt-1"
              >
              <div class="flex-1">
                <div class="font-semibold">Lemon Squeezy</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Thanh toán quốc tế bằng thẻ tín dụng
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Payment Instructions (Sepay) -->
        <div
          v-else-if="paymentInfo.paymentMethod === 'sepay'"
          class="space-y-4"
        >
          <UAlert
            color="primary"
            title="Thông tin chuyển khoản"
            description="Vui lòng chuyển khoản theo thông tin dưới đây"
          />

          <div class="space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Ngân hàng:</span>
              <span class="font-semibold">{{ paymentInfo.bankInfo.bankName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Số tài khoản:</span>
              <span class="font-semibold">{{ paymentInfo.bankInfo.accountNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Chủ tài khoản:</span>
              <span class="font-semibold">{{ paymentInfo.bankInfo.accountName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Số tiền:</span>
              <span class="font-semibold text-primary">{{ paymentInfo.price.toLocaleString('vi-VN') }} VNĐ</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Nội dung:</span>
              <span class="font-semibold">{{ paymentInfo.bankInfo.transferContent }}</span>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ paymentInfo.instructions }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              v-if="!paymentInfo"
              label="Hủy"
              color="neutral"
              variant="outline"
              @click="showPaymentModal = false"
            />
            <UButton
              v-if="!paymentInfo"
              :label="loading ? 'Đang xử lý...' : 'Tiếp tục'"
              :loading="loading"
              @click="processUpgrade"
            />
            <UButton
              v-else
              label="Đóng"
              @click="showPaymentModal = false; paymentInfo = null"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { PLAN_FEATURES } from '~~/shared/constants/plans'

const { user, fetch: refreshSession } = useUserSession()
const toast = useToast()

const currentPlan = computed(() => user.value?.plan || 'free')
const showPaymentModal = ref(false)
const selectedPaymentMethod = ref<'lemon_squeezy' | 'sepay' | 'balance'>('balance')
const loading = ref(false)
const paymentInfo = ref<any>(null)

async function upgradeToPro() {
  showPaymentModal.value = true
}

async function processUpgrade() {
  if (loading.value) return

  loading.value = true

  try {
    const response = await $fetch('/api/user/plan/upgrade', {
      method: 'POST',
      body: {
        targetPlan: 'pro',
        paymentMethod: selectedPaymentMethod.value,
        useBalance: selectedPaymentMethod.value === 'balance',
        returnUrl: window.location.origin + '/pricing'
      }
    })

    if (selectedPaymentMethod.value === 'balance') {
      // Direct upgrade with balance
      toast.add({
        title: 'Nâng cấp thành công!',
        description: 'Tài khoản của bạn đã được nâng cấp lên gói PRO.',
        color: 'success',
        timeout: 5000
      })

      // Refresh session to get updated plan
      await refreshSession()
      showPaymentModal.value = false
    } else {
      // Show payment instructions
      paymentInfo.value = response

      if (selectedPaymentMethod.value === 'lemon_squeezy' && response.checkoutUrl) {
        // Redirect to Lemon Squeezy checkout
        window.location.href = response.checkoutUrl
      }
    }
  } catch (error: any) {
    toast.add({
      title: 'Lỗi nâng cấp',
      description: error.data?.message || 'Có lỗi xảy ra khi nâng cấp gói.',
      color: 'error',
      timeout: 5000
    })
  } finally {
    loading.value = false
  }
}

async function changePlan(plan: string) {
  toast.add({
    title: 'Thay đổi gói',
    description: 'Tính năng hạ cấp đang được phát triển. Vui lòng liên hệ support.',
    color: 'info'
  })
}

useHead({
  title: 'Bảng Giá - Headless Sentry'
})
</script>
