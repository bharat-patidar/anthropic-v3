'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { TranscriptInput } from '@/components/wizard/TranscriptInput';
import { ReferenceScript } from '@/components/wizard/ReferenceScript';
import { ChecksConfig } from '@/components/wizard/ChecksConfig';
import { RunButton } from '@/components/wizard/RunButton';
import { KPICards } from '@/components/results/KPICards';
import { Charts } from '@/components/results/Charts';
import { IssueTable } from '@/components/results/IssueTable';
import { CallViewer } from '@/components/results/CallViewer';
import { FixesPanel } from '@/components/fixes/FixesPanel';
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle, X, Loader2 } from 'lucide-react';
import { demoBatchTranscripts } from '@/data/demoData';

function ErrorBanner() {
  const { error, clearError } = useAppStore();

  if (!error) return null;

  return (
    <motion.div
      className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-4 mb-6 flex items-start gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-rose-300 font-medium">Error</h4>
        <p className="text-rose-200/80 text-sm mt-1">{error}</p>
        {error.includes('API key') && (
          <p className="text-rose-200/60 text-xs mt-2">
            Please set the OPENAI_API_KEY environment variable in your deployment settings.
          </p>
        )}
      </div>
      <button
        onClick={clearError}
        className="p-1 hover:bg-rose-500/20 rounded transition-colors"
      >
        <X className="w-4 h-4 text-rose-400" />
      </button>
    </motion.div>
  );
}

function RunWizardPage() {
  const { setTranscripts } = useAppStore();

  // Load demo batch data by default
  useEffect(() => {
    setTranscripts(demoBatchTranscripts);
  }, [setTranscripts]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Run Analysis</h2>
        <p className="text-[var(--color-slate-400)]">
          Configure your transcript input, reference script, and checks to analyze voice bot calls.
        </p>
      </div>

      <ErrorBanner />

      <TranscriptInput />
      <ReferenceScript />
      <ChecksConfig />
      <RunButton />
    </motion.div>
  );
}

function RunningPage() {
  const { runProgress, transcripts, checks } = useAppStore();
  const enabledChecks = checks.filter((c) => c.enabled);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="glass-card p-12 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing with AI...</h2>
        <p className="text-[var(--color-slate-400)] mb-6">
          OpenAI is analyzing {transcripts.length} call{transcripts.length !== 1 ? 's' : ''} with {enabledChecks.length} check{enabledChecks.length !== 1 ? 's' : ''}
        </p>
        <div className="progress-bar mb-2">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${runProgress}%` }}
          />
        </div>
        <span className="text-sm text-[var(--color-slate-400)]">
          {runProgress < 70 ? 'Sending to OpenAI...' : runProgress < 90 ? 'Processing results...' : 'Almost done...'}
        </span>
      </div>
    </motion.div>
  );
}

function ResultsPage() {
  const { goToStep, generateFixes, isGeneratingFixes, results } = useAppStore();

  const handleGenerateFixes = () => {
    generateFixes();
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analysis Results</h2>
          <p className="text-[var(--color-slate-400)]">
            AI-powered analysis found {results?.issues.length || 0} issue{results?.issues.length !== 1 ? 's' : ''} in your voice bot calls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => goToStep('input')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Input
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleGenerateFixes}
            disabled={isGeneratingFixes}
          >
            {isGeneratingFixes ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Fixes...
              </>
            ) : (
              <>
                Next: Generate Fixes
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <ErrorBanner />

      <KPICards />
      <Charts />
      <IssueTable />
      <CallViewer />
    </motion.div>
  );
}

function FixesPage() {
  const { goToStep } = useAppStore();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">AI-Generated Fix Suggestions</h2>
          <p className="text-[var(--color-slate-400)]">
            Actionable fixes generated by AI based on the detected issues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => goToStep('results')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => goToStep('input')}
          >
            Start New Run
          </button>
        </div>
      </div>

      <FixesPanel />
    </motion.div>
  );
}

export default function Home() {
  const { currentStep } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'input' && <RunWizardPage key="input" />}
          {currentStep === 'running' && <RunningPage key="running" />}
          {currentStep === 'results' && <ResultsPage key="results" />}
          {currentStep === 'fixes' && <FixesPage key="fixes" />}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
