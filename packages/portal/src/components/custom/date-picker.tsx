'use client';

import { useTranslations } from 'next-intl';
import * as React from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  selected: Date | undefined;
  onChange?: (date: Date) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  selected,
  onChange,
  className,
  placeholder,
  disabled,
}: DatePickerProps) {
  const t = useTranslations('common');
  const [date, setDate] = React.useState<Date | undefined>(selected);

  React.useEffect(() => {
    setDate(selected);
  }, [selected]);

  const handleSelect = (newDate: Date) => {
    setDate(newDate);
    if (onChange) onChange(newDate);
  };

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          data-empty={!date}
          className={cn(
            'data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal shadow-xs transition-[color,box-shadow] hover:bg-transparent',
            className
          )}
        >
          <CalendarIcon />
          {date ? (
            format(date, 'dd-MM-yyyy')
          ) : (
            <span>{placeholder || t('pickDate')}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent forceMount className="w-auto p-0 z-[9999]">
        <Calendar
          mode="single"
          required={true}
          selected={date}
          captionLayout="dropdown"
          onSelect={handleSelect}
          disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
        />
      </PopoverContent>
    </Popover>
  );
}
