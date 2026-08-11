import { useState } from 'react'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import DateRangePicker from './DateRangePicker'
import Modal from './Modal'

const ExportModal = ({ isOpen, onClose, onExport, loading }) => {
    const [format, setFormat] = useState('csv')
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    })

    const handleExport = () => {
        onExport(format, dateRange)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Expenses" maxWidth="max-w-md">
            <div className="p-6 space-y-6">
                {/* Format Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Export Format
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setFormat('csv')}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 min-h-[44px] ${format === 'csv'
                                    ? 'border-indigo-500/60 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30'
                                    : 'border-gray-200 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                                }`}
                        >
                            <FileText size={24} />
                            <span className="text-sm font-medium">CSV</span>
                        </button>
                        <button
                            onClick={() => setFormat('excel')}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 min-h-[44px] ${format === 'excel'
                                    ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                                    : 'border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                                }`}
                        >
                            <Table size={24} />
                            <span className="text-sm font-medium">Excel</span>
                        </button>
                        <button
                            onClick={() => setFormat('pdf')}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 min-h-[44px] ${format === 'pdf'
                                    ? 'border-rose-500/60 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
                                    : 'border-gray-200 dark:border-white/[0.08] hover:border-rose-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03]'
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

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-200 dark:border-white/[0.08] p-4 bg-gray-50 dark:bg-white/[0.02]">
                <button
                    onClick={onClose}
                    className="btn-secondary btn-md w-full sm:w-auto"
                >
                    Cancel
                </button>
                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="btn-primary btn-md w-full sm:w-auto"
                >
                    {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <Download size={16} />
                    )}
                    Export {format.toUpperCase()}
                </button>
            </div>
        </Modal>
    )
}

export default ExportModal
