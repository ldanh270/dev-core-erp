import { cloudinary } from "@/configs/system/cloudinary.config.ts"

import type { UploadApiOptions } from "cloudinary"
import { Readable } from "stream"

export class CloudinaryUtil {
  /**
   * Uploads a Buffer to Cloudinary using a stream (avoids temp files)
   * Returns the secure_url and public_id from Cloudinary response
   */
  static async uploadStream(
    buffer: Buffer,
    options: UploadApiOptions,
  ): Promise<{ url: string; id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(
            error instanceof Error
              ? error
              : new Error(error?.message || "Cloudinary upload failed"),
          )
          return
        }
        resolve({ url: result.secure_url, id: result.public_id })
      })

      const readable = new Readable()
      readable.push(buffer)
      readable.push(null)
      readable.pipe(uploadStream)
    })
  }
}
