import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, className = '' }) => {
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
    if (!startDate || (startDate && endDate)) {
      onStartDateChange(format(date, 'yyyy-MM-dd'));
      onEndDateChange('');
    } else if (startDate && !endDate) {
      const start = new Date(startDate);
      if (isAfter(date, start)) {
        onEndDateChange(format(date, 'yyyy-MM-dd'));
      } else {
        onEndDateChange(format(start, 'yyyy-MM-dd'));
        onStartDateChange(format(date, 'yyyy-MM-dd'));
      }
    }
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
          className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-white/[0.07] rounded-xl bg-white dark:bg-white/[0.04] text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 hover:border-gray-400 dark:hover:border-white/[0.15] transition-all duration-200 min-h-[44px] ${startDate || endDate ? 'pr-10' : ''}`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-gray-400" />
            <span className={startDate ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              {displayValue()}
            </span>
          </div>
        </button>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartDateChange('');
              onEndDateChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && dropdownPosition.ready && createPortal(
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl border md:border-gray-200 dark:border-white/[0.08] rounded-t-2xl md:rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.1)] md:shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 w-full md:w-80 bottom-0 left-0 md:bottom-auto animate-slide-up md:animate-none"
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl transition-all duration-200"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl transition-all duration-200"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
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
                    className={`p-2 text-sm rounded-lg transition-all duration-200 relative ${!isCurrentMonthDay
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : isStart || isEnd
                        ? 'bg-indigo-600 text-white font-semibold shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                        : inRange
                          ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                          : isToday
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
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
                  const today = new Date();
                  onStartDateChange(format(today, 'yyyy-MM-dd'));
                  onEndDateChange('');
                }}
                className="flex-1 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all duration-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] rounded-xl transition-all duration-200 min-h-[40px]"
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
