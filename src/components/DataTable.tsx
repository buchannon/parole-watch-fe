import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { cn } from '../utils'

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export interface Column<T> {
  key: string
  header: string
  className?: string
  sortable?: boolean
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyMessage: string
  sort?: SortState | null
  onSort?: (sort: SortState) => void
}

function SortIndicator({ direction }: { direction: SortDirection }) {
  return (
    <span aria-hidden="true" className="ml-1 text-[10px]">
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  )
}

export function DataTable<T>({ columns, rows, getRowKey, emptyMessage, sort, onSort }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  const handleSort = (column: Column<T>) => {
    if (!onSort) return
    if (sort?.key === column.key) {
      onSort({ key: column.key, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onSort({ key: column.key, direction: 'asc' })
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => {
              const activeDirection = sort && sort.key === column.key ? sort.direction : undefined
              const sortable = Boolean(column.sortable && onSort)
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={activeDirection === 'asc' ? 'ascending' : activeDirection === 'desc' ? 'descending' : undefined}
                  className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500', column.className)}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="inline-flex items-center hover:text-gray-900"
                    >
                      {column.header}
                      {activeDirection && <SortIndicator direction={activeDirection} />}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-3 text-sm text-gray-900', column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
