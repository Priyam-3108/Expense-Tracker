import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date())
  const [hoverDate, setHoverDate] = useState(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateSelect = (date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onStartDateChange(format(date, 'yyyy-MM-dd'))
      onEndDateChange('')
    } else if (startDate && !endDate) {
      // Complete selection
      const start = new Date(startDate)
      if (isAfter(date, start)) {
        onEndDateChange(format(date, 'yyyy-MM-dd'))
      } else {
        onEndDateChange(format(start, 'yyyy-MM-dd'))
        onStartDateChange(format(date, 'yyyy-MM-dd'))
      }
    }
  }

  const isInRange = (day) => {
    if (!startDate) return false
    const dayDate = day
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : hoverDate

    if (!end) return false
    return (isAfter(dayDate, start) || isSameDay(dayDate, start)) &&
           (isBefore(dayDate, end) || isSameDay(dayDate, end))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const displayValue = () => {
    if (startDate && endDate) {
      return `${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`
    }
    if (startDate) {
      return `${format(new Date(startDate), 'MMM dd, yyyy')} - ...`
    }
    return 'Select date range'
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-gray-400" />
          <span className={startDate ? 'text-gray-900' : 'text-gray-500'}>
            {displayValue()}
          </span>
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStartDateChange('')
              onEndDateChange('')
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
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

          {/* Calendar Grid */}
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
              const isStart = startDate && isSameDay(day, new Date(startDate))
              const isEnd = endDate && isSameDay(day, new Date(endDate))
              const inRange = isInRange(day)

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  className={`p-2 text-sm rounded transition relative ${
                    !isCurrentMonthDay
                      ? 'text-gray-300 cursor-not-allowed'
                      : isStart || isEnd
                      ? 'bg-blue-600 text-white font-semibold'
                      : inRange
                      ? 'bg-blue-100 text-blue-700'
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

          {/* Quick actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                onStartDateChange(format(today, 'yyyy-MM-dd'))
                onEndDateChange('')
              }}
              className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker

