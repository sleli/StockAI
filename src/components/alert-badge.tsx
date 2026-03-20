"use client";

type AlertStatus = "active" | "triggered" | "disabled" | "dismissed";

const STATUS_STYLES: Record<AlertStatus, string> = {
  triggered: "text-orange-500",
  active: "text-green-600",
  disabled: "text-gray-400",
  dismissed: "text-gray-400",
};

interface AlertBadgeProps {
  status: AlertStatus;
}

export function AlertBadge({ status }: AlertBadgeProps) {
  return (
    <span
      className={`inline-flex ${STATUS_STYLES[status]}`}
      title={`Alert ${status}`}
      data-testid="alert-badge"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </span>
  );
}
