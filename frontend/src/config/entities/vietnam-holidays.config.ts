import type { IHolidayType } from "@/config/entities/attendance.config"

const VIETNAM_FIXED_HOLIDAYS = [
  { monthDay: "01-01", name: "Tết Dương lịch" },
  { monthDay: "04-30", name: "Ngày Giải phóng miền Nam" },
  { monthDay: "05-01", name: "Ngày Quốc tế Lao động" },
  { monthDay: "09-02", name: "Ngày Quốc khánh" },
] as const

const VIETNAM_LUNAR_HOLIDAYS_BY_YEAR = new Map<number, readonly { date: string; name: string }[]>([
  [
    2026,
    [
      { date: "2026-02-16", name: "Nghỉ Tết Nguyên đán" },
      { date: "2026-02-17", name: "Mùng 1 Tết Nguyên đán" },
      { date: "2026-02-18", name: "Mùng 2 Tết Nguyên đán" },
      { date: "2026-02-19", name: "Mùng 3 Tết Nguyên đán" },
      { date: "2026-02-20", name: "Nghỉ Tết Nguyên đán" },
      { date: "2026-04-26", name: "Giỗ Tổ Hùng Vương" },
    ],
  ],
])

export interface IVietnamHoliday {
  date: string
  name: string
  type: IHolidayType
  description: string
}

export function getVietnamHolidays(year: number): IVietnamHoliday[] {
  const fixedHolidays = VIETNAM_FIXED_HOLIDAYS.map((holiday) => ({
    date: `${year}-${holiday.monthDay}`,
    name: holiday.name,
    type: "national" as const,
    description: "Nhân viên được nghỉ lễ",
  }))

  const lunarHolidays = (VIETNAM_LUNAR_HOLIDAYS_BY_YEAR.get(year) ?? []).map((holiday) => ({
    date: holiday.date,
    name: holiday.name,
    type: "national" as const,
    description: "Nhân viên được nghỉ lễ",
  }))

  return [...fixedHolidays, ...lunarHolidays].toSorted((a, b) => a.date.localeCompare(b.date))
}

export function getVietnamHolidayByDate(date: string): IVietnamHoliday | undefined {
  const year = Number(date.slice(0, 4))

  return getVietnamHolidays(year).find((holiday) => holiday.date === date)
}
