import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 (S3 compatible). The bucket is private: every upload and download goes through a short-lived signed link
// that the server only hands out after checking who is asking (see /api/r2/*).

export const r2Configured = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)

let client: S3Client | null = null
function s3() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    })
  }
  return client
}

const bucket = () => process.env.R2_BUCKET!

/** Link the browser uses to PUT one file straight into the bucket (valid 10 minutes, for that file type only). */
export function uploadUrl(key: string, contentType: string) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn: 600 })
}

/** Link to open a stored file (valid 10 minutes). Opens in the browser instead of downloading. */
export function downloadUrl(key: string) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: 'inline' }), { expiresIn: 600 })
}

export async function removeObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const MAX_BYTES = 5 * 1024 * 1024

/** Folder every company document lives in: company-docs/<company folder>/<time>_<file name> */
export const DOC_PREFIX = 'company-docs/'

export function cleanName(name: string) {
  return String(name || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120) || 'file'
}

export function cleanFolder(folder: string) {
  return String(folder || 'unassigned').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60) || 'unassigned'
}
