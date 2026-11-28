import { PayrollCycleForm } from "@/components/features/payroll/PayrollCycleForm"
import { PayrollCycleSkeleton } from "@/components/features/payroll/PayrollCycleSkeleton"
import { usePayrollSettings } from "@/hooks/payroll/use-payroll-settings"

/**
 * PayrollCycle page component
 * Thin declarative shell orchestrating payroll cycle settings
 */
export default function PayrollCycle() {
  const { data: settings, isLoading: isSettingsLoading } = usePayrollSettings()

  if (isSettingsLoading || !settings) {
    return <PayrollCycleSkeleton />
  }

  return <PayrollCycleForm settings={settings} />
}
