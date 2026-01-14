'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ChevronDown, ChevronUp, Zap, DollarSign } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ModelType, ModelOption } from '@/types';

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and cost-effective. Best for most use cases.',
    costPerMillion: '$0.15 input / $0.60 output',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model. Better for complex analysis.',
    costPerMillion: '$2.50 input / $10.00 output',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'High capability with large context window.',
    costPerMillion: '$10.00 input / $30.00 output',
  },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Model</h3>
            <p className="text-xs text-[var(--color-slate-400)]">
              {currentModel.name} - {currentModel.description.split('.')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
            {currentModel.id === 'gpt-4o-mini' ? 'Recommended' : 'Premium'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--color-slate-400)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--color-slate-400)]" />
          )}
        </div>
      </div>

      {/* Expanded Options */}
      {isExpanded && (
        <motion.div
          className="px-4 pb-4 space-y-2"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          {MODEL_OPTIONS.map((model) => (
            <div
              key={model.id}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedModel === model.id
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'bg-[var(--color-navy-800)] border border-transparent hover:border-[var(--color-navy-600)]'
              }`}
              onClick={() => {
                setSelectedModel(model.id);
                setIsExpanded(false);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{model.name}</h4>
                    {model.id === 'gpt-4o-mini' && (
                      <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                        <Zap className="w-3 h-3" />
                        Fast
                      </span>
                    )}
                    {model.id === 'gpt-4o' && (
                      <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        Best Quality
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-slate-400)] mt-1">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-slate-500)]">
                    <DollarSign className="w-3 h-3" />
                    <span>{model.costPerMillion}</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedModel === model.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-[var(--color-navy-600)]'
                  }`}
                >
                  {selectedModel === model.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
