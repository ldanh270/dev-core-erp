import { expect, test } from "@playwright/test"

test("removes /settings/database route from rendering Database Schema Reference", async ({
  page,
}) => {
  await page.goto("/settings/database")
  await expect(page.getByRole("heading", { name: "Database Schema Reference" })).toHaveCount(0)
})

test("lists schema tables first and opens generated table details", async ({ page }) => {
  await page.goto("/database")

  await expect(page.getByRole("heading", { name: "Database Schema Reference" })).toBeVisible()
  await expect(page.getByText(/Tra cứu cấu trúc dữ liệu từ/)).toHaveCount(0)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByRole("tab", { name: /Enums/ })).toHaveCount(0)
  await expect(page.getByText("Prisma PostgreSQL")).toHaveCount(0)
  await expect(page.getByText(/Generated 2026-/)).toHaveCount(0)
  await expect(page.getByRole("columnheader", { name: "Quan hệ liên kết" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Cấu trúc" })).toHaveCount(0)
  await expect(page.getByRole("columnheader", { name: "Chi tiết" })).toHaveCount(0)
  const toolbar = page.getByTestId("database-schema-toolbar")
  const tabsBounds = await toolbar.getByRole("tab", { name: "Danh sách bảng" }).boundingBox()
  const tableStatBounds = await toolbar.getByText("75", { exact: true }).boundingBox()
  const erpButtonBounds = await toolbar.getByRole("link", { name: "Vào ERP" }).boundingBox()
  expect(tabsBounds).not.toBeNull()
  expect(tableStatBounds).not.toBeNull()
  expect(erpButtonBounds).not.toBeNull()
  const tabsCenter = (tabsBounds?.y ?? 0) + (tabsBounds?.height ?? 0) / 2
  const statCenter = (tableStatBounds?.y ?? 0) + (tableStatBounds?.height ?? 0) / 2
  const erpCenter = (erpButtonBounds?.y ?? 0) + (erpButtonBounds?.height ?? 0) / 2
  expect(Math.abs(tabsCenter - statCenter)).toBeLessThan(8)
  expect(Math.abs(statCenter - erpCenter)).toBeLessThan(8)

  await page.getByPlaceholder("Tìm model, bảng, cột, kiểu dữ liệu hoặc mô tả...").fill("on_leave")
  const employeeRow = page.getByRole("row").filter({ hasText: "Employee" }).first()
  await expect(employeeRow).toContainText("→")
  await expect(employeeRow).toContainText("←")
  await page.getByRole("button", { name: "Xem chi tiết bảng Employee", exact: true }).click()

  const sheet = page.getByRole("dialog")
  await expect(sheet).toBeVisible()
  await expect(sheet.getByText("Nguồn dữ liệu")).toHaveCount(0)
  await expect(sheet.getByText("Model: Employee · Database table: Employee")).toBeVisible()
  await expect(sheet.getByRole("columnheader", { name: "Tên cột" })).toBeVisible()
  await expect(sheet.getByText("id", { exact: true }).first()).toBeVisible()
  await expect(sheet.getByRole("heading", { name: /Chỉ Mục & Khóa \(Indexes - 8\)/ })).toBeVisible()
  await expect(sheet.getByRole("columnheader", { name: "Tên chỉ mục" })).toBeVisible()
  await expect(sheet.getByRole("columnheader", { name: "Các cột tham gia" })).toBeVisible()
  await expect(sheet.getByRole("columnheader", { name: "Loại Index" })).toBeVisible()
  await expect(sheet.getByText("IX_Employee_email", { exact: true })).toBeVisible()
  await expect(sheet.getByText("PK_Employee", { exact: true })).toBeVisible()
  const enumField = sheet.getByRole("row").filter({ hasText: "Enum: EmployeeStatus" })
  await expect(enumField).toContainText("on_leave")
  await expect(enumField).toContainText("active")

  await sheet.getByRole("button", { name: "Xem trên ERD" }).click()
  await expect(sheet).toHaveCount(0)
  await page.getByPlaceholder("Tìm model, bảng, cột, kiểu dữ liệu hoặc mô tả...").fill("")
  await expect(
    page.getByRole("button", { name: "Xem chi tiết bảng EmployeeContract", exact: true }),
  ).toBeVisible()
})

test("ERD filters modules, toggles cross-module relations, and supports fullscreen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/database")
  await page.getByRole("tab", { name: "Sơ đồ ERD" }).click()

  const erd = page.getByRole("region", { name: "Sơ đồ quan hệ cơ sở dữ liệu" })
  const viewport = erd.getByTestId("database-erd-viewport")
  const erdBounds = await erd.boundingBox()
  expect(erdBounds?.height).toBeGreaterThan(720)

  const zoomLabel = erd.getByText(/^\d+%$/)
  const initialZoom = Number((await zoomLabel.textContent())?.replace("%", ""))
  const initialGridSize = await viewport.evaluate(
    (element) => window.getComputedStyle(element).backgroundSize,
  )
  const wheelPrevented = await viewport.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
      deltaY: -120,
    })
    element.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(wheelPrevented).toBe(true)
  await expect
    .poll(async () => Number((await zoomLabel.textContent())?.replace("%", "")))
    .toBeGreaterThan(initialZoom)
  await expect
    .poll(() => viewport.evaluate((element) => window.getComputedStyle(element).backgroundSize))
    .toBe(initialGridSize)
  await expect
    .poll(() => viewport.evaluate((element) => window.getComputedStyle(element).backgroundImage))
    .toContain("radial-gradient")

  const moduleSelect = page.getByRole("combobox", { name: "Phân hệ" })
  await moduleSelect.click()
  await page.getByRole("option", { name: /Chấm công/ }).click()

  const externalEmployeeNode = erd.getByRole("button", {
    name: "Xem chi tiết bảng Employee",
    exact: true,
  })
  const swapDetailNode = erd.getByRole("button", {
    name: "Xem chi tiết bảng ApplicationShiftSwapDetail",
    exact: true,
  })
  const applicationNode = erd.getByRole("button", {
    name: "Xem chi tiết bảng Application",
    exact: true,
  })
  const crossModuleSwitch = erd.getByRole("switch", { name: "Hiển thị khóa ngoại liên phân hệ" })

  await expect(externalEmployeeNode).toBeVisible()
  await expect(applicationNode).toHaveAttribute("data-erd-role", "primary")
  await expect(swapDetailNode).toHaveAttribute("data-erd-role", "foreign-key")
  await expect(swapDetailNode).toContainText("applicationId")
  await expect(swapDetailNode).toContainText("swapWithEmployeeId")
  await expect(swapDetailNode).toContainText("swapWithShiftId")
  await expect(swapDetailNode).toContainText("→ Application")
  await crossModuleSwitch.click()
  await expect(externalEmployeeNode).toHaveCount(0)
  await crossModuleSwitch.click()
  await expect(externalEmployeeNode).toBeVisible()
  await expect(externalEmployeeNode).toHaveClass(/border-dashed/)
  const crossModuleRelation = viewport.locator('path[data-cross-module="true"]').first()
  await expect(crossModuleRelation).toHaveClass(/stroke-dasharray/)
  await expect(crossModuleRelation).toHaveClass(/stroke-primary/)
  const relationPath = await crossModuleRelation.getAttribute("d")
  expect(relationPath).toMatch(/^M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+$/)

  const employeeBounds = await externalEmployeeNode.boundingBox()
  if (!employeeBounds) throw new Error("Employee ERD node is not visible for drag test")
  const start = {
    x: employeeBounds.x + employeeBounds.width / 2,
    y: employeeBounds.y + employeeBounds.height / 2,
  }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x - 45, start.y + 20, { steps: 6 })
  await page.mouse.up()
  await expect
    .poll(() =>
      externalEmployeeNode.evaluate((node) => Number.parseFloat((node as HTMLElement).style.left)),
    )
    .toBeLessThan(0)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await externalEmployeeNode.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)

  const zoomBeforeFullscreen = Number((await zoomLabel.textContent())?.replace("%", ""))
  await erd.getByRole("button", { name: "Mở toàn màn hình" }).click()
  await expect(erd).toHaveClass(/fixed/)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.fullscreenElement?.getAttribute("aria-label") ===
          "Sơ đồ quan hệ cơ sở dữ liệu",
      ),
    )
    .toBe(true)
  await expect
    .poll(async () => Number((await zoomLabel.textContent())?.replace("%", "")))
    .toBeGreaterThan(zoomBeforeFullscreen)
  await page.keyboard.press("Escape")
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true)
  await expect(erd).not.toHaveClass(/fixed/)
  await erd.getByRole("button", { name: "Sắp xếp lại" }).click()
  await erd.getByRole("button", { name: "Fit màn hình" }).click()
})

test("V9 shows table details above a fullscreen ERD", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/database")
  await page.getByRole("tab", { name: "Sơ đồ ERD" }).click()

  const erd = page.getByRole("region", { name: "Sơ đồ quan hệ cơ sở dữ liệu" })
  await erd.getByRole("button", { name: "Mở toàn màn hình" }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.fullscreenElement?.getAttribute("aria-label") ===
          "Sơ đồ quan hệ cơ sở dữ liệu",
      ),
    )
    .toBe(true)
  await erd.getByRole("button", { name: /^Xem chi tiết bảng / }).first().click()

  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true)
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("columnheader", { name: "Tên cột" })).toBeVisible()
})
