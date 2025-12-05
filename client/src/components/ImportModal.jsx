import { useState, useRef, useMemo, useEffect } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle, Check, ArrowRight, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useExpense } from '../context/ExpenseContext'
import toast from 'react-hot-toast'

const REQUIRED_FIELDS = ['amount', 'date', 'category']
const OPTIONAL_FIELDS = ['description', 'type', 'notes']
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

// Helper to normalize header names
const normalizeHeader = (header) => {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const { categories, addExpense, loadExpenses } = useExpense()
    const [step, setStep] = useState(1) // 1: Upload, 2: Mapping, 3: Preview/Processing
    const [file, setFile] = useState(null)
    const [rawData, setRawData] = useState([])
    const [headers, setHeaders] = useState([])
    const [mapping, setMapping] = useState({})
    const [processing, setProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const fileInputRef = useRef(null)

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset()
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            processFile(selectedFile)
        }
    }

    const processFile = (file) => {
        setFile(file)
        const reader = new FileReader()

        reader.onload = (e) => {
            const data = e.target.result
            let parsedData = []
            let parsedHeaders = []

            if (file.name.endsWith('.csv')) {
                Papa.parse(data, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        parsedData = results.data
                        parsedHeaders = results.meta.fields
                        setRawData(parsedData)
                        setHeaders(parsedHeaders)
                        autoMapHeaders(parsedHeaders)
                        setStep(2)
                    },
                    error: (error) => {
                        toast.error('Error parsing CSV: ' + error.message)
                    }
                })
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                parsedData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

                if (parsedData.length > 0) {
                    parsedHeaders = Object.keys(parsedData[0])
                    setRawData(parsedData)
                    setHeaders(parsedHeaders)
                    autoMapHeaders(parsedHeaders)
                    setStep(2)
                } else {
                    toast.error('No data found in Excel file')
                }
            } else {
                toast.error('Unsupported file format')
            }
        }

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file)
        } else {
            reader.readAsBinaryString(file)
        }
    }

    const autoMapHeaders = (fileHeaders) => {
        const newMapping = {}
        fileHeaders.forEach(header => {
            const normalized = normalizeHeader(header)
            // Try to find a match in our fields
            const match = ALL_FIELDS.find(field => normalizeHeader(field) === normalized)
            if (match) {
                newMapping[match] = header
            } else {
                // Try some common variations
                if (normalized.includes('cost') || normalized.includes('price')) newMapping['amount'] = header
                if (normalized.includes('day') || normalized.includes('time')) newMapping['date'] = header
                if (normalized.includes('cat')) newMapping['category'] = header
                if (normalized.includes('desc') || normalized.includes('detail')) newMapping['description'] = header
                if (normalized.includes('kind')) newMapping['type'] = header
                if (normalized.includes('memo') || normalized.includes('comment')) newMapping['notes'] = header
            }
        })
        setMapping(newMapping)
    }

    const handleMappingChange = (field, value) => {
        setMapping(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleImport = async () => {
        // Validate mapping
        const missingRequired = REQUIRED_FIELDS.filter(field => !mapping[field])
        if (missingRequired.length > 0) {
            toast.error(`Please map all required fields: ${missingRequired.join(', ')}`)
            return
        }

        setProcessing(true)
        setProgress(0)

        try {
            const { expenseService } = await import('../services/expenseService')
            const { categoryService } = await import('../services/categoryService')

            const expensesToCreate = []
            const newCategories = new Set()
            const categoryMap = new Map() // Name -> ID

            // Pre-fill existing categories
            categories.forEach(c => {
                categoryMap.set(c.name.toLowerCase(), c._id)
            })

            // First pass: Identify new categories and prepare data
            for (const row of rawData) {
                const categoryName = row[mapping.category]?.trim()
                if (categoryName && !categoryMap.has(categoryName.toLowerCase())) {
                    newCategories.add(categoryName)
                }
            }

            // Create new categories
            if (newCategories.size > 0) {
                toast.loading(`Creating ${newCategories.size} new categories...`, { id: 'import-cats' })
                for (const catName of newCategories) {
                    try {
                        // Simple heuristic for color/icon or just use defaults
                        const res = await categoryService.createCategory({
                            name: catName,
                            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'), // Random color
                            icon: '📝'
                        })
                        if (res.data?.success) {
                            categoryMap.set(catName.toLowerCase(), res.data.data.category._id)
                        }
                    } catch (err) {
                        console.error(`Failed to create category ${catName}`, err)
                    }
                }
                toast.dismiss('import-cats')
            }

            // Second pass: Build expense objects
            let validCount = 0
            for (const row of rawData) {
                const amount = parseFloat(row[mapping.amount])
                const dateStr = row[mapping.date]
                const categoryName = row[mapping.category]?.trim()

                if (!amount || isNaN(amount) || !dateStr || !categoryName) continue

                const categoryId = categoryMap.get(categoryName.toLowerCase())
                if (!categoryId) continue // Should not happen if creation worked

                // Parse date - try to handle common formats
                let date = dateStr
                if (dateStr instanceof Date) {
                    date = dateStr.toISOString().split('T')[0]
                } else {
                    // If it's Excel serial date
                    if (typeof dateStr === 'number') {
                        const excelDate = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
                        date = excelDate.toISOString().split('T')[0]
                    } else if (typeof dateStr === 'string') {
                        const parsed = new Date(dateStr)
                        if (!isNaN(parsed.getTime())) {
                            date = parsed.toISOString().split('T')[0]
                        }
                    }
                }

                expensesToCreate.push({
                    description: row[mapping.description] || '',
                    amount: Math.abs(amount), // Ensure positive
                    date: date,
                    category: categoryId,
                    type: row[mapping.type]?.toLowerCase() === 'income' ? 'income' : 'expense',
                    notes: row[mapping.notes] || ''
                })
                validCount++
            }

            if (expensesToCreate.length === 0) {
                toast.error('No valid expenses found to import')
                setProcessing(false)
                return
            }

            // Send to backend
            toast.loading(`Importing ${expensesToCreate.length} expenses...`, { id: 'import-exps' })
            const response = await expenseService.bulkCreateExpenses({
                date: new Date().toISOString().split('T')[0], // Base date required by API but individual dates override
                expenses: expensesToCreate
            })

            if (response.data?.success) {
                toast.success(`Successfully imported ${response.data.data.expenses.length} expenses`)
                toast.dismiss('import-exps')
                if (onImportSuccess) onImportSuccess()
                onClose()
            }

        } catch (error) {
            console.error('Import failed:', error)
            toast.error('Import failed: ' + (error.response?.data?.message || error.message))
        } finally {
            setProcessing(false)
            toast.dismiss('import-cats')
            toast.dismiss('import-exps')
        }
    }

    const reset = () => {
        setFile(null)
        setRawData([])
        setHeaders([])
        setMapping({})
        setStep(1)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Import Expenses
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault()
                                const file = e.dataTransfer.files[0]
                                if (file) processFile(file)
                            }}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                                <Upload size={32} />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Click to upload or drag and drop
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Supports CSV and Excel files
                            </p>
                            <div className="mt-6 flex gap-4 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <FileSpreadsheet size={14} /> CSV
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileSpreadsheet size={14} /> XLSX
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-medium mb-1">Map your columns</p>
                                    <p>Match the columns from your file to the expense fields. Required fields are marked with *.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ALL_FIELDS.map(field => (
                                    <div key={field} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                            {field} {REQUIRED_FIELDS.includes(field) && <span className="text-red-500">*</span>}
                                        </label>
                                        <select
                                            value={mapping[field] || ''}
                                            onChange={(e) => handleMappingChange(field, e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!mapping[field] && REQUIRED_FIELDS.includes(field)
                                                ? 'border-red-300 focus:ring-red-500'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                }`}
                                        >
                                            <option value="">Select column...</option>
                                            {headers.map(header => (
                                                <option key={header} value={header}>{header}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Preview (First 3 rows)</h4>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                                            <tr>
                                                {Object.keys(mapping).filter(k => mapping[k]).map(field => (
                                                    <th key={field} className="px-4 py-2 font-medium capitalize">{field}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {rawData.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="bg-white dark:bg-gray-800">
                                                    {Object.keys(mapping).filter(k => mapping[k]).map(field => (
                                                        <td key={field} className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                                            {row[mapping[field]]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    {step === 1 ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            onClick={reset}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900"
                            disabled={processing}
                        >
                            Back
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            onClick={handleImport}
                            disabled={processing}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    Import Expenses
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ImportModal
