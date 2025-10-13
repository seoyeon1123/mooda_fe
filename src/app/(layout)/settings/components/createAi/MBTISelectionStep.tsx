"use client";

interface MBTIOption {
  title: string;
  description: string;
  examples: string[];
  icon: string;
  color: string;
}

interface MBTISelectionStepProps {
  options: Record<string, MBTIOption>;
  selectedValue: string | null;
  onSelect: (value: "I" | "E" | "S" | "N" | "T" | "F" | "J" | "P") => void;
}

export default function MBTISelectionStep({
  options,
  selectedValue,
  onSelect,
}: MBTISelectionStepProps) {
  return (
    <div className="space-y-2 mb-2">
      {Object.entries(options).map(([key, option]) => (
        <div
          key={key}
          onClick={() =>
            onSelect(key as "I" | "E" | "S" | "N" | "T" | "F" | "J" | "P")
          }
          className={`relative py-3 px-3 rounded-2xl border-2 transition-all duration-300 active:scale-95 cursor-pointer ${
            selectedValue === key
              ? "border-green-600 bg-green-50 shadow-lg"
              : "border-stone-200 bg-white hover:border-green-400 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-lg shadow-md flex-shrink-0`}
            >
              {option.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-base mb-1">
                {option.title}
              </h4>
              <p className="text-gray-600 text-xs mb-2 leading-relaxed">
                {option.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {option.examples.map((example: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-stone-100 text-gray-600 text-xs rounded-full"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
