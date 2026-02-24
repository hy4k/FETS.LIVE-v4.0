/**
 * Reusable Empty State Components
 * Provides consistent empty state UX across the application
 */

import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-96 text-center px-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary-modern">
          {action.label}
        </button>
      )}
    </div>
  );
}

interface NoResultsProps {
  searchQuery?: string;
  onClear?: () => void;
}

export function NoResults({ searchQuery, onClear }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No results found
      </h3>
      <p className="text-gray-600 mb-4">
        {searchQuery
          ? `No results for "${searchQuery}". Try adjusting your search.`
          : "Try adjusting your filters or search criteria."}
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
