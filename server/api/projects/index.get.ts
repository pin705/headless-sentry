import { requireUserSession } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = await requireUserSession(event)

  // Sử dụng Aggregation để đếm số lượng member và monitor
  const projects = await Project.aggregate([
    {
      // 1. Tìm các project mà user này là thành viên
      $match: { 'members.userId': userId }
    },
    {
      // 2. Join với collection 'monitors'
      $lookup: {
        from: Monitor.collection.name, // Lấy tên collection từ model
        localField: '_id',
        foreignField: 'projectId',
        as: 'monitors' // Tên mảng kết quả
      }
    },
    {
      // 3. Định hình lại output
      $project: {
        _id: 1,
        name: 1,
        ownerId: 1,
        createdAt: 1,
        memberCount: { $size: '$members' }, // Đếm số phần tử trong mảng members
        monitorCount: { $size: '$monitors' } // Đếm số phần tử trong mảng monitors
      }
    },
    {
      // 4. Sắp xếp (tùy chọn)
      $sort: { createdAt: -1 }
    }
  ])

  return projects
})
