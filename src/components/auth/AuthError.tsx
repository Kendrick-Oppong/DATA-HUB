import { AlertCircle } from "lucide-react";

interface AuthErrorProps {
  message?: string | null;
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

      <p>{message}</p>
    </div>
  );
}
