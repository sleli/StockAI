"use client";

export type SortField = "manual" | "name" | "price" | "change";
export type SortDirection = "asc" | "desc";

interface SortControlsProps {
  sortBy: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "manual", label: "Manuale" },
  { field: "name", label: "Nome" },
  { field: "price", label: "Prezzo" },
  { field: "change", label: "Var. %" },
];

export function SortControls({
  sortBy,
  sortDirection,
  onSortChange,
}: SortControlsProps) {
  const handleClick = (field: SortField) => {
    if (field === "manual") {
      onSortChange("manual", "asc");
    } else if (field === sortBy) {
      onSortChange(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "asc");
    }
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Ordinamento">
      {SORT_OPTIONS.map(({ field, label }) => {
        const isActive = sortBy === field;
        const arrow =
          isActive && field !== "manual"
            ? sortDirection === "asc"
              ? " ↑"
              : " ↓"
            : "";

        return (
          <button
            key={field}
            type="button"
            className={`period-chip ${isActive ? "active" : ""}`}
            onClick={() => handleClick(field)}
            data-testid={`sort-${field}`}
          >
            {label}
            {arrow}
          </button>
        );
      })}
    </div>
  );
}
