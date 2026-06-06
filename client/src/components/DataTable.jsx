import { useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table'
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Trash2,
    Edit,
    Search
} from 'lucide-react'

const DataTable = ({
    data,
    columns,
    onBulkDelete,
    onBulkEdit,
    isLoading,
    searchValue,
    onSearchChange,
    totalResults,
    pageCount,
    pageIndex = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    manualPagination = false
}) => {
    const [sorting, setSorting] = useState([])
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
            ...(manualPagination && {
                pagination: {
                    pageIndex,
                    pageSize,
                },
            }),
        },
        enableRowSelection: true,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        ...(!manualPagination && { getPaginationRowModel: getPaginationRowModel() }),
        getSortedRowModel: getSortedRowModel(),
        manualPagination,
        ...(manualPagination && { pageCount }),
    })

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const hasSelection = selectedRows.length > 0

    return (
        <div className="w-full space-y-4">
            {/* Toolbar: Search and Total Results */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchValue || ''}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 dark:border-white/[0.07] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white px-10 py-3 text-sm focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 backdrop-blur-sm"
                    />
                </div>
                {totalResults !== undefined && (
                    <div className="text-sm text-gray-500 dark:text-slate-500 font-medium">
                        Total Results: <span className="text-gray-900 dark:text-white">{totalResults}</span>
                    </div>
                )}
            </div>

            {/* Bulk Actions Toolbar */}
            {hasSelection && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10">
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {selectedRows.length} row(s) selected
                    </span>
                    <div className="flex gap-2">
                        {onBulkEdit && (
                            <button
                                onClick={() => onBulkEdit(selectedRows.map(row => row.original))}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-all duration-200"
                            >
                                <Edit size={16} />
                                Edit Selected
                            </button>
                        )}
                        {onBulkDelete && (
                            <button
                                onClick={() => {
                                    onBulkDelete(selectedRows.map(row => row.original))
                                    setRowSelection({})
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-all duration-200"
                            >
                                <Trash2 size={16} />
                                Delete Selected
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="glass-table">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase text-gray-500 dark:text-slate-500">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3.5 font-medium whitespace-nowrap"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none group' : ''
                                                        }`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <ArrowUpDown
                                                            size={14}
                                                            className={`text-slate-600 group-hover:text-slate-400 transition-colors ${header.column.getIsSorted() ? 'text-indigo-500 dark:text-indigo-400' : ''
                                                                }`}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-10 text-center">
                                        <div className="flex justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500 dark:text-slate-500">
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr
                                        key={row.id}
                                        className={`transition-all duration-200 ${row.getIsSelected() ? 'bg-indigo-50 dark:bg-indigo-500/5' : ''
                                            }`}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4 text-gray-700 dark:text-slate-300">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-400">
                        <span className="hidden sm:inline">Page</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 dark:text-slate-400 transition-all duration-200"
                            onClick={() => {
                                if (manualPagination && onPageChange) onPageChange(0)
                                else table.setPageIndex(0)
                            }}
                            disabled={manualPagination ? pageIndex === 0 : !table.getCanPreviousPage()}
                            aria-label="First page"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 dark:text-slate-400 transition-all duration-200"
                            onClick={() => {
                                if (manualPagination && onPageChange) onPageChange(pageIndex - 1)
                                else table.previousPage()
                            }}
                            disabled={manualPagination ? pageIndex === 0 : !table.getCanPreviousPage()}
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 dark:text-slate-400 transition-all duration-200"
                            onClick={() => {
                                if (manualPagination && onPageChange) onPageChange(pageIndex + 1)
                                else table.nextPage()
                            }}
                            disabled={manualPagination ? pageIndex >= pageCount - 1 : !table.getCanNextPage()}
                            aria-label="Next page"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 dark:text-slate-400 transition-all duration-200"
                            onClick={() => {
                                if (manualPagination && onPageChange) onPageChange(pageCount - 1)
                                else table.setPageIndex(table.getPageCount() - 1)
                            }}
                            disabled={manualPagination ? pageIndex >= pageCount - 1 : !table.getCanNextPage()}
                            aria-label="Last page"
                        >
                            <ChevronsRight size={18} />
                        </button>
                        <select
                            value={manualPagination ? pageSize : table.getState().pagination.pageSize}
                            onChange={e => {
                                const newSize = Number(e.target.value)
                                if (manualPagination && onPageSizeChange) onPageSizeChange(newSize)
                                else table.setPageSize(newSize)
                            }}
                            className="ml-2 rounded-lg border border-gray-300 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
                        >
                            {[5, 10, 20, 30, 40, 50].map(size => (
                                <option key={size} value={size} className="bg-slate-800 text-white">
                                    Show {size}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DataTable
