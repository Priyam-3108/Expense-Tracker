import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'

const DatePicker = ({ value, onChange, placeholder = "Select date", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, ready: false })
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value))
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideWrapper = wrapperRef.current && !wrapperRef.current.contains(event.target)
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target)

      if (isOutsideWrapper && isOutsideDropdown) {
        setIsOpen(false)
        setDropdownPosition({ top: 0, left: 0, ready: false })
      }
    }

    if (isOpen) {
      const handleScroll = (event) => {
        if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
          return
        }
        setIsOpen(false)
      }

      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', () => setIsOpen(false))
      window.addEventListener('scroll', handleScroll, true)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', () => setIsOpen(false))
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isOpen])

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isOpen && buttonRef.current) {
      // Calculate position synchronously BEFORE opening to prevent flicker
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const dropdownHeight = 400 // Approximate height of calendar dropdown
      const dropdownWidth = 320 // w-80 = 320px

      // Check if there's enough space below, if not, position above
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

      // Calculate top position
      let top = shouldPositionAbove
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 8

      // Ensure dropdown doesn't go off screen
      if (top < 8) top = 8
      if (top + dropdownHeight > viewportHeight - 8) {
        top = viewportHeight - dropdownHeight - 8
      }

      // Calculate left position (ensure it doesn't go off screen)
      let left = rect.left
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8
      }
      if (left < 8) left = 8

      const position = {
        top: top,
        left: left,
        ready: true
      }
      // Set position first, then open in the same render cycle
      setDropdownPosition(position)
      // Use setTimeout with 0 to ensure position state is set before isOpen
      setTimeout(() => {
        setIsOpen(true)
      }, 0)
    } else {
      setIsOpen(false)
      setDropdownPosition({ top: 0, left: 0, ready: false })
    }
  }

  const handleDateSelect = (date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
    setDropdownPosition({ top: 0, left: 0, ready: false })
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const displayValue = value ? format(new Date(value), 'MMM dd, yyyy') : ''

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-600 transition ${value ? 'pr-10' : ''}`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-gray-400" />
            <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {displayValue || placeholder}
            </span>
          </div>
        </button>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 z-10 p-1"
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
            className="fixed z-[9999] bg-white dark:bg-gray-800 border md:border-gray-200 dark:border-gray-700 rounded-t-2xl md:rounded-lg shadow-[0_-8px_30px_rgba(0,0,0,0.1)] md:shadow-xl p-4 w-full md:w-80 bottom-0 left-0 md:bottom-auto animate-slide-up md:animate-none"
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
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 md:hidden" />

            {/* Calendar Header - Fixed */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <h3 className="text-base md:text-sm font-semibold text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Calendar Grid - Scrollable if needed */}
            <div className="overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, idx) => {
                  const isCurrentMonthDay = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  const isSelected = value && isSameDay(day, new Date(value))

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`p-2 text-sm rounded transition ${!isCurrentMonthDay
                        ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-600 text-white font-semibold'
                          : isToday
                            ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      disabled={!isCurrentMonthDay}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick actions - Fixed */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default DatePicker

