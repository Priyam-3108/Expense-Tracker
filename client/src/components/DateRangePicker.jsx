import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

// Pure range-selection step: returns the next { startDate, endDate } after clicking `date`.
export const nextRange = (startDate, endDate, date) => {
  const clicked = format(date, 'yyyy-MM-dd');
  if (!startDate || endDate) return { startDate: clicked, endDate: '' };
  const start = new Date(startDate);
  return isAfter(date, start)
    ? { startDate, endDate: clicked }
    : { startDate: clicked, endDate: format(start, 'yyyy-MM-dd') };
};

// onChange(startDate, endDate) fires once per interaction so parents never apply two stale partial updates.
const DateRangePicker = ({ startDate, endDate, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, ready: false });
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideWrapper = wrapperRef.current && !wrapperRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);

      if (isOutsideWrapper && isOutsideDropdown) {
        setIsOpen(false);
        setDropdownPosition({ top: 0, left: 0, ready: false })
      }
    };
    if (isOpen) {
      const handleScroll = (event) => {
        if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
          return
        }
        setIsOpen(false)
      }

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', () => setIsOpen(false));
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', () => setIsOpen(false));
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 400;
      const dropdownWidth = 320;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      let top = shouldPositionAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8;
      if (top < 8) top = 8;
      if (top + dropdownHeight > viewportHeight - 8) {
        top = viewportHeight - dropdownHeight - 8;
      }

      let left = rect.left;
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8;
      }
      if (left < 8) left = 8;

      setDropdownPosition({ top, left, ready: true });
      setTimeout(() => setIsOpen(true), 0);
    } else {
      setIsOpen(false);
      setDropdownPosition({ top: 0, left: 0, ready: false });
    }
  };

  const handleDateSelect = (date) => {
    const r = nextRange(startDate, endDate, date);
    onChange(r.startDate, r.endDate);
  };

  const isInRange = (day) => {
    if (!startDate) return false;
    const dayDate = day;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : hoverDate;
    if (!end) return false;
    return (isAfter(dayDate, start) || isSameDay(dayDate, start)) && (isBefore(dayDate, end) || isSameDay(dayDate, end));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const displayValue = () => {
    if (startDate && endDate) {
      return `${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`;
    }
    if (startDate) {
      return `${format(new Date(startDate), 'MMM dd, yyyy')} - ...`;
    }
    return 'Select date range';
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`glass-input w-full flex items-center justify-between text-left min-h-[44px] ${startDate || endDate ? 'pr-10' : ''}`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-gray-400" />
            <span className={startDate ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-[#a1a1a6]'}>
              {displayValue()}
            </span>
          </div>
        </button>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('', '');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#a1a1a6] hover:text-gray-600 dark:hover:text-gray-100 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && dropdownPosition.ready && createPortal(
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-[9998] md:hidden transition-opacity glass-modal-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="fixed z-[9999] glass-dropdown rounded-t-2xl md:rounded-2xl p-4 w-full md:w-80 bottom-0 left-0 md:bottom-auto animate-slide-up md:animate-none"
            style={{
              ...(window.innerWidth >= 768 ? {
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                maxHeight: 'calc(100vh - 16px)',
                maxWidth: 'calc(100vw - 16px)'
              } : {
                maxHeight: '85vh',
                top: 'auto',
                left: 0
              }),
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/[0.15] rounded-full mx-auto mb-4 md:hidden" />

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, idx) => {
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isStart = startDate && isSameDay(day, new Date(startDate));
                const isEnd = endDate && isSameDay(day, new Date(endDate));
                const inRange = isInRange(day);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    onMouseEnter={() => setHoverDate(day)}
                    className={`p-2 text-sm rounded-lg transition-colors relative ${!isCurrentMonthDay
                      ? 'text-gray-300 dark:text-[#85858b] cursor-not-allowed'
                      : isStart || isEnd
                        ? 'bg-brass-600 text-white font-medium'
                        : inRange
                          ? 'bg-brass-100 dark:bg-brass-500/15 text-brass-700 dark:text-brass-300'
                          : isToday
                            ? 'bg-brass-50 dark:bg-brass-500/10 text-brass-600 dark:text-brass-400 font-medium'
                            : 'text-gray-700 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                      }`}
                    disabled={!isCurrentMonthDay}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.06] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange(format(new Date(), 'yyyy-MM-dd'), '');
                }}
                className="flex-1 px-3 py-2 text-sm text-brass-600 dark:text-brass-400 hover:bg-brass-50 dark:hover:bg-brass-500/10 rounded-xl transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-white/[0.06] rounded-xl transition-colors min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DateRangePicker;
