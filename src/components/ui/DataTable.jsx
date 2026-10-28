import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Inbox,
  AlertCircle
} from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';

export const DataTable = ({
  columns = [],
  data = [],
  total = 0,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  sortBy = '',
  sortAsc = true,
  onSort,
  onPageChange,
  onPageSizeChange,
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterComponent,
  actionButton,
  isLoading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  editLabel = 'Edit Product',
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  idField = 'id'
}) => {
  const [openActionId, setOpenActionId] = useState(null);

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5F0] shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-[#DCE5F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {onSearchChange && (
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="max-w-md w-full"
            />
          )}
          {filterComponent && (
            <div className="flex items-center gap-2">
              {filterComponent}
            </div>
          )}
        </div>

        {actionButton && (
          <div className="flex items-center gap-2 shrink-0">
            {actionButton}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 text-center bg-rose-50 border-b border-rose-100 text-rose-700 flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Failed to load records: {error.message || 'Unknown database error'}</p>
        </div>
      )}

      {/* Main Table Responsive Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-sm text-[#64748B] border-collapse">
          {/* Table Header */}
          <thead className="bg-[#F5F8FC] text-xs text-[#64748B] uppercase font-semibold border-b border-[#DCE5F0]">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false && onSort && col.accessor;
                const isCurrentSort = sortBy === col.accessor;

                return (
                  <th
                    key={col.key || col.accessor || col.header}
                    className={`px-4 py-3.5 ${col.className || ''} ${
                      isSortable ? 'cursor-pointer select-none hover:bg-[#EAEFF7] transition-colors' : ''
                    }`}
                    onClick={() => isSortable && onSort(col.accessor)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-[#64748B]">
                          {isCurrentSort ? (
                            sortAsc ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#111827] font-bold" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#111827] font-bold" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3.5 text-right w-16 uppercase text-[#64748B] font-semibold text-xs tracking-wider">
                  ACTIONS
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#DCE5F0]">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: pageSize || 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={`skel-cell-${cIdx}`} className="px-4 py-4">
                      <div
                        className="h-4 bg-slate-200/80 rounded"
                        style={{ width: `${60 + ((rIdx + cIdx) % 3) * 15}%` }}
                      />
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-4 py-4 text-right">
                      <div className="w-6 h-6 bg-slate-200/80 rounded-full ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + ((onView || onEdit || onDelete) ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-[#F5F8FC] border border-[#DCE5F0] flex items-center justify-center text-[#64748B] mb-3">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-semibold text-[#111827] font-serif">{emptyTitle}</h4>
                    <p className="text-xs text-[#64748B] mt-1 max-w-xs">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Actual Data Rows
              data.map((row, rowIdx) => {
                const rowKey = row[idField] || rowIdx;
                const isMenuOpen = openActionId === rowKey;

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-[#F5F8FC]/60 transition-colors group"
                  >
                    {columns.map((col) => {
                      const cellValue = col.accessor ? row[col.accessor] : null;
                      return (
                        <td
                          key={col.key || col.accessor || col.header}
                          className={`px-4 py-3.5 ${col.className || ''}`}
                        >
                          {col.render ? col.render(row, cellValue) : (cellValue ?? '—')}
                        </td>
                      );
                    })}

                    {/* Actions Column with Three-Dots Popover */}
                    {(onView || onEdit || onDelete) && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(isMenuOpen ? null : rowKey);
                            }}
                            className="p-1.5 text-[#64748B] hover:text-[#111827] hover:bg-[#F5F8FC] rounded-lg transition-colors border border-transparent hover:border-[#DCE5F0] cursor-pointer"
                            aria-label="Actions menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <>
                              {/* Click backdrop to dismiss menu */}
                              <div 
                                className="fixed inset-0 z-30" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionId(null);
                                }} 
                              />

                              {/* Three-dots Dropdown Menu */}
                              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-elevated border border-[#DCE5F0] py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 text-left">
                                {onView && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      onView(row);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[#111827] hover:bg-[#F5F8FC] transition-colors font-medium text-left cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-[#64748B] shrink-0" />
                                    <span>View Details</span>
                                  </button>
                                )}

                                {onEdit && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      onEdit(row);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[#111827] hover:bg-[#F5F8FC] transition-colors font-medium text-left cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4 text-[#64748B] shrink-0" />
                                    <span>{editLabel}</span>
                                  </button>
                                )}

                                {onDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      onDelete(row);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left cursor-pointer border-t border-[#DCE5F0]"
                                  >
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

      {/* Pagination Container */}
      {totalPages > 0 && onPageChange && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};
