import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'

const DatePicker = ({ value, onChange, placeholder = "Select date", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, ready: false })
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value))
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setDropdownPosition({ top: 0, left: 0, ready: false })
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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
    <div ref={wrapperRef} className={`relative ${className}`} style={{ zIndex: isOpen ? 9999 : 'auto' }}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition ${value ? 'pr-10' : ''}`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-gray-400" />
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && dropdownPosition.ready && (
        <div 
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80" 
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px`,
            maxHeight: 'calc(100vh - 16px)',
            maxWidth: 'calc(100vw - 16px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Calendar Header - Fixed */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid - Scrollable if needed */}
          <div className="overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
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
                    className={`p-2 text-sm rounded transition ${
                      !isCurrentMonthDay
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : isToday
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
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
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker

