export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ],
  CLOUDINARY_FOLDERS: {
    APPLICATIONS: "devcore/applications",
    AVATARS: "devcore/avatars",
  },
} as const
