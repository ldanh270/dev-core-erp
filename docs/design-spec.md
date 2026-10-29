# ĐẶC TẢ THIẾT KẾ GIAO DIỆN CHUNG (FRONTEND DESIGN SPEC)
**Hệ thống:** DevCore ERP (Enterprise Resource Planning for IT Outsourcing)  
**Tài liệu tham chiếu:** [`docs/frontend-design-spec.md`](docs/frontend-design-spec.md), [`AGENTS.md`](AGENTS.md)  
**Trạng thái áp dụng:** Chuẩn mực bắt buộc cho toàn bộ FE (Single Source of Truth).

---

## 0. Nguyên Tắc Thiết Kế Nền Tảng (Core Design Principles)

1. **Hiến pháp Kỹ thuật là Chuẩn mực cao nhất:** Mọi giao diện phải tuân thủ tuyệt đối quy tắc **The Pill Rule** (`rounded-full` cho các interactive elements), **Token-Only Rule** (không dùng mã màu hardcode), và kiến trúc phân lớp component.
2. **Dự án DevCore ERP là GỐC:** Giữ nguyên 100% tất cả module, sub-routes và chức năng. Web tham khảo (ERPNext) chỉ cung cấp tư duy tổ chức Desk UI, không sao chép hình ảnh/icon hay thay đổi logic.
3. **Khuôn mẫu nhất quán theo 5 loại màn hình:** Mọi màn hình trong dự án (kể cả các màn không có ở ERPNext) đều phải kế thừa cấu trúc chuẩn của 1 trong 5 loại pattern bên dưới.

---

## 1. Đặc Tả 5 Loại Pattern Màn Hình Chuẩn

### PATTERN 1: MÀN HÌNH DANH SÁCH (LIST VIEW PATTERN)
*Áp dụng cho:* `/employees`, `/employees/contracts`, `/employees/insurance`, `/attendance/work-schedules`, `/application/all`, `/payroll/list`, `/recruitment/requisitions`, `/recruitment/candidates`, `/project`, `/settings/roles`, `/hrm/activity-logs`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PageHeader: Tiêu đề trang (text-2xl font-bold) + Nút hành động chính (Phải)  │
│ [Khoảng cách 24px (mb-6)]                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ PageCard (rounded-xl, p-0, overflow-hidden, border)                      │ │
│ │ ├─ Tab trạng thái (Status Tabs): cao 48px, cuộn ngang, viền đáy 1px      │ │
│ │ ├─ DataTableToolbar: padding 16px (px-6 py-4), flex justify-between      │ │
│ │ │  ├─ Trái: Input Search (w-72, rounded-full, cao 40px)                  │ │
│ │ │  └─ Phải: Các nút Dropdown Filter (Select rounded-full, cao 40px)      │ │
│ │ ├─ Table: Header cao 48px (bg-muted/50), Row cao 60px - 64px             │ │
│ │ │  ├─ Cột 1: Checkbox chọn nhiều dòng (w-12)                             │ │
│ │ │  ├─ Cột dữ liệu: font-normal, text-sm, text-foreground                 │ │
│ │ │  ├─ Cột trạng thái: Status Pill Badge (rounded-full, text-xs)          │ │
│ │ │  └─ Cột cuối: Nút thao tác dòng (DropdownMenu / Button ghost)          │ │
│ │ └─ AppPagination: padding 16px (px-6 py-4), viền trên 1px               │ │
│ │    ├─ Trái: "Hiển thị X - Y trên tổng số Z kết quả"                      │ │
│ │    └─ Phải: Nút chuyển trang Trang trước / Sau / Số trang                │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **Bố cục & Khoảng cách (Metrics):**
   - Padding toàn trang: `p-6` (24px) trên desktop, `p-4` (16px) trên mobile.
   - Khoảng cách giữa `PageHeader` và `PageCard`: `gap-6` (24px).
   - Chiều cao dòng bảng (Row Height): Chuẩn `60px - 64px`. Không có đường viền dọc, chỉ có viền ngang dưới `border-b border-border`.
   - Vị trí nút chính (Thêm mới): Luôn đặt tại `PageHeader` ở góc trên cùng bên phải.
   - Khi có chọn nhiều dòng (Checkbox row): `DataTableToolbar` kích hoạt thanh tác vụ hàng loạt (**Batch Actions**) hiển thị: `Đã chọn N dòng` + Nút `Xóa hàng loạt` (destructive) + Nút `Xuất Excel`.
2. **Component sử dụng:**
   - `<PageHeader />` (`@/components/common/page-header.tsx`)
   - `<PageCard padding="sm" className="p-0 overflow-hidden">` (`@/components/common/page-card.tsx`)
   - `<DataTableToolbar />` (`@/components/common/data-table-toolbar.tsx`)
   - `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>` (`@/components/ui/table.tsx`)
   - `<StatusPill />` (`@/components/common/status-pill.tsx`)
   - `<AppPagination />` (`@/components/common/app-pagination.tsx`)
3. **Trạng thái (States):**
   - **Loading:** Render 5 dòng `<TableRow>` chứa `<Skeleton className="h-8 w-full rounded-md" />`.
   - **Empty:** Sử dụng `<EmptyState icon={Inbox} title="Không có dữ liệu" description="Chưa có bản ghi nào được tìm thấy" action={<Button>+ Thêm mới</Button>} />`.
   - **Error:** Alert banner viền đỏ nhạt đầu bảng kèm nút `Thử lại`.
4. **Design Tokens:**
   - Bo góc: Container `rounded-xl` (12px), Filter/Button `rounded-full` (9999px).
   - Màu sắc: Nền bảng `bg-card`, Viền `border-border`, Dòng hover `hover:bg-muted/50`.

---

### PATTERN 2: MÀN HÌNH FORM TẠO / SỬA (FORM VIEW PATTERN)
*Áp dụng cho:* `/employees/create`, `/employees/contracts/create`, `/application/create`, `/payroll/employee-salary`, `/project/task/new`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PageHeader: Tiêu đề Form + [Hủy] (outline) + [Lưu thông tin] (primary)      │
│ [Khoảng cách 24px (mb-6)]                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ PageCard (rounded-xl, p-8, border, bg-card)                              │ │
│ │ ├─ Section 1: Thông tin cơ bản (SectionHeader: Tiêu đề + đường kẻ ngang)  │ │
│ │ │  Lưới 2 cột (grid grid-cols-1 md:grid-cols-2 gap-6)                    │ │
│ │ │  ├─ Cột 1: Label (font-medium text-sm) + Input (rounded-full, cao 44px)│ │
│ │ │  └─ Cột 2: Label + Select (rounded-full, cao 44px)                     │ │
│ │ ├─ Section 2: Thông tin chi tiết / Bảng con (Child Table)                │ │
│ │ │  Lưới chi tiết có nút [+ Thêm dòng] dạng outline rounded-full          │ │
│ │ └─ Section 3: Tệp đính kèm & Ghi chú                                     │ │
│ │     FileUploader kéo thả + Textarea (rounded-xl, p-4)                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **Bố cục & Khoảng cách (Metrics):**
   - Cặp nút hành động [Hủy] và [Lưu]: **Đặt cố định tại PageHeader góc trên bên phải**.
   - Khoảng cách giữa các Section: `space-y-8` (32px).
   - Khoảng cách giữa các ô nhập liệu trong lưới: `gap-6` (24px ngang và dọc).
   - Chiều cao ô Input/Select: `44px` hoặc `48px`.
2. **Component sử dụng:**
   - `<SectionHeader title="..." description="..." />` (`@/components/common/section-header.tsx`)
   - `<Input className="rounded-full h-11" />` (`@/components/ui/input.tsx`)
   - `<Select><SelectTrigger className="rounded-full h-11">` (`@/components/ui/select.tsx`)
   - `<Textarea className="rounded-xl min-h-[100px]" />` (`@/components/ui/textarea.tsx`)
   - Form Hook: Bắt buộc dùng `react-hook-form` kết hợp `zodResolver`.
3. **Validation & Trạng thái lỗi:**
   - Ô nhập liệu lỗi: Viền đổi sang `border-destructive focus-visible:ring-destructive`.
   - Câu thông báo lỗi: Nằm ngay dưới ô nhập liệu: `text-xs font-medium text-destructive mt-1.5 ml-4`.
4. **Design Tokens:**
   - Bo góc: Text Input & Select dùng `rounded-full`; Textarea và File Upload Card dùng `rounded-xl`.

---

### PATTERN 3: MÀN HÌNH CHI TIẾT (DETAIL VIEW PATTERN)
*Áp dụng cho:* `/profile`, `/project/:id/:tab`, `/recruitment/requisitions/:id`, `/recruitment/applications/:id`, `/payroll/my-payslips`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PageHeader: Nút [Quay lại] + Mã/Tiêu đề đối tượng + Badge trạng thái + Menu   │
│ [Khoảng cách 24px (mb-6)]                                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Tab Bar điều hướng chi tiết (Tổng quan, Tiến độ, Lịch sử, Tệp đính kèm)   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Lưới 12 cột (grid grid-cols-12 gap-6):                                       │
│ ├─ Cột chính (col-span-12 lg:col-span-8): PageCard chứa thông tin chi tiết  │
│ └─ Cột phụ (col-span-12 lg:col-span-4): Thẻ tóm tắt, Người phụ trách, Audit  │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **Bố cục & Khoảng cách (Metrics):**
   - Bố cục bất đối xứng: Cột nội dung chính 8 phần (`col-span-8`), Cột tóm tắt/Sidebar 4 phần (`col-span-4`).
   - Khoảng cách giữa 2 cột: `gap-6` (24px).
   - Đầu trang luôn có nút `<Button variant="ghost" size="icon" className="rounded-full">` hình mũi tên quay lại danh sách cha.
2. **Component sử dụng:**
   - `<Tabs>`, `<TabsList className="rounded-full">`, `<TabsTrigger className="rounded-full">` (`@/components/ui/tabs.tsx`)
   - `<StatRow label="..." value="..." />` (`@/components/common/stat-row.tsx`)
   - `<PageCard />` bọc từng khối thông tin.
3. **Design Tokens:**
   - Tiêu đề khối: `text-base font-semibold text-foreground`.
   - Nhãn nhạt: `text-sm text-muted-foreground`. Giá trị đậm: `text-sm font-medium text-foreground`.

---

### PATTERN 4: MÀN HÌNH DASHBOARD / BÁO CÁO (DASHBOARD PATTERN)
*Áp dụng cho:* `/attendance/summary`, `/recruitment/dashboard`, `/project/my-projects`, `/security/dashboard`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PageHeader: Tiêu đề Dashboard + Dropdown chọn khoảng thời gian (Tuần/Tháng)   │
│ [Khoảng cách 24px (mb-6)]                                                    │
│ Hàng Thẻ KPI (grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6):         │
│ ├─ Card 1: Tổng số (Số to 32px font-bold) + % Tăng trưởng (Badge xanh/đỏ)   │
│ ├─ Card 2: Hoàn thành                                                       │
│ ├─ Card 3: Đang chờ xử lý                                                   │
│ └─ Card 4: Quá hạn / Cần chú ý                                               │
│ [Khoảng cách 24px (mb-6)]                                                    │
│ Lưới Biểu đồ & Bảng tóm tắt (grid grid-cols-1 lg:grid-cols-2 gap-6):        │
│ ├─ Khung Biểu đồ (PageCard rounded-xl, p-6, min-h-[360px])                   │
│ └─ Khung Danh sách cần xử lý nhanh (Recent items, Table rút gọn)             │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **Bố cục & Khoảng cách (Metrics):**
   - Lưới thẻ chỉ số KPI: 4 cột đồng đều (`grid-cols-4`), khoảng cách `gap-6`.
   - Card KPI: bo góc `rounded-xl`, padding `p-6`, có icon nằm trong `<IconBox className="rounded-full size-12" />`.
   - Chiều cao khu vực biểu đồ tối thiểu: `360px`.
2. **Component sử dụng:**
   - `<PageCard />`, `<IconBox />` (`@/components/common/icon-box.tsx`), `<Badge className="rounded-full" />`.

---

### PATTERN 5: MODAL & DRAWER (POPUP PATTERN)
*Áp dụng cho:* Các tác vụ tạo nhanh, đổi trạng thái, phân công task, duyệt đơn từ.

1. **Quy định phân loại giữa Modal và Drawer:**
   - **Dùng Modal (Center Dialog):** Khi biểu mẫu ngắn (dưới 5 trường nhập), hộp thoại thông báo xác nhận hành động, hoặc chọn nhanh 1 đối tượng.
   - **Dùng Drawer (Sheet bên phải):** Khi cần xem chi tiết sâu của một dòng dữ liệu mà không muốn rời khỏi bảng hiện tại (ví dụ: Xem chi tiết Log bảo mật, Chi tiết Task công việc).
2. **Bố cục & Khoảng cách Modal:**
   - Độ rộng Modal: `max-w-lg` (512px) cho form vừa, `max-w-2xl` (672px) cho form lớn.
   - Bo góc Modal: Bắt buộc `rounded-xl`.
   - Padding trong: `p-6` (24px).
   - Nút chân Modal: Footer căn phải, nút `Hủy` (variant outline/ghost, `rounded-full`) đứng trước, nút `Xác nhận` (variant default, `rounded-full`) đứng sau. Khoảng cách giữa 2 nút: `gap-3` (12px).
3. **Component sử dụng:**
   - `<AppModal />` (`@/components/common/app-modal.tsx`)
   - `<AppDrawer />` (`@/components/common/app-drawer.tsx`)
   - Xác nhận xóa: Dùng hook chuẩn `const confirm = useConfirm()`.

---

## 2. Quy Tắc Đặt Nhãn Nút Bấm & Thông Điệp (Button Labeling Standard)

Để đảm bảo tính nhất quán trên toàn bộ 425 file giao diện, các nhãn nút và thông báo bắt buộc tuân theo quy tắc:

| Hành động | Nhãn tiếng Việt bắt buộc | Variant Button | Icon gợi ý |
|:---|:---|:---|:---|
| Tạo mới bản ghi | **Thêm [Tên đối tượng]** (ví dụ: *Thêm nhân viên*) | `default` | `Plus` |
| Lưu form nhập liệu | **Lưu thông tin** hoặc **Lưu thay đổi** | `default` | `Save` / `Check` |
| Hủy bỏ thao tác | **Hủy** | `outline` hoặc `ghost` | `X` |
| Xóa dữ liệu | **Xóa** | `destructive` | `Trash2` |
| Phê duyệt đơn/lương | **Phê duyệt** | `default` (bg-emerald-600) | `CheckCircle` |
| Từ chối phê duyệt | **Từ chối** | `destructive` | `XCircle` |
| Xuất dữ liệu | **Xuất Excel** hoặc **Xuất báo cáo** | `outline` | `Download` |
| Nhập dữ liệu | **Nhập dữ liệu** | `outline` | `Upload` |
| Lọc tìm kiếm | **Áp dụng** và **Đặt lại** | `default` / `ghost` | `Filter` / `RotateCcw` |

---

## 3. Hệ Thống Design Tokens (Theme Variables)

* **Font chữ:** `Inter Variable` cho toàn bộ UI; `Fira Code` cho mã số định danh (Employee Code, Requisition ID, UUID).
* **Bảng màu Semantic (Zero hardcode hex):**
  * `bg-background` / `text-foreground`: Nền chính ứng dụng và màu chữ đọc chính.
  * `bg-card` / `text-card-foreground`: Nền của PageCard, Modal, Dashboard Widget.
  * `bg-primary` / `text-primary-foreground`: Màu xanh chủ đạo cho nút hành động chính (`#2563eb`).
  * `bg-muted` / `text-muted-foreground`: Màu xám phụ cho mô tả, placeholder, header bảng (`#64748b`).
  * `border-border`: Màu viền chuẩn cho card, table separator, input (`#e2e8f0`).
  * `bg-destructive` / `text-destructive`: Màu đỏ cho hành động xóa, lỗi validate, từ chối duyệt (`#ef4444`).
  * `bg-emerald-500` / `text-emerald-700`: Trạng thái thành công, đã duyệt, đang hoạt động.
  * `bg-amber-500` / `text-amber-700`: Trạng thái đang chờ xử lý, cảnh báo.

---

## 4. Bảng Đánh Giá Hiện Trạng Kỹ Thuật (Đã Có / Cần Xây Mới / Cần Sửa)

| Hạng mục | Trạng thái | Chi tiết đối tượng | Hành động kỹ thuật cần thực hiện |
|:---|:---:|:---|:---|
| **Design Tokens** | **Đã có** | Biến màu semantic trong `index.css`, bo góc chuẩn The Pill Rule trong tailwind config. | Tiếp tục duy trì, không cần thêm token mới. |
| **Component Layout** | **Đã có** | `<PageHeader>`, `<PageCard>`, `<SectionHeader>`, `<StatRow>`. | Sử dụng làm khuôn bao bọc bắt buộc cho tất cả các màn hình. |
| **Component Table** | **Đã có** | `<DataTableToolbar>`, `<Table>`, `<StatusPill>`, `<AppPagination>`. | Đã hoàn thiện chuẩn tại `JobRequisitionsPage.tsx`. |
| **Component Modal/Drawer** | **Cần sửa** | `<AppModal>`, `<AppDrawer>`. | Hiện tại 45 file đang gọi trực tiếp `<Dialog>` thô; cần refactor dần về bọc qua `<AppModal>` để chuẩn hóa footer và bo góc. |
| **Component DatePicker** | **Cần xây mới** | `DatePicker` / `DateRangePicker` tập trung. | Dự án đang dùng `<input type="date">` HTML thô; cần tạo `@/components/common/date-picker.tsx` bọc Calendar + Popover có bo góc `rounded-full`. |
| **Component EmptyState** | **Cần sửa** | `<EmptyState />` (`components/common/empty-state.tsx`). | Đã có component nhưng mới có 3 trang dùng; cần thay thế các đoạn code viết tay `<tr><td className="text-center py-8">...</td></tr>` ở các bảng cũ. |
| **Rule / Linter** | **Cần sửa** | Quy chuẩn kiểm tra mã màu Hex. | Cần kích hoạt rule cấm commit mã màu hardcode trong các component tính năng. |

---

## 5. Danh Sách Màn Hình Đặc Thù Cần Quyết Định Riêng

Dưới đây là các màn hình có nghiệp vụ hiển thị vượt ra ngoài 5 khuôn mẫu trên:

1. **Bảng Chấm Công Ma Trận (`/attendance/timesheet`):**
   - *Đặc thù:* Bảng 2 chiều 31 ngày x N nhân viên.
   - *Cần xác nhận:* Có giữ nguyên cơ chế hiển thị ma trận ô vuông hiện tại với thanh cuộn ngang và cố định cột tên bên trái không?
2. **Biểu Đồ Gantt Dự Án (`/project/:id/gantt`):**
   - *Đặc thù:* Thanh trượt thời gian tính toán tọa độ pixel trực tiếp (`style={{ width, left }}`).
   - *Cần xác nhận:* Duy trì render Canvas/SVG tùy biến của Gantt chart hiện tại, chỉ chuẩn hóa thanh toolbar công cụ và popover xem chi tiết task.
3. **Project Capacity Board (`/project/capacity-board`):**
   - *Đặc thù:* Bảng nhiệt hiển thị % quá tải/thiếu tải công việc của nhân sự theo tuần.
   - *Cần xác nhận:* Giữ nguyên dạng ma trận tiến độ workload.
4. **Phân Quyền Vai Trò (`/settings/role-permissions`):**
   - *Đặc thù:* Ma trận phân quyền checkbox đa tầng.
   - *Cần xác nhận:* Giữ nguyên dạng ma trận checkbox có nút "Chọn tất cả cột/dòng".

---

## 6. Mục "Tuân Thủ Rule" (Compliance Verification)

* **Các Rule Đã Áp Dụng Triệt Để:**
  - **The Pill Rule:** 100% Buttons, Inputs, Badges và Select Triggers trong tài liệu này đều quy định bo góc tròn `rounded-full`.
  - **Token-Only Rule:** 100% quy định màu sắc đều sử dụng tên token chuẩn (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `bg-card`).
  - **Giữ Nguyên Module:** Không thêm, bớt hoặc đổi tên bất kỳ route/phân hệ nào của DevCore ERP.
* **Hạng mục Cần Xác Nhận Thêm:**
  - *Tương tác DateRangePicker trên di động:* Trong tài liệu này tạm thời quy định DatePicker trên mobile mở dạng modal sheet đáy màn hình; phần này đánh dấu **Cần xác nhận** thêm khi triển khai thực tế.
