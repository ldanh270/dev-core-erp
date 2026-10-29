import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGeneratePayroll } from "@/hooks/payroll/use-payrolls"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const generatePayrollSchema = z.object({
  month: z.string().min(1, "Month is required"),
  year: z.string().min(1, "Year is required"),
  name: z.string().optional(),
})

type GeneratePayrollFormData = z.infer<typeof generatePayrollSchema>

export function GeneratePayrollModal() {
  const [open, setOpen] = useState(false)
  const { mutateAsync: generatePayroll, isPending } = useGeneratePayroll()

  const currentYear = new Date().getFullYear()
  const currentMonth = (new Date().getMonth() + 1).toString()

  const form = useForm<GeneratePayrollFormData>({
    resolver: zodResolver(generatePayrollSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear.toString(),
      name: "",
    },
  })

  const onSubmit = async (data: GeneratePayrollFormData) => {
    try {
      await generatePayroll({
        month: parseInt(data.month, 10),
        year: parseInt(data.year, 10),
        name: data.name?.trim() || undefined,
      })
      setOpen(false)
      form.reset()
    } catch {
      // Error handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <CalendarDays className="w-4 h-4 mr-2" />
          Generate Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-8 border border-border bg-background shadow-none rounded-xl gap-0">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-serif text-2xl tracking-tight text-foreground">
            Generate Payroll
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground mt-2">
            Select the month and year to generate the payroll for all active employees. You can provide a custom name for mid-month payrolls.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Month</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-full border-border h-11 bg-card shadow-none focus:ring-1 focus:ring-primary">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-border rounded-xl shadow-sm">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem 
                            key={m} 
                            value={m.toString()}
                            className="rounded-lg cursor-pointer focus:bg-muted"
                          >
                            Month {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-full border-border h-11 bg-card shadow-none focus:ring-1 focus:ring-primary">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-border rounded-xl shadow-sm">
                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                          <SelectItem 
                            key={y} 
                            value={y.toString()}
                            className="rounded-lg cursor-pointer focus:bg-muted"
                          >
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Payroll Name (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={`e.g. Bảng lương tháng ${form.watch("month")}/${form.watch("year")}`} 
                      className="rounded-full border-border h-11 bg-card focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-border text-foreground hover:bg-accent"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[0.98] transition-transform shadow-none" 
                disabled={isPending}
              >
                {isPending ? "Generating..." : "Generate"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
