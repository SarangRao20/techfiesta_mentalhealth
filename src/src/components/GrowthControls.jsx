import { Plus, RotateCcw, Sprout } from 'lucide-react';

export function GrowthControls({ weight, growth, onAddWeight, onReset }) {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 min-w-[320px]">
      {/* Progress indicators */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-emerald-700 flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            Growth
          </span>
          <span className="text-emerald-900">{Math.round(growth)}%</span>
        </div>

        <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${growth}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-emerald-700">Weight</span>
          <span className="text-emerald-900">{weight} / 50</span>
        </div>

        <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(weight / 50) * 100}%` }}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onAddWeight(5)}
          disabled={weight >= 50}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add Weight (+5)
        </button>

        <button
          onClick={onReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Info text */}
      <p className="text-center mt-4 text-sm text-gray-600">
        {growth < 100
          ? 'Add weight to help your plant grow'
          : '🌿 Your garden is thriving! 🌸'}
      </p>
    </div>
  );
}
