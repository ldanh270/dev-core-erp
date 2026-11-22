/** Defines application notification copy and the corresponding web destinations. */
export const APPLICATION_NOTIFICATION = {
  ROUTE: {
    MINE: "/application/my-applications",
    MANAGE: "/application/manage",
  },
  SUBMITTED: {
    title: "Tạo đơn thành công",
    message: (type: string) => `Đơn (${type}) của bạn đã được gửi.`,
  },
  NEEDS_APPROVAL: {
    title: "Có đơn mới cần duyệt",
    message: (type: string) => `Có đơn mới (${type}) cần bạn phê duyệt.`,
  },
  NEEDS_SWAP_CONFIRMATION: {
    title: "Có đề nghị đổi ca cần xác nhận",
    message: "Một đồng nghiệp đã gửi đề nghị đổi ca cho bạn.",
  },
  APPROVED: {
    title: "Đơn đã được phê duyệt",
    message: (type: string) => `Đơn (${type}) của bạn đã được phê duyệt.`,
  },
  REJECTED: {
    title: "Đơn bị từ chối",
    message: (type: string) => `Đơn (${type}) của bạn đã bị từ chối. Xem chi tiết trong đơn.`,
  },
} as const
