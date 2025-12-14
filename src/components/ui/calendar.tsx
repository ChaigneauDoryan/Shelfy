"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Import Input component

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  showTime?: boolean; // New prop to control time selection
} & Omit<React.ComponentProps<typeof DayPicker>, 'selected' | 'onSelect' | 'mode'>;

function Calendar({
  className,
  classNames,
  selected,
  onSelect,
  showTime = false, // Default to false
  ...props
}: CalendarProps) {
  const [hour, setHour] = React.useState(selected?.getHours() || 0);
  const [minute, setMinute] = React.useState(selected?.getMinutes() || 0);

  React.useEffect(() => {
    if (selected) {
      setHour(selected.getHours());
      setMinute(selected.getMinutes());
    }
  }, [selected]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && showTime) {
      date.setHours(hour);
      date.setMinutes(minute);
    }
    onSelect?.(date);
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    let newDate = selected ? new Date(selected) : new Date();

    if (type === 'hour') {
      setHour(numValue);
      newDate.setHours(numValue);
    } else {
      setMinute(numValue);
      newDate.setMinutes(numValue);
    }
    onSelect?.(newDate);
  };

  return (
    <div className={cn("p-3", className)}>
      <DayPicker
        mode="single" // Added this prop
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        selected={selected}
        onSelect={handleDateSelect}
        {...props}
      />
      {showTime && (
        <div className="flex items-center justify-center mt-4 space-x-2">
          <Input
            type="number"
            min="0"
            max="23"
            value={hour.toString().padStart(2, '0')}
            onChange={(e) => handleTimeChange('hour', e.target.value)}
            className="w-16 text-center"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={minute.toString().padStart(2, '0')}
            onChange={(e) => handleTimeChange('minute', e.target.value)}
            className="w-16 text-center"
          />
        </div>
      )}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }