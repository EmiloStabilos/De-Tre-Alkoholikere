"use client";

export default function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-50 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-stone-800 bg-stone-950 p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-stone-800 text-stone-400"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
