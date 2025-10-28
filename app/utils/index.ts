// Dùng cho việc hiển thị badge trạng thái
export const statusColors: Record<string, any> = { 'published': 'primary', 'on-hold': 'gray', 'draft': 'warning' }
export const statusLabels: Record<string, string> = { 'published': 'Đã xuất bản', 'on-hold': 'Tạm ngưng', 'draft': 'Nháp' }

export const authorStylePresets = [
  {
    name: 'Thiên Tằm Thổ Đậu',
    description: 'Sảng văn, tiết tấu cực nhanh, nhân vật chính từ phế vật vươn lên đỉnh cao, tập trung vào chiến đấu và thăng cấp.',
    value: 'Mạch truyện thẳng, sảng văn, tiết tấu nhanh, nhân vật chính từ yếu đến mạnh (phế vật nghịch tập), tập trung vào chiến đấu và thăng cấp.'
  },
  {
    name: 'Ngã Cật Tây Hồng Thị',
    description: 'Thế giới quan cực kỳ rộng lớn, hệ thống tu luyện chi tiết, quy mô từ hành tinh đến vũ trụ.',
    value: 'Thế giới quan rộng lớn, hệ thống tu luyện chi tiết, tập trung vào hành trình tu luyện và khám phá đạo pháp, quy mô vũ trụ.'
  },
  {
    name: 'Đường Gia Tam Thiếu',
    description: 'Trọng tình cảm, lãng mạn, tinh thần đồng đội. Hệ thống sức mạnh độc đáo và sáng tạo.',
    value: 'Nhấn mạnh yếu tố tình cảm, lãng mạn, tình đồng đội, trọng tình nghĩa. Hệ thống sức mạnh độc đáo, sáng tạo.'
  },
  {
    name: 'Nhĩ Căn',
    description: 'Văn phong có chiều sâu, nhuốm màu triết lý, nội tâm nhân vật phức tạp, thường mang chút bi thương.',
    value: 'Văn phong có chiều sâu triết lý, nội tâm nhân vật phức tạp và giằng xé, khai thác sự cô độc trên con đường cầu đạo, nghịch thiên.'
  },
  {
    name: 'Mặc Hương Đồng Khứu',
    description: 'Cốt truyện nhiều tầng lớp, tình cảm tinh tế, cài cắm nhiều chi tiết (phục bút), nhân vật có chiều sâu.',
    value: 'Cốt truyện phức tạp, nhiều tầng lớp, đan xen quá khứ và hiện tại, tình cảm tinh tế, nhân vật có chiều sâu, cài cắm nhiều chi tiết.'
  },
  {
    name: 'Cố Mạn',
    description: 'Ngôn tình hiện đại, ngọt sủng, nhẹ nhàng, không có nhiều tình tiết kịch tính hay ngược tâm.',
    value: 'Ngôn tình nhẹ nhàng, ngọt sủng, tập trung vào quá trình phát triển tình cảm một cách ấm áp, không ngược tâm.'
  }
]

export const toneOptions = ['Nghiêm túc', 'Hài hước', 'Bi thương', 'Kịch tính', 'Nhẹ nhàng', 'U ám', 'Sử thi']
export const emotionalElementOptions = [
  { value: 'Tình yêu', label: 'Tình yêu' }, { value: 'Tình bạn', label: 'Tình bạn' }, { value: 'Sự phản bội', label: 'Sự phản bội' },
  { value: 'Sự hy sinh', label: 'Sự hy sinh' }, { value: 'Sự mất mát', label: 'Sự mất mát' }, { value: 'Lòng thù hận', label: 'Lòng thù hận' }
]
export const humorElementOptions = [
  { value: 'Chơi chữ', label: 'Chơi chữ' }, { value: 'Mỉa mai', label: 'Mỉa mai' }, { value: 'Tình huống', label: 'Tình huống' },
  { value: 'Ngây ngô', label: 'Ngây ngô' }, { value: 'Hài đen (black humor)', label: 'Hài đen' }
]

export function toggleArrayItem(array: string[], value: string) {
  const index = array.indexOf(value)
  if (index === -1) {
    array.push(value)
  } else {
    array.splice(index, 1)
  }
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 30) return 'vài giây trước'

  const intervals: { [key: string]: number } = {
    năm: 31536000,
    tháng: 2592000,
    tuần: 604800,
    ngày: 86400,
    tiếng: 3600,
    phút: 60
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const value = Math.floor(seconds / secondsInUnit)
    if (value >= 1) {
      return `${value} ${unit} trước`
    }
  }

  return `${Math.floor(seconds)} giây trước`
}
