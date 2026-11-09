export const PROJECT_MESSAGES = {
  PART_TIME_HOURLY_RATE_REQUIRED: "Nhân viên part-time cần mức lương theo giờ",
  ADD_MEMBER_PART_TIME_HINT: "Chọn nhân viên, mức lương/giờ (bắt buộc với part-time) và chế độ làm việc.",
  KANBAN_IN_PROGRESS_TO_TODO_BLOCKED:
    "Công việc đang thực hiện không thể chuyển ngược lại về cần làm theo quy trình",
  TASK_START_AFTER_DUE: "Ngày bắt đầu không được sau hạn hoàn thành",
  CHILD_START_BEFORE_PARENT: "Ngày bắt đầu của công việc con không được trước ngày bắt đầu của công việc cha",
  CHILD_DUE_AFTER_PARENT: "Hạn hoàn thành của công việc con không được sau hạn hoàn thành của công việc cha",
  PARENT_TIME_MUST_COVER_CHILD: "Khoảng thời gian công việc cha phải bao trùm công việc con",
} as const
