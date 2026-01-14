'use client';

import { create } from 'zustand';
import {
  AppState,
  CheckType,
  Transcript,
  AnalysisResult,
  FixSuggestions,
  ModelType,
} from '@/types';
import {
  defaultChecks,
  demoTranscript,
  defaultReferenceScript,
  demoBatchTranscripts,
} from '@/data/demoData';

const initialState = {
  transcripts: [demoTranscript],
  referenceScript: defaultReferenceScript,
  referenceEnabled: true,
  checks: defaultChecks,
  selectedModel: 'gpt-4o-mini' as ModelType,
  isRunning: false,
  runProgress: 0,
  currentStep: 'input' as const,
  error: null as string | null,
  isGeneratingFixes: false,
  results: null as AnalysisResult | null,
  fixes: null as FixSuggestions | null,
  selectedCallId: null as string | null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setTranscripts: (transcripts: Transcript[]) => set({ transcripts }),

  setReferenceScript: (script: string) => set({ referenceScript: script }),

  setReferenceEnabled: (enabled: boolean) => {
    set({ referenceEnabled: enabled });
    // Auto-disable flow compliance if reference is disabled
    if (!enabled) {
      const checks = get().checks.map((check) =>
        check.id === 'flow_compliance' ? { ...check, enabled: false } : check
      );
      set({ checks });
    }
  },

  setSelectedModel: (model: ModelType) => set({ selectedModel: model }),

  toggleCheck: (checkId: CheckType) => {
    const { checks, referenceEnabled } = get();
    set({
      checks: checks.map((check) => {
        if (check.id === checkId) {
          // Prevent enabling flow_compliance without reference
          if (check.requiresReference && !referenceEnabled) {
            return check;
          }
          return { ...check, enabled: !check.enabled };
        }
        return check;
      }),
    });
  },

  updateCheckInstructions: (checkId: CheckType, instructions: string) => {
    const { checks } = get();
    set({
      checks: checks.map((check) =>
        check.id === checkId ? { ...check, instructions } : check
      ),
    });
  },

  resetCheckInstructions: (checkId: CheckType) => {
    const { checks } = get();
    set({
      checks: checks.map((check) =>
        check.id === checkId
          ? { ...check, instructions: check.defaultInstructions }
          : check
      ),
    });
  },

  resetAllToDefaults: () => {
    set({
      ...initialState,
      transcripts: demoBatchTranscripts,
      currentStep: 'input',
      results: null,
      fixes: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  runAnalysis: async () => {
    const { transcripts, checks, referenceEnabled, referenceScript, selectedModel } = get();

    set({ isRunning: true, runProgress: 0, currentStep: 'running', error: null });

    try {
      // Get enabled check types
      const enabledChecks = checks
        .filter((c) => c.enabled)
        .map((c) => c.id);

      // Show initial progress
      set({ runProgress: 10 });

      // Call the analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcripts,
          enabledChecks,
          referenceScript: referenceEnabled ? referenceScript : undefined,
          model: selectedModel,
        }),
      });

      set({ runProgress: 70 });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Analysis failed');
      }

      set({ runProgress: 90 });

      // Small delay for smooth animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      set({
        isRunning: false,
        runProgress: 100,
        currentStep: 'results',
        results: data.results,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      set({
        isRunning: false,
        runProgress: 0,
        currentStep: 'input',
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      });
    }
  },

  generateFixes: async () => {
    const { results, referenceEnabled, selectedModel } = get();
    if (!results) return;

    set({ isGeneratingFixes: true, error: null });

    try {
      const response = await fetch('/api/generate-fixes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: results.issues,
          hasReferenceScript: referenceEnabled,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Fix generation failed');
      }

      set({
        isGeneratingFixes: false,
        fixes: data.fixes,
        currentStep: 'fixes',
      });
    } catch (error) {
      console.error('Fix generation error:', error);
      set({
        isGeneratingFixes: false,
        error: error instanceof Error ? error.message : 'Fix generation failed. Please try again.',
      });
    }
  },

  setSelectedCallId: (id: string | null) => set({ selectedCallId: id }),

  goToStep: (step) => set({ currentStep: step }),
}));
