/**
 * PlateCalculator Component
 *
 * Calculates which plates to load on each side of the bar
 * Supports both kg and lbs with conversion
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Weight, ChevronDown, ChevronUp } from 'lucide-react';

interface Plate {
  weight: number;
  color: string;
  count: number;
}

const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const LBS_PLATES = [45, 35, 25, 10, 5, 2.5];

const PLATE_COLORS: Record<number, string> = {
  // Kg plates (IPF standard colors)
  25: 'bg-red-500',
  20: 'bg-blue-500',
  15: 'bg-yellow-500',
  10: 'bg-green-500',
  5: 'bg-white border-2 border-gray-800',
  2.5: 'bg-red-600',
  1.25: 'bg-gray-400',
  0.5: 'bg-gray-300',
  // Lbs plates
  45: 'bg-red-500',
  35: 'bg-yellow-500',
  25: 'bg-green-500',
  10: 'bg-blue-500',
  2.5: 'bg-gray-400',
};

interface PlateCalculatorProps {
  defaultWeight?: number;
  defaultBarWeight?: number;
  defaultUnit?: 'kg' | 'lbs';
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function PlateCalculator({
  defaultWeight = 100,
  defaultBarWeight = 20,
  defaultUnit = 'kg',
  isOpen = false,
  onToggle,
}: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState(defaultWeight);
  const [barWeight, setBarWeight] = useState(defaultBarWeight);
  const [unit, setUnit] = useState<'kg' | 'lbs'>(defaultUnit);
  const [expanded, setExpanded] = useState(isOpen);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const calculatePlates = (): Plate[] => {
    const weightPerSide = (targetWeight - barWeight) / 2;
    if (weightPerSide <= 0) return [];

    const availablePlates = unit === 'kg' ? KG_PLATES : LBS_PLATES;
    const plates: Plate[] = [];
    let remaining = weightPerSide;

    for (const plateWeight of availablePlates) {
      const count = Math.floor(remaining / plateWeight);
      if (count > 0) {
        plates.push({
          weight: plateWeight,
          color: PLATE_COLORS[plateWeight] || 'bg-gray-500',
          count,
        });
        remaining -= count * plateWeight;
      }
    }

    return plates;
  };

  const plates = calculatePlates();
  const loadedWeight = plates.reduce((sum, p) => sum + p.weight * p.count, 0) * 2 + barWeight;
  const isExact = Math.abs(loadedWeight - targetWeight) < 0.1;

  const convertUnit = (value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number => {
    if (from === to) return value;
    return from === 'kg' ? value * 2.20462 : value / 2.20462;
  };

  const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
    setTargetWeight(convertUnit(targetWeight, unit, newUnit));
    setBarWeight(convertUnit(barWeight, unit, newUnit));
    setUnit(newUnit);
  };

  const commonBarWeights = unit === 'kg' ? [20, 15, 10, 5] : [45, 35, 25, 15];

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Weight className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Plate Calculator</h3>
            <p className="text-sm text-gray-600">Calculate plates for your lift</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-5 space-y-4">
              {/* Unit Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleUnitChange('kg')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    unit === 'kg'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Kilograms (kg)
                </button>
                <button
                  onClick={() => handleUnitChange('lbs')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    unit === 'lbs'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pounds (lbs)
                </button>
              </div>

              {/* Target Weight Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Weight ({unit})
                </label>
                <input
                  type="number"
                  step={unit === 'kg' ? '2.5' : '5'}
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-bold py-3 px-4 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Bar Weight Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bar Weight ({unit})
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {commonBarWeights.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setBarWeight(weight)}
                      className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                        barWeight === weight
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step={unit === 'kg' ? '2.5' : '5'}
                  value={barWeight}
                  onChange={(e) => setBarWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-semibold py-2 px-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">Load Each Side:</h4>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Loaded</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {loadedWeight.toFixed(1)} {unit}
                    </p>
                  </div>
                </div>

                {plates.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No plates needed (target weight is less than or equal to bar weight)
                  </p>
                ) : (
                  <>
                    {/* Plate List */}
                    <div className="space-y-2 mb-3">
                      {plates.map((plate, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-full ${plate.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                            >
                              {plate.count}×
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {plate.count} × {plate.weight}
                              {unit} plate{plate.count > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600">
                              {(plate.count * plate.weight).toFixed(1)} {unit} per side
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Visual Plate Representation */}
                    <div className="bg-white rounded-lg p-3 border border-indigo-200">
                      <p className="text-xs text-gray-600 mb-2 text-center">Visual Guide</p>
                      <div className="flex items-center justify-center gap-1">
                        {/* Left side plates */}
                        {plates.map((plate, idx) =>
                          Array.from({ length: plate.count }).map((_, i) => (
                            <div
                              key={`left-${idx}-${i}`}
                              className={`${plate.color} rounded-sm shadow-sm`}
                              style={{
                                width: `${Math.max(8, plate.weight / 2)}px`,
                                height: `${Math.min(60, 20 + plate.weight * 1.5)}px`,
                              }}
                            />
                          ))
                        )}
                        {/* Bar */}
                        <div className="bg-gray-600 h-2 w-20" />
                        {/* Right side plates */}
                        {plates.map((plate, idx) =>
                          Array.from({ length: plate.count }).map((_, i) => (
                            <div
                              key={`right-${idx}-${i}`}
                              className={`${plate.color} rounded-sm shadow-sm`}
                              style={{
                                width: `${Math.max(8, plate.weight / 2)}px`,
                                height: `${Math.min(60, 20 + plate.weight * 1.5)}px`,
                              }}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {!isExact && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800 text-center">
                          ⚠️ Note: Exact weight cannot be achieved with available plates. Loaded:{' '}
                          {loadedWeight.toFixed(1)} {unit} (difference:{' '}
                          {Math.abs(loadedWeight - targetWeight).toFixed(1)} {unit})
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quick Conversions */}
              <div className="text-center text-sm text-gray-600">
                {unit === 'kg' ? (
                  <p>
                    {targetWeight}kg ≈ {(targetWeight * 2.20462).toFixed(1)}lbs
                  </p>
                ) : (
                  <p>
                    {targetWeight}lbs ≈ {(targetWeight / 2.20462).toFixed(1)}kg
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
