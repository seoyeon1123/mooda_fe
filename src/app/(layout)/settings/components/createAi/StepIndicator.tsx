"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedCount: number;
  selectedMBTI: string;
  mooName: string;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  completedCount,
  selectedMBTI,
  mooName,
}: StepIndicatorProps) {
  return (
    <div className="px-6 mb-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-center gap-2 mb-3">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-6 rounded-full transition-all duration-300 ${
                index <= currentStep ? "bg-green-600" : "bg-stone-300"
              }`}
            />
          ))}
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">
            {currentStep < 4
              ? `${completedCount}/4 완료`
              : mooName
              ? "5/5 완료"
              : "4/5 완료"}
          </div>
          <div className="text-sm text-gray-600">
            {currentStep < 4 ? (
              <>
                선택한 타입:{" "}
                <span className="font-medium text-green-600">
                  {selectedMBTI}
                </span>
              </>
            ) : (
              <>
                moo의 타입:{" "}
                <span className="font-medium text-green-600">
                  {selectedMBTI}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
