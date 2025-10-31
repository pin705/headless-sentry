import { createSharedComposable } from '@vueuse/core'
import type { Ref } from 'vue'

interface UserData {
  userId: string
  email: string
  name: string
  avatarUrl?: string
  plan: 'free' | 'pro'
  balance: number
  planExpiresAt?: Date | null
  language?: 'vi' | 'en'
}

const _useUserState = () => {
  const { user: sessionUser } = useUserSession()
  
  // Extended user state with balance and plan info
  const userData: Ref<UserData | null> = useState('userData', () => null)
  const isLoadingUser = ref(false)

  // Fetch full user data including balance
  async function fetchUserData() {
    if (isLoadingUser.value) return
    
    isLoadingUser.value = true
    try {
      const data = await $fetch<UserData>('/api/user/me')
      userData.value = data
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      isLoadingUser.value = false
    }
  }

  // Computed properties for easy access
  const userBalance = computed(() => userData.value?.balance ?? 0)
  const userPlan = computed(() => userData.value?.plan ?? 'free')
  const isProUser = computed(() => userData.value?.plan === 'pro')
  
  // Format balance as VND currency
  const formattedBalance = computed(() => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(userBalance.value)
  })

  // Auto-fetch when user is available
  watch(() => sessionUser.value, (newUser) => {
    if (newUser && !userData.value) {
      fetchUserData()
    }
  }, { immediate: true })

  return {
    userData,
    isLoadingUser,
    userBalance,
    userPlan,
    isProUser,
    formattedBalance,
    fetchUserData
  }
}

export const useUserState = createSharedComposable(_useUserState)
