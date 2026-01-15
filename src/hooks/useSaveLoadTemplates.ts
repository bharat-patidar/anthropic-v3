import { useState, useEffect } from 'react';

export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export function useSaveLoadTemplates(storageKey: string) {
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load templates from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates([]);
      }
    }
  }, [storageKey]);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(templates));
    }
  }, [templates, storageKey]);

  const saveTemplate = (name: string, content: string) => {
    const newTemplate: Template = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      content,
      createdAt: new Date().toISOString(),
    };

    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const loadTemplate = (id: string): string | null => {
    const template = templates.find((t) => t.id === id);
    return template ? template.content : null;
  };

  return {
    templates,
    saveTemplate,
    deleteTemplate,
    loadTemplate,
  };
}
