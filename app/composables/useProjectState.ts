import { ref } from 'vue'
import type { Ref } from 'vue'

// Định nghĩa kiểu dữ liệu Project (đơn giản)
interface ProjectItem {
  _id: string
  name: string
}

export const useProjectState = () => {
  // Lưu trữ Project đang được chọn
  const selectedProject: Ref<ProjectItem | null> = useState('selectedProject', () => null)
  // Lưu trữ danh sách tất cả Project của người dùng
  const userProjects: Ref<ProjectItem[]> = useState('userProjects', () => [])
  // Trạng thái loading
  const loadingProjects = ref(false)

  // Hàm fetch danh sách Project
  async function fetchUserProjects() {
    if (userProjects.value.length > 0 && !selectedProject.value) {
      // Nếu đã có danh sách và chưa chọn, chọn cái đầu tiên
      selectedProject.value = userProjects.value[0]
      return // Không fetch lại nếu đã có
    }
    if (loadingProjects.value) return // Tránh fetch trùng lặp

    loadingProjects.value = true
    try {
      const projects = await $fetch<ProjectItem[]>('/api/projects')
      userProjects.value = projects
      // Tự động chọn project đầu tiên nếu chưa có project nào được chọn
      if (!selectedProject.value && projects.length > 0) {
        selectedProject.value = projects[0]
      }
    } catch (error) {
      console.error('Lỗi fetch danh sách project:', error)
      // Xử lý lỗi (ví dụ: hiển thị toast)
    } finally {
      loadingProjects.value = false
    }
  }

  // Hàm chọn Project
  function selectProject(project: ProjectItem) {
    selectedProject.value = project
    // Có thể thêm logic khác ở đây, ví dụ: navigate về trang chủ của project
    navigateTo('/') // Ví dụ: Luôn về Tổng quan khi đổi project
  }

  return {
    selectedProject,
    userProjects,
    loadingProjects,
    fetchUserProjects,
    selectProject
  }
}
