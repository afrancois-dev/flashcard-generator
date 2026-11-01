import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

import type { Card } from '../domain/cards'

type CardTableProps = {
  cards: Card[]
  selectedIds: string[]
  onToggleSelected: (id: string) => void
}

const columnHelper = createColumnHelper<Card>()

export function CardTable({
  cards,
  selectedIds,
  onToggleSelected,
}: CardTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'selection',
        header: 'Select',
        cell: ({ row }) => (
          <input
            aria-label={`Select card ${row.original.id}`}
            checked={selectedIds.includes(row.original.id)}
            onChange={() => onToggleSelected(row.original.id)}
            type="checkbox"
          />
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
      }),
      columnHelper.accessor(
        (card) => (card.type === 'basic' ? card.front : card.text),
        {
          id: 'content',
          header: 'Content',
        },
      ),
      columnHelper.accessor((card) => card.tags.join(', '), {
        id: 'tags',
        header: 'Tags',
      }),
    ],
    [onToggleSelected, selectedIds],
  )
  const table = useReactTable({
    data: cards,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="stack">
      <label htmlFor="card-filter">Filter cards</label>
      <input className="field"
        id="card-filter"
        onChange={(event) => setGlobalFilter(event.target.value)}
        placeholder="Search cards"
        value={globalFilter}
      />
      <div className="data-table-wrap"><table>
        <caption>Flashcard review summary</caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} scope="col">
                  {header.isPlaceholder ? null : (
                    <button className="table-sort"
                      onClick={header.column.getToggleSortingHandler()}
                      type="button"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === 'asc'
                        ? ' (ascending)'
                        : header.column.getIsSorted() === 'desc'
                          ? ' (descending)'
                          : ''}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}
