import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Calendar,
  Globe,
  Zap,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';

export interface CampaignSchedulingState {
  sendMode: 'now' | 'schedule';
  scheduledAt?: Date;
  timezone: string;
  staggerHours: number;
  businessHoursOnly: boolean;
}

export interface CampaignSchedulingProps {
  targetCount?: number;
  value?: CampaignSchedulingState;
  onChange?: (state: CampaignSchedulingState) => void;
}

// Common timezones with UTC offsets
const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (BRT)', offset: 'UTC-3' },
  { value: 'America/New_York', label: 'Eastern (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)', offset: 'UTC-8' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (CST)', offset: 'UTC-6' },
  { value: 'America/Bogota', label: 'Bogotá (COT)', offset: 'UTC-5' },
  { value: 'America/Santiago', label: 'Santiago (CLT)', offset: 'UTC-4' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 'UTC+1' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', offset: 'UTC+1' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'UTC+8' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: 'UTC+12' },
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(date);
}

export default function CampaignScheduling({
  targetCount = 0,
  value,
  onChange,
}: CampaignSchedulingProps) {
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>(value?.sendMode || 'now');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(
    value?.scheduledAt || null
  );
  const [selectedTime, setSelectedTime] = useState({ hours: 9, minutes: 0 });
  const [timezone, setTimezone] = useState(value?.timezone || 'America/Sao_Paulo);
  const [staggerHours, setStaggerHours] = useState(value?.staggerHours || 24);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(value?.businessHoursOnly || false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  // Calculate estimated send time
  const estimatedSendTime = useMemo(() => {
    if (sendMode === 'now' && targetCount > 0) {
      // Assume 100 emails per minute for estimation
      const minutes = Math.ceil(targetCount / 100);
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      return now;
    }
    return null;
  }, [sendMode, targetCount]);

  // Calculate send rate
  const sendRate = useMemo(() => {
    if (staggerHours > 0 && targetCount > 0) {
      return Math.round(targetCount / staggerHours);
    }
    return 0;
  }, [staggerHours, targetCount]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Handlers
  const handleSendModeChange = useCallback((mode: 'now' | 'schedule') => {
    setSendMode(mode);
    onChange?.({
      sendMode: mode,
      scheduledAt: mode === 'schedule' ? scheduledDate || undefined : undefined,
      timezone,
      staggerHours,
      businessHoursOnly,
    });
  }, [scheduledDate, timezone, staggerHours, businessHoursOnly, onChange]);

  const handleDateSelect = useCallback((day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setScheduledDate(newDate);
    const combinedDate = new Date(
      currentYear,
      currentMonth,
      day,
      selectedTime.hours,
      selectedTime.minutes
    );
    onChange?.({
      sendMode,
      scheduledAt: combinedDate,
      timezone,
      staggerHours,
      businessHoursOnly,
    });
  }, [currentYear, currentMonth, selectedTime, sendMode, timezone, staggerHours, businessHoursOnly, onChange]);

  const handleTimeChange = useCallback((type: 'hours' | 'minutes', value: number) => {
    const newTime = { ...selectedTime, [type]: value };
    setSelectedTime(newTime);

    if (scheduledDate) {
      const combinedDate = new Date(
        scheduledDate.getFullYear(),
        scheduledDate.getMonth(),
        scheduledDate.getDate(),
        newTime.hours,
        newTime.minutes
      );
      setScheduledDate(combinedDate);
      onChange?.({
        sendMode,
        scheduledAt: combinedDate,
        timezone,
        staggerHours,
        businessHoursOnly,
      });
    }
  }, [scheduledDate, sendMode, timezone, staggerHours, businessHoursOnly, onChange]);

  const handleTimezoneChange = useCallback((tz: string) => {
    setTimezone(tz);
    if (scheduledDate) {
      onChange?.({
        sendMode,
        scheduledAt: scheduledDate,
        timezone: tz,
        staggerHours,
        businessHoursOnly,
      });
    } else {
      onChange?.({
        sendMode,
        scheduledAt: undefined,
        timezone: tz,
        staggerHours,
        businessHoursOnly,
      });
    }
  }, [scheduledDate, sendMode, staggerHours, businessHoursOnly, onChange]);

  const handleStaggerChange = useCallback((hours: number) => {
    setStaggerHours(hours);
    onChange?.({
      sendMode,
      scheduledAt: scheduledDate || undefined,
      timezone,
      staggerHours: hours,
      businessHoursOnly,
    });
  }, [scheduledDate, sendMode, timezone, businessHoursOnly, onChange]);

  const handleBusinessHoursToggle = useCallback((enabled: boolean) => {
    setBusinessHoursOnly(enabled);
    onChange?.({
      sendMode,
      scheduledAt: scheduledDate || undefined,
      timezone,
      staggerHours,
      businessHoursOnly: enabled,
    });
  }, [scheduledDate, sendMode, timezone, staggerHours, onChange]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const selectedTimezone = TIMEZONES.find(tz => tz.value === timezone);

  // Check if selected date is weekend
  const isWeekendWarning = scheduledDate && businessHoursOnly && isWeekend(scheduledDate);

  return (
    <div className="space-y-6">
      {/* Send Mode Toggle */}
      <div className="space-y-3">
        <Label className="text-[var(--color-fg-secondary)]">Modo de envio:</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Enviar agora */}
          <button
            type="button"
            onClick={() => handleSendModeChange('now')}
            className={cn(
              'flex items-start gap-4 rounded-[var(--radius-lg)] border p-4 transition-all duration-200',
              sendMode === 'now'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[0_0_20px_rgba(217,119,87,0.15)]'
                : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
            )}
          >
            <div className={cn(
              'grid h-12 w-12 shrink-0 place-items-center rounded-xl',
              sendMode === 'now' ? 'bg-[var(--color-accent)]/20' : 'bg-green-500/10'
            )}>
              <Zap className={cn(
                'h-6 w-6',
                sendMode === 'now' ? 'text-[var(--color-accent)]' : 'text-green-400'
              )} />
            </div>
            <div className="text-left">
              <p className="font-display font-semibold text-[var(--color-fg-primary)]">Enviar agora</p>
              <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                Iniciar envio imediatamente
              </p>
            </div>
          </button>

          {/* Agendar */}
          <button
            type="button"
            onClick={() => handleSendModeChange('schedule')}
            className={cn(
              'flex items-start gap-4 rounded-[var(--radius-lg)] border p-4 transition-all duration-200',
              sendMode === 'schedule'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[0_0_20px_rgba(217,119,87,0.15)]'
                : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
            )}
          >
            <div className={cn(
              'grid h-12 w-12 shrink-0 place-items-center rounded-xl',
              sendMode === 'schedule' ? 'bg-[var(--color-accent)]/20' : 'bg-amber-500/10'
            )}>
              <Calendar className={cn(
                'h-6 w-6',
                sendMode === 'schedule' ? 'text-[var(--color-accent)]' : 'text-amber-400'
              )} />
            </div>
            <div className="text-left">
              <p className="font-display font-semibold text-[var(--color-fg-primary)]">Agendar</p>
              <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                Definir data e horário
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Now mode: Estimated time */}
      {sendMode === 'now' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {targetCount > 0 && estimatedSendTime && (
            <div className={cn(
              'rounded-[var(--radius-lg)] border p-5',
              'border-[var(--color-noir-700)] bg-[var(--color-surface-2)]',
              'flex items-start gap-4'
            )}>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-500/10">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--color-fg-primary)]">
                  Tempo estimado de envio
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                  {targetCount.toLocaleString('pt-BR')} emails serão enviados em aproximadamente{' '}
                  <span className="font-semibold text-[var(--color-accent)]">
                    {Math.ceil(targetCount / 100)} minutos
                  </span>
                </p>
                <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                  Previsão de conclusão: {formatDate(estimatedSendTime, timezone)}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              console.log('Starting immediate send for', targetCount, 'targets');
            }}
          >
            <Send className="h-4 w-4" />
            Iniciar envio imediatamente
          </Button>
        </motion.div>
      )}

      {/* Schedule mode */}
      {sendMode === 'schedule' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Calendar Grid */}
          <div className={cn(
            'rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-5',
            'overflow-hidden'
          )}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
              </button>
              <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map(day => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-[var(--color-fg-muted)]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-10" />;
                }

                const date = new Date(currentYear, currentMonth, day);
                const isSelected = scheduledDate && isSameDay(date, scheduledDate);
                const isToday = isSameDay(date, new Date());
                const isWeekendDay = isWeekend(date);
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                    className={cn(
                      'relative h-10 rounded-lg text-sm font-medium transition-all duration-200',
                      'hover:enabled:bg-[var(--color-surface-3)]',
                      isSelected && 'bg-[var(--color-accent)] text-[var(--color-surface-0)]',
                      !isSelected && isToday && 'border border-[var(--color-accent)] text-[var(--color-accent)]',
                      !isSelected && !isToday && 'text-[var(--color-fg-secondary)]',
                      isPast && 'opacity-30 cursor-not-allowed',
                      isWeekendDay && !isSelected && 'text-[var(--color-fg-muted)]'
                    )}
                  >
                    {day}
                    {isWeekendDay && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0.5 rounded-full bg-[var(--color-fg-muted)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-[var(--color-fg-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                <span>Selecionado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-[var(--color-accent)]" />
                <span>Hoje</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-0.5 rounded-full bg-[var(--color-fg-muted)]" />
                <span>Fim de semana</span>
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-3">
            <Label className="text-[var(--color-fg-secondary)]">Horário:</Label>
            <div className="flex items-center gap-3">
              {/* Hours */}
              <div className="relative">
                <select
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                  className={cn(
                    'h-14 w-24 appearance-none rounded-[var(--radius-lg)] border border-[var(--color-noir-700)]',
                    'bg-[var(--color-surface-2)] pl-4 pr-10 text-center text-lg font-display font-semibold',
                    'text-[var(--color-fg-primary)]',
                    'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30',
                    'cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors'
                  )}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronDown className="h-4 w-4 text-[var(--color-fg-muted)]" />
                </div>
              </div>

              <span className="text-xl font-display font-bold text-[var(--color-fg-tertiary)]">:</span>

              {/* Minutes */}
              <div className="relative">
                <select
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                  className={cn(
                    'h-14 w-24 appearance-none rounded-[var(--radius-lg)] border border-[var(--color-noir-700)]',
                    'bg-[var(--color-surface-2)] pl-4 pr-10 text-center text-lg font-display font-semibold',
                    'text-[var(--color-fg-primary)]',
                    'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30',
                    'cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors'
                  )}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronDown className="h-4 w-4 text-[var(--color-fg-muted)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="space-y-3">
            <Label className="text-[var(--color-fg-secondary)]">Fuso horário:</Label>
            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--color-fg-muted)]" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{tz.label}</span>
                      <span className="text-xs text-[var(--color-fg-muted)]">{tz.offset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTimezone && (
              <p className="text-xs text-[var(--color-fg-muted)]">
                Horário local: {formatDate(new Date(), timezone).split(',')[1]?.trim() || new Date().toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>

          {/* Scheduled summary */}
          {scheduledDate && (
            <div className={cn(
              'rounded-[var(--radius-md)] border p-4',
              'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5'
            )}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                  <Clock className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                    Agendado para:
                  </p>
                  <p className="font-display font-semibold text-[var(--color-accent)]">
                    {formatDate(
                      new Date(
                        scheduledDate.getFullYear(),
                        scheduledDate.getMonth(),
                        scheduledDate.getDate(),
                        selectedTime.hours,
                        selectedTime.minutes
                      ),
                      timezone
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Staggered Sending */}
      <div className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-5',
        'space-y-4'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-fg-primary)]">Espalhar ao longo de X horas</p>
              <p className="text-sm text-[var(--color-fg-tertiary)]">
                Distribuir envios para evitar pico
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={48}
              value={staggerHours}
              onChange={(e) => handleStaggerChange(Math.min(48, Math.max(1, parseInt(e.target.value) || 1)))}
              className={cn(
                'h-10 w-20 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-3)]',
                'px-3 text-center font-mono text-sm font-medium text-[var(--color-fg-primary)]',
                'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30'
              )}
            />
            <span className="text-sm text-[var(--color-fg-muted)]">horas</span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={48}
            value={staggerHours}
            onChange={(e) => handleStaggerChange(parseInt(e.target.value))}
            className={cn(
              'h-2 w-full cursor-pointer appearance-none rounded-full',
              '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)]',
              '[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(217,119,87,0.5)] [&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
              '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none',
              '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-accent)]',
              '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(217,119,87,0.5)]'
            )}
            style={{
              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((staggerHours - 1) / 47) * 100}%, var(--color-noir-700) ${((staggerHours - 1) / 47) * 100}%, var(--color-noir-700) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-[var(--color-fg-muted)]">
            <span>1h</span>
            <span>24h</span>
            <span>48h</span>
          </div>
        </div>

        {/* Info */}
        {targetCount > 0 && (
          <div className={cn(
            'rounded-[var(--radius-md)] border border-[var(--color-noir-700)] p-3',
            'flex items-center justify-between bg-[var(--color-surface-3)]'
          )}>
            <div>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Emails serão enviados uniformemente ao longo de <span className="font-semibold text-[var(--color-fg-primary)]">{staggerHours} horas</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-[var(--color-accent)]">
                {sendRate}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)]">emails/hora</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Hours Toggle */}
      <div className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-5',
        'space-y-4'
      )}>
        <label className="flex items-start gap-4 cursor-pointer">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={businessHoursOnly}
              onChange={(e) => handleBusinessHoursToggle(e.target.checked)}
              className="peer sr-only"
            />
            <div className={cn(
              'h-6 w-11 rounded-full transition-colors duration-200',
              businessHoursOnly ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-noir-700)]'
            )} />
            <div className={cn(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--color-fg-primary)] shadow-md transition-transform duration-200',
              businessHoursOnly && 'translate-x-5'
            )} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[var(--color-fg-primary)]">Apenas em dias úteis</p>
            <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
              Pausar envio durante finais de semana
            </p>
          </div>
        </label>

        {/* Weekend Warning */}
        {isWeekendWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 p-4',
              'flex items-start gap-3'
            )}
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">Aviso: Final de semana selecionado</p>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                O envio será pausado no sábado e domingo. Os emails serão retomados na segunda-feira.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}