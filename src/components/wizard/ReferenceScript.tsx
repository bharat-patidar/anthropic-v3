'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, RotateCcw, ChevronDown, ChevronUp, SkipForward, Save, Upload, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { defaultReferenceScript } from '@/data/demoData';
import { useSaveLoadTemplates } from '@/hooks/useSaveLoadTemplates';

export function ReferenceScript() {
  const {
    referenceScript,
    referenceEnabled,
    setReferenceScript,
    setReferenceEnabled,
  } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const { templates, saveTemplate, loadTemplate, setDefaultTemplate, getDefaultTemplate, isUsingDatabase, isLoading } = useSaveLoadTemplates('templates_reference_script');

  // Auto-load default template on mount (only once)
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (!isLoading && templates.length > 0 && !hasAutoLoaded.current) {
      const defaultTemplate = getDefaultTemplate();
      if (defaultTemplate) {
        setReferenceScript(defaultTemplate.content);
        hasAutoLoaded.current = true;
      }
    }
  }, [isLoading, templates, getDefaultTemplate, setReferenceScript]);

  // Close template menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTemplateMenu && !target.closest('.template-menu-container')) {
        setShowTemplateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplateMenu]);

  const resetToDefault = () => {
    setReferenceScript(defaultReferenceScript);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    try {
      await saveTemplate(templateName.trim(), referenceScript);
      setTemplateName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleLoad = (templateId: string) => {
    if (!templateId) return;
    const content = loadTemplate(templateId);
    if (content) {
      setReferenceScript(content);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefaultTemplate(templateId);
    } catch (error) {
      console.error('Error setting default template:', error);
      alert('Failed to set default template. Please try again.');
    }
  };

  return (
    <motion.div
      className={`glass-card overflow-hidden transition-opacity ${
        !referenceEnabled ? 'opacity-60' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-[var(--color-navy-700)] cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Reference Script</h3>
            <p className="text-xs text-[var(--color-slate-400)]">
              {referenceEnabled ? 'Enabled' : 'Skipped'} - Optional
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Enable/Skip Toggle */}
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-[var(--color-slate-400)]">
              {referenceEnabled ? 'Enabled' : 'Skipped'}
            </span>
            <button
              className={`toggle-switch ${referenceEnabled ? 'active' : ''}`}
              onClick={() => setReferenceEnabled(!referenceEnabled)}
            />
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--color-slate-400)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--color-slate-400)]" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <motion.div
          className="p-4 space-y-4"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          {!referenceEnabled ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <SkipForward className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm text-amber-300">Reference Script Skipped</p>
                <p className="text-xs text-[var(--color-slate-400)]">
                  Flow Compliance check will be automatically disabled
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--color-slate-300)]">
                  Expected conversation flow / script
                </label>
                <button
                  onClick={resetToDefault}
                  className="btn-secondary flex items-center gap-2 text-sm py-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>

              {/* Save/Load Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Load Template Dropdown */}
                  <div className="flex-1 relative template-menu-container">
                    <button
                      onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                      className="w-full px-3 py-2 bg-[var(--color-navy-800)] border border-[var(--color-navy-700)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                    >
                      <span>Load saved template...</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Custom Template Menu */}
                    {showTemplateMenu && templates.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-navy-800)] border border-[var(--color-navy-700)] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-[var(--color-navy-700)] cursor-pointer group"
                          >
                            <span
                              className="flex-1 text-sm text-white"
                              onClick={() => {
                                handleLoad(template.id);
                                setShowTemplateMenu(false);
                              }}
                            >
                              {template.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(template.id);
                              }}
                              className="ml-2 p-1 hover:bg-[var(--color-navy-600)] rounded"
                              title={template.isDefault ? "Default template" : "Set as default"}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  template.isDefault
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-400 group-hover:text-yellow-400'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => setShowSaveDialog(!showSaveDialog)}
                    className="btn-primary flex items-center gap-2 text-sm py-2 whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>

                {/* Storage Status Indicator */}
                {!isLoading && (
                  <div className="flex items-center justify-end">
                    {isUsingDatabase ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        ✅ Database connected - Templates persist permanently
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        ⚠️  Using local storage - Templates will be lost on redeploy.{' '}
                        <a
                          href="https://vercel.com/docs/storage/vercel-postgres/quickstart"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-amber-300"
                        >
                          Set up database
                        </a>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="glass-card-subtle p-3 space-y-2">
                  <label className="text-xs text-[var(--color-slate-300)]">
                    Template Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-[var(--color-navy-800)] border border-[var(--color-navy-700)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Customer Support Flow"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    <button
                      onClick={handleSave}
                      className="btn-primary text-sm py-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveDialog(false);
                        setTemplateName('');
                      }}
                      className="btn-secondary text-sm py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <textarea
                className="textarea-field"
                value={referenceScript}
                onChange={(e) => setReferenceScript(e.target.value)}
                placeholder="Enter your expected call flow or script..."
                rows={10}
              />
              <p className="text-xs text-[var(--color-slate-400)]">
                This script defines the expected flow for Flow Compliance checking.
                Use markdown format with numbered steps.
              </p>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
