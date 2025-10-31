import { getPlanLimits, type PlanType } from '~/shared/constants/plans'

/**
 * Check if user can create a new project based on their plan limits
 */
export async function canCreateProject(userId: string): Promise<{ allowed: boolean, reason?: string }> {
  const user = await User.findById(userId)
  if (!user) {
    return { allowed: false, reason: 'Người dùng không tồn tại' }
  }

  const limits = getPlanLimits(user.plan as PlanType)
  const projectCount = await Project.countDocuments({ 'members.userId': userId })

  if (projectCount >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Bạn đã đạt giới hạn ${limits.maxProjects} dự án của gói ${user.plan.toUpperCase()}. Vui lòng nâng cấp để tạo thêm dự án.`
    }
  }

  return { allowed: true }
}

/**
 * Check if user can create a new monitor in a project based on their plan limits
 */
export async function canCreateMonitor(userId: string): Promise<{ allowed: boolean, reason?: string }> {
  const user = await User.findById(userId)
  if (!user) {
    return { allowed: false, reason: 'Người dùng không tồn tại' }
  }

  const limits = getPlanLimits(user.plan as PlanType)

  // Count monitors across all user's projects
  const projects = await Project.find({ 'members.userId': userId }).select('_id')
  const projectIds = projects.map(p => p._id)
  const monitorCount = await Monitor.countDocuments({ projectId: { $in: projectIds } })

  if (monitorCount >= limits.maxMonitors) {
    return {
      allowed: false,
      reason: `Bạn đã đạt giới hạn ${limits.maxMonitors} monitor của gói ${user.plan.toUpperCase()}. Vui lòng nâng cấp để tạo thêm monitor.`
    }
  }

  return { allowed: true }
}

/**
 * Check if project can add a new member based on owner's plan limits
 */
export async function canAddMember(projectId: string): Promise<{ allowed: boolean, reason?: string }> {
  const project = await Project.findById(projectId)
  if (!project) {
    return { allowed: false, reason: 'Dự án không tồn tại' }
  }

  const owner = await User.findById(project.ownerId)
  if (!owner) {
    return { allowed: false, reason: 'Chủ sở hữu dự án không tồn tại' }
  }

  const limits = getPlanLimits(owner.plan as PlanType)
  const currentMemberCount = project.members?.length || 0

  if (currentMemberCount >= limits.maxMembers) {
    return {
      allowed: false,
      reason: `Dự án đã đạt giới hạn ${limits.maxMembers} thành viên của gói ${owner.plan.toUpperCase()}. Vui lòng nâng cấp để mời thêm thành viên.`
    }
  }

  return { allowed: true }
}

/**
 * Check if user's monitor frequency is allowed by their plan
 */
export function isFrequencyAllowed(userPlan: PlanType, frequencyInSeconds: number): boolean {
  const limits = getPlanLimits(userPlan)
  const minAllowedFrequency = limits.checkInterval * 60 // Convert minutes to seconds
  return frequencyInSeconds >= minAllowedFrequency
}

/**
 * Check if feature is available for user's plan
 */
export function hasFeature(userPlan: PlanType, feature: keyof ReturnType<typeof getPlanLimits>): boolean {
  const limits = getPlanLimits(userPlan)
  return Boolean(limits[feature])
}

/**
 * Get user's current usage statistics
 */
export async function getUserUsage(userId: string) {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error('Người dùng không tồn tại')
  }

  const limits = getPlanLimits(user.plan as PlanType)

  // Get user's projects
  const projects = await Project.find({ 'members.userId': userId })
  const projectIds = projects.map(p => p._id)

  // Count monitors across all projects
  const monitorCount = await Monitor.countDocuments({ projectId: { $in: projectIds } })

  // Count total members across all owned projects
  const ownedProjects = projects.filter(p => p.ownerId.toString() === userId)
  const totalMembers = ownedProjects.reduce((sum, project) => sum + (project.members?.length || 0), 0)

  return {
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    balance: user.balance,
    limits,
    usage: {
      projects: {
        current: projects.length,
        limit: limits.maxProjects
      },
      monitors: {
        current: monitorCount,
        limit: limits.maxMonitors
      },
      members: {
        current: totalMembers,
        limit: limits.maxMembers
      }
    }
  }
}
