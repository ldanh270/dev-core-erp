/**
 * Centralized user-facing attendance copy and internationalization dictionary.
 * Mirrors backend attendance message constants for consistent notifications.
 */
export const ATTENDANCE_MESSAGES = {
  ERRORS: {
    SCAN_FAILED: "Lỗi khi chấm công",
  },
  SHIFT_FORM: {
    NAME_MIN_LENGTH: "Tên ca phải có ít nhất 2 ký tự",
    TIME_FORMAT: "Thời gian phải theo định dạng HH:mm",
    BREAK_PAIR_REQUIRED: "Vui lòng nhập đủ giờ bắt đầu và kết thúc nghỉ",
    BREAK_OUTSIDE_SHIFT: "Thời gian nghỉ phải nằm hoàn toàn trong ca",
    LATITUDE_NUMBER: "Vĩ độ phải là một số",
    LONGITUDE_NUMBER: "Kinh độ phải là một số",
    RADIUS_NUMBER: "Bán kính phải là một số",
    CREATE_SUCCESS: "Đã tạo ca làm việc",
    UPDATE_SUCCESS: "Đã cập nhật ca làm việc",
    CREATE_ERROR: "Không thể tạo ca làm việc",
    UPDATE_ERROR: "Không thể cập nhật ca làm việc",
  },
  SHIFT_MANAGEMENT: {
    DELETE_CONFIRM: "Xác nhận xoá ca làm việc này?",
  },
  HOLIDAYS: {
    CREATE_SUCCESS: (count: number) => `Đã thêm ${count} ngày nghỉ`,
    CREATE_ERROR: "Thêm ngày lễ thất bại",
    UPDATE_SUCCESS: "Đã cập nhật ngày lễ",
    DELETE_SUCCESS: "Đã xóa ngày lễ",
    SCOPE_POSITION: (name: string) => `Chức danh: ${name}`,
    SCOPE_EMPLOYEES: (count: number) => `Nhóm ${count} nhân viên`,
  },
  WEEKLY_SCHEDULES: {
    DELETE_CONFIRM: "Xác nhận xoá template này?",
    DELETE_SUCCESS: "Đã xoá template",
    CONFIG_INVALID_DAY: "Ngày kích hoạt không hợp lệ",
    CONFIG_SAVE_SUCCESS: "Đã lưu cấu hình tự động sinh lịch tuần",
    CONFIG_SAVE_ERROR: "Không thể lưu cấu hình lịch tuần",
  },
  SCANNER: {
    TITLE: "Máy Chấm Công Ảo",
    TODAY_SHIFT: "Ca hôm nay",
    SHIFT_NAME: "Tên ca",
    WORK_WINDOW: "Giờ làm",
    CHECK_IN_WINDOW: "Check-in đúng giờ",
    CHECK_OUT_WINDOW: "Check-out",
    CHECK_OUT_FROM: "Từ",
    NO_GPS_CONFIGURED: "Chưa cấu hình GPS",
    GPS_RADIUS_LABEL: (radius: number, locationName: string) => `${radius}m quanh ${locationName}`,
    GPS_COORDINATE_LABEL: (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    NO_SHIFT_TODAY: "Chưa có ca làm việc được phân cho hôm nay.",
    GEO_NOT_SUPPORTED: "Trình duyệt không hỗ trợ lấy vị trí GPS",
    GEO_PERMISSION_DENIED: "Vui lòng cho phép truy cập vị trí để chấm công",
    GEO_LOCATING: "Đang lấy vị trí GPS...",
    // Keep this short: the shift card already shows the allowed radius/location above.
    GEO_READY: "Đã lấy vị trí",
    GEO_MISSING: "⚠️ Chưa có vị trí GPS",
    GEO_PERMISSION_HINT:
      "Yêu cầu quyền truy cập vị trí (Location Permission) từ trình duyệt để đảm bảo chấm công đúng địa điểm.",
    CHECK_IN_SUCCESS: "Check-in thành công!",
    CHECK_OUT_SUCCESS: "Check-out thành công!",
    CHECK_IN_LABEL: "Check-in",
    CHECK_OUT_LABEL: "Check-out",
    NO_SHIFT_ACTION_LABEL: "Chưa có ca hôm nay",
    PROCESSING: (actionLabel: string) => `Đang ${actionLabel}...`,
  },
} as const
