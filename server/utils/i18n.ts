import type { SupportedLanguage } from './sendMail'

/**
 * Get user's preferred language from database or default to Vietnamese
 */
export async function getUserLanguage(userId: string): Promise<SupportedLanguage> {
  try {
    const user = await User.findById(userId).select('language')
    return (user?.language as SupportedLanguage) || 'vi'
  } catch (error) {
    console.error('Error fetching user language:', error)
    return 'vi'
  }
}

/**
 * Detect language from email address (heuristic)
 * Vietnamese emails often end with .vn domains
 */
export function detectLanguageFromEmail(email: string): SupportedLanguage {
  if (email.toLowerCase().includes('.vn') || email.toLowerCase().includes('vietnam')) {
    return 'vi'
  }
  return 'en'
}

/**
 * Get language from user session or fallback to email detection
 */
export async function getLanguageForUser(userId?: string, email?: string): Promise<SupportedLanguage> {
  // Try to get from user preferences first
  if (userId) {
    try {
      const lang = await getUserLanguage(userId)
      if (lang) return lang
    } catch (error) {
      console.error('Error getting user language:', error)
    }
  }

  // Fallback to email detection
  if (email) {
    return detectLanguageFromEmail(email)
  }

  // Default to Vietnamese
  return 'vi'
}
