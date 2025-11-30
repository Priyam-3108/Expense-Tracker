import { useState } from 'react'
import { X, Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import DateRangePicker from './DateRangePicker'
import { getTodayDate } from '../utils/helpers'

const ExportModal = ({ isOpen, onClose, onExport, loading }) => {
    const [format, setFormat] = useState('csv')
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    })

    if (!isOpen) return null

    const handleExport = () => {
        onExport(format, dateRange)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Export Expenses
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Export Format
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setFormat('csv')}
                                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${format === 'csv'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <FileText size={24} />
                                <span className="text-sm font-medium">CSV</span>
                            </button>
                            <button
                                onClick={() => setFormat('excel')}
                                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${format === 'excel'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <Table size={24} />
                                <span className="text-sm font-medium">Excel</span>
                            </button>
                            <button
                                onClick={() => setFormat('pdf')}
                                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${format === 'pdf'
                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <FileSpreadsheet size={24} />
                                <span className="text-sm font-medium">PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Range Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date Range (Optional)
                        </label>
                        <DateRangePicker
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                            onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    >
                        {loading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Download size={16} />
                        )}
                        Export {format.toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ExportModal
