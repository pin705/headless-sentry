import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { fileName, fileType } = await readBody(event)

  if (!fileName || !fileType) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu tên hoặc loại file.' })
  }

  // Khởi tạo S3 client cho R2
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    }
  })

  // Tạo một key duy nhất cho file để tránh trùng lặp
  const fileExtension = fileName.split('.').pop()
  const fileKey = `${randomUUID()}.${fileExtension}`

  // Tạo lệnh để đưa object lên R2
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType
  })

  // Tạo pre-signed URL, có hiệu lực trong 10 phút
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`

  return { uploadUrl, publicUrl }
})
