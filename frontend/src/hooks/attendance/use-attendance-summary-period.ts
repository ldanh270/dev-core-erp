import { useCallback, useState } from "react"

export interface UseAttendanceSummaryPeriodReturn {
  year: number
  month: number
  setYear: React.Dispatch<React.SetStateAction<number>>
  setMonth: React.Dispatch<React.SetStateAction<number>>
  goToPrev: () => void
  goToNext: () => void
}

/**
 * Custom hook to manage attendance summary month and year navigation.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useAttendanceSummaryPeriod(): UseAttendanceSummaryPeriodReturn {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const goToPrev = useCallback(() => {
    setMonth((currentMonth) => {
      if (currentMonth === 0) {
        setYear((currentYear) => currentYear - 1)
        return 11
      }
      return currentMonth - 1
    })
  }, [setYear])

  const goToNext = useCallback(() => {
    setMonth((currentMonth) => {
      if (currentMonth === 11) {
        setYear((currentYear) => currentYear + 1)
        return 0
      }
      return currentMonth + 1
    })
  }, [setYear])

  return {
    year,
    month,
    setYear,
    setMonth,
    goToPrev,
    goToNext,
  }
}
