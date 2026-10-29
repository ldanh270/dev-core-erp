import { FormActionFooter } from "@/components/common/form-action-footer"
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useShifts } from "@/hooks/attendance/use-shifts"
import { useSubmitShiftChangeRequest } from "@/hooks/attendance/use-shift-change-requests"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { cn } from "@/lib/utils"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Check, ChevronsUpDown, MessageSquare, Repeat, Search } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
  startDate: z.string().min(1, "Please select a date"),
  employeeShiftId: z.string().min(1, "Select current shift"),
  swapWithEmployeeId: z.string().min(1, "Select colleague to swap with"),
  swapWithShiftId: z.string().min(1, "Select target shift"),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Component that displays a dialog to submit a shift change request with a colleague.
 * @param props - Component properties including open state and onOpenChange handler.
 */
export function ShiftChangeRequestDialog({ open, onOpenChange }: Props) {
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      startDate: "",
      employeeShiftId: "",
      swapWithEmployeeId: "",
      swapWithShiftId: "",
    },
  })

  /**
   * useShifts - Hook to fetch the list of available working shifts.
   * Calls API: shiftsApi.getAll
   */
  const { data: shifts } = useShifts()

  /**
   * useEmployees - Hook to fetch the list of employees with search functionality.
   * Limit is set to 10 for performance optimization, combined with server-side search.
   * Calls API: employeeApi.list
   */
  const { data: employeeData, isLoading: isLoadingEmployees } = useEmployees({ 
    page: 1, 
    limit: 10,
    search: employeeSearch 
  })
  
  const mutation = useSubmitShiftChangeRequest()

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover rounded-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Submit Shift Change Request</DialogTitle>
          <DialogDescription>
            Propose a shift change with a colleague. Requests require manager approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left Column: Date & Current Shift */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                  <Calendar size={16} />
                  <span>Schedule</span>
                </div>

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || null}
                          onChange={(val) => field.onChange(val || "")}
                          placeholder="Chọn ngày ca làm..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeShiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Current Shift <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full border-border h-11 bg-muted/30 shadow-none">
                            <SelectValue placeholder="-- Select your shift --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-xl">
                          {shifts?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column: Swap Partner & Target Shift */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                  <Repeat size={16} />
                  <span>Swap Details</span>
                </div>

                <FormField
                  control={form.control}
                  name="swapWithEmployeeId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Swap with Colleague <span className="text-destructive">*</span></FormLabel>
                      <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between rounded-2xl border-border h-11 bg-muted/30 shadow-none font-normal px-3",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? employeeData?.data.find((emp) => emp.id === field.value)?.fullName || "Selected Employee"
                                : "-- Select colleague --"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Search employee name..."
                              value={employeeSearch}
                              onChange={(e) => { setEmployeeSearch(e.target.value) }}
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto p-1">
                            {isLoadingEmployees ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                            ) : employeeData?.data.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">No employee found.</div>
                            ) : (
                              employeeData?.data.map((emp) => (
                                <div
                                  key={emp.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    field.value === emp.id && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => {
                                    form.setValue("swapWithEmployeeId", emp.id);
                                    setEmployeePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === emp.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {emp.fullName} ({emp.username})
                                </div>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="swapWithShiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Shift <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full border-border h-11 bg-muted/30 shadow-none">
                            <SelectValue placeholder="-- Select target shift --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-xl">
                          {shifts?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <MessageSquare size={16} />
                <span>Reason Details</span>
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Request <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Personal business, swapping to visit doctor..."
                        className="resize-none min-h-24 rounded-2xl p-4 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormActionFooter 
              onCancel={() => { onOpenChange(false); }}
              submitLabel="Submit Request"
              isPending={mutation.isPending}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShiftChangeRequestDialog
