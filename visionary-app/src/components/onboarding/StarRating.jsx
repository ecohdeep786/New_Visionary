import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = "w-6 h-6" }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${size} ${
              n <= value ? "fill-[#fbbc05] text-[#fbbc05]" : "text-[#dadce0]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}