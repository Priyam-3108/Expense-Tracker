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
    totalResults
}) => {
    const [sorting, setSorting] = useState([])
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
        },
        enableRowSelection: true,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const hasSelection = selectedRows.length > 0

    return (
        <div className="w-full space-y-4">
            {/* Toolbar: Search and Total Results */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchValue || ''}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-10 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors"
                    />
                </div>
                {totalResults !== undefined && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Total Results: <span className="text-gray-900 dark:text-white">{totalResults}</span>
                    </div>
                )}
            </div>

            {/* Bulk Actions Toolbar */}
            {hasSelection && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedRows.length} row(s) selected
                    </span>
                    <div className="flex gap-2">
                        {onBulkEdit && (
                            <button
                                onClick={() => onBulkEdit(selectedRows.map(row => row.original))}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors"
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
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Selected
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 font-medium whitespace-nowrap"
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
                                                            className={`text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors ${header.column.getIsSorted() ? 'text-blue-600 dark:text-blue-400' : ''
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
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-10 text-center">
                                        <div className="flex justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr
                                        key={row.id}
                                        className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${row.getIsSelected() ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4">
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>Page</span>
                        <span className="font-medium">
                            {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight size={18} />
                        </button>
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={e => {
                                table.setPageSize(Number(e.target.value))
                            }}
                            className="ml-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[10, 20, 30, 40, 50].map(pageSize => (
                                <option key={pageSize} value={pageSize}>
                                    Show {pageSize}
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
