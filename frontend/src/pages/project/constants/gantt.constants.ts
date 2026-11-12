export const GANTT_FILTER_KEY = {
  STATUS: "status",
  TRACKER: "tracker",
  PRIORITY: "priority",
  AUTHOR: "author",
  ASSIGNEE: "assignee",
  TARGET_VERSION: "target_version",
  SUBJECT: "subject",
  PROGRESS: "progress",
  UPDATED_BY: "updated_by",
  LAST_UPDATED_BY: "last_updated_by",
  SUBPROJECT: "subproject",
  ISSUE: "issue",
  TXT_SUBJECT: "txt_subject",
  TXT_DESC: "txt_desc",
  TXT_NOTES: "txt_notes",
  TXT_ANY: "txt_any",
  DATE_CREATED: "date_created",
  DATE_UPDATED: "date_updated",
  DATE_CLOSED: "date_closed",
  DATE_START: "date_start",
  DATE_DUE: "date_due",
  TIME_EST: "time_est",
  TIME_SPENT: "time_spent",
  FILE_NAME: "file_name",
  FILE_DESC: "file_desc",
  AUTHOR_GROUP: "author_group",
  AUTHOR_ROLE: "author_role",
  ASSIGNEE_GROUP: "assignee_group",
  ASSIGNEE_ROLE: "assignee_role",
  VER_DATE: "ver_date",
  VER_STATUS: "ver_status",
  PROJ_STATUS: "proj_status",
  REL_RELATED: "rel_related",
  REL_DUPLICATE: "rel_duplicate",
  REL_DUPLICATED_BY: "rel_duplicated_by",
  REL_BLOCKS: "rel_blocks",
  REL_BLOCKED_BY: "rel_blocked_by",
  REL_PRECEDES: "rel_precedes",
  REL_FOLLOWS: "rel_follows",
  REL_COPIED_TO: "rel_copied_to",
  REL_COPIED_FROM: "rel_copied_from",
  REL_PARENT: "rel_parent",
  REL_CHILD: "rel_child",
  QUICK_REPORTED: "_reported",
  QUICK_UPDATED: "_updated",
  QUICK_WATCHED: "_watched",
} as const

export const QUICK_QUERY_TYPE = {
  ASSIGNED_TO_ME: "assigned_to_me",
  REPORTED_ISSUES: "reported_issues",
  UPDATED_ISSUES: "updated_issues",
  WATCHED_ISSUES: "watched_issues",
} as const

export const GANTT_FILTER_TYPE = {
  STATUS: "status",
  TRACKER: "tracker",
  PRIORITY: "priority",
  EMPLOYEE: "employee",
  VERSION: "version",
  TEXT: "text",
  PROGRESS: "progress",
  NUMBER: "number",
  DATE: "date",
  RELATION: "relation",
} as const

export const GANTT_FILTER_OPERATOR = {
  IS: "is",
  IS_NOT: "is_not",
  LA: "là",
  KHONG_LA: "không là",
  TOI: "tôi",
  NONE: "none",
  ANY: "any",
  CHUA: "chứa",
  KHONG_CHUA: "không chứa",
  BAT_DAU_BANG: "bắt đầu bằng",
  KET_THUC_BANG: "kết thúc bằng",
  EQUAL: "=",
  GREATER_THAN_EQUAL: ">=",
  LESS_THAN_EQUAL: "<=",
  TODAY: "today",
  YESTERDAY: "yesterday",
  IN_DAYS: "in_days",
  MORE_THAN_DAYS: "more_than_days",
  AFTER: "after",
  BEFORE: "before",
  BETWEEN: "between",
  OVERDUE: "overdue",
  OPEN: "open",
  DONG: "đóng",
  TAT_CA: "tất cả",
} as const

export const PROJECT_QUERY_KEY = {
  GANTT: "projectGantt",
  CUSTOM_QUERIES: "customQueries",
  TASKS: "tasks",
  OVERVIEW: "overview",
} as const

export const DEFAULT_MONTHS_RANGE = 6
export const DEFAULT_MONTHS_RANGE_STRING = "6"
export const DEFAULT_RECENT_DAYS_RANGE = 7

export const FILTER_DEFINITIONS = {
  [GANTT_FILTER_KEY.STATUS]: { label: "Trạng thái", type: GANTT_FILTER_TYPE.STATUS, group: "" },
  [GANTT_FILTER_KEY.TRACKER]: { label: "Kiểu vấn đề", type: GANTT_FILTER_TYPE.TRACKER, group: "" },
  [GANTT_FILTER_KEY.PRIORITY]: { label: "Mức ưu tiên", type: GANTT_FILTER_TYPE.PRIORITY, group: "" },
  [GANTT_FILTER_KEY.AUTHOR]: { label: "Tác giả", type: GANTT_FILTER_TYPE.EMPLOYEE, group: "" },
  [GANTT_FILTER_KEY.ASSIGNEE]: { label: "Phân công cho", type: GANTT_FILTER_TYPE.EMPLOYEE, group: "" },
  [GANTT_FILTER_KEY.TARGET_VERSION]: { label: "Phiên bản", type: GANTT_FILTER_TYPE.VERSION, group: "" },
  [GANTT_FILTER_KEY.SUBJECT]: { label: "Chủ đề", type: GANTT_FILTER_TYPE.TEXT, group: "" },
  [GANTT_FILTER_KEY.PROGRESS]: { label: "Tiến độ", type: GANTT_FILTER_TYPE.PROGRESS, group: "" },
  [GANTT_FILTER_KEY.UPDATED_BY]: { label: "Cập nhật bởi", type: GANTT_FILTER_TYPE.EMPLOYEE, group: "" },
  [GANTT_FILTER_KEY.LAST_UPDATED_BY]: { label: "Cập nhật lần cuối bởi", type: GANTT_FILTER_TYPE.EMPLOYEE, group: "" },
  [GANTT_FILTER_KEY.SUBPROJECT]: { label: "Dự án con", type: GANTT_FILTER_TYPE.TEXT, group: "" },
  [GANTT_FILTER_KEY.ISSUE]: { label: "Vấn đề", type: GANTT_FILTER_TYPE.TEXT, group: "" },
  
  // Text search filter group
  [GANTT_FILTER_KEY.TXT_SUBJECT]: { label: "Chủ đề", type: GANTT_FILTER_TYPE.TEXT, group: "Văn bản" },
  [GANTT_FILTER_KEY.TXT_DESC]: { label: "Mô tả", type: GANTT_FILTER_TYPE.TEXT, group: "Văn bản" },
  [GANTT_FILTER_KEY.TXT_NOTES]: { label: "Ghi chú", type: GANTT_FILTER_TYPE.TEXT, group: "Văn bản" },
  [GANTT_FILTER_KEY.TXT_ANY]: { label: "Nội dung bất kỳ", type: GANTT_FILTER_TYPE.TEXT, group: "Văn bản" },

  // Date filter group
  [GANTT_FILTER_KEY.DATE_DUE]: { label: "Hạn hoàn thành (Ngày hết hạn)", type: GANTT_FILTER_TYPE.DATE, group: "Ngày" },
  [GANTT_FILTER_KEY.DATE_START]: { label: "Bắt đầu", type: GANTT_FILTER_TYPE.DATE, group: "Ngày" },
  [GANTT_FILTER_KEY.DATE_CREATED]: { label: "Tạo", type: GANTT_FILTER_TYPE.DATE, group: "Ngày" },
  [GANTT_FILTER_KEY.DATE_UPDATED]: { label: "Cập nhật", type: GANTT_FILTER_TYPE.DATE, group: "Ngày" },
  [GANTT_FILTER_KEY.DATE_CLOSED]: { label: "Đã đóng", type: GANTT_FILTER_TYPE.DATE, group: "Ngày" },

  // Time tracking filter group
  [GANTT_FILTER_KEY.TIME_EST]: { label: "Thời gian ước lượng", type: GANTT_FILTER_TYPE.NUMBER, group: "Theo dõi thời gian" },
  [GANTT_FILTER_KEY.TIME_SPENT]: { label: "Thời gian", type: GANTT_FILTER_TYPE.NUMBER, group: "Theo dõi thời gian" },

  // File filter group
  [GANTT_FILTER_KEY.FILE_NAME]: { label: "Tập tin", type: GANTT_FILTER_TYPE.TEXT, group: "Tập tin" },
  [GANTT_FILTER_KEY.FILE_DESC]: { label: "File description", type: GANTT_FILTER_TYPE.TEXT, group: "Tập tin" },

  // Author filter group
  [GANTT_FILTER_KEY.AUTHOR_GROUP]: { label: "Của tác giả : Nhóm", type: GANTT_FILTER_TYPE.TEXT, group: "Tác giả" },
  [GANTT_FILTER_KEY.AUTHOR_ROLE]: { label: "Của tác giả : Quyền", type: GANTT_FILTER_TYPE.TEXT, group: "Tác giả" },

  // Assignee filter group
  [GANTT_FILTER_KEY.ASSIGNEE_GROUP]: { label: "Nhóm thụ hưởng", type: GANTT_FILTER_TYPE.TEXT, group: "Phân công cho" },
  [GANTT_FILTER_KEY.ASSIGNEE_ROLE]: { label: "Quyền thụ hưởng", type: GANTT_FILTER_TYPE.TEXT, group: "Phân công cho" },

  // Target version filter group
  [GANTT_FILTER_KEY.VER_DATE]: { label: "Phiên bản mục tiêu của Ngày", type: GANTT_FILTER_TYPE.DATE, group: "Phiên bản" },
  [GANTT_FILTER_KEY.VER_STATUS]: { label: "Phiên bản mục tiêu của Trạng thái", type: GANTT_FILTER_TYPE.TEXT, group: "Phiên bản" },

  // Project filter group
  [GANTT_FILTER_KEY.PROJ_STATUS]: { label: "Của dự án : Trạng thái", type: GANTT_FILTER_TYPE.TEXT, group: "Dự án" },

  // Task relationship filter group
  [GANTT_FILTER_KEY.REL_RELATED]: { label: "liên quan", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_DUPLICATE]: { label: "trùng với", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_DUPLICATED_BY]: { label: "bị trùng bởi", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_BLOCKS]: { label: "chặn", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_BLOCKED_BY]: { label: "chặn bởi", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_PRECEDES]: { label: "đi trước", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_FOLLOWS]: { label: "đi sau", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_COPIED_TO]: { label: "Sao chép đến", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_COPIED_FROM]: { label: "Sao chép từ", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_PARENT]: { label: "Tác vụ cha", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
  [GANTT_FILTER_KEY.REL_CHILD]: { label: "Tác vụ con", type: GANTT_FILTER_TYPE.RELATION, group: "Mối quan hệ" },
} as const
