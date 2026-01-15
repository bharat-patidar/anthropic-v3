import { Transcript, DetectedIssue, CheckConfig, IssueType, Severity, Fix } from '@/types';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callOpenAI(
  apiKey: string,
  model: string,
  messages: OpenAIMessage[]
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function analyzeTranscript(
  apiKey: string,
  model: string,
  transcript: Transcript,
  checks: CheckConfig[],
  referenceScript: string | null
): Promise<DetectedIssue[]> {
  const enabledChecks = checks.filter((c) => c.enabled);

  if (enabledChecks.length === 0) {
    return [];
  }

  // Build transcript text
  const transcriptText = transcript.lines
    .map((line, idx) => `[${idx + 1}] ${line.speaker.toUpperCase()}: ${line.text}`)
    .join('\n');

  // Build checks description
  const checksDescription = enabledChecks
    .map((check) => `- ${check.name}: ${check.instructions}`)
    .join('\n');

  const systemPrompt = `You are an expert AI voice bot quality analyst. Your task is to analyze call transcripts and detect issues based on specific checks.

Analyze the following transcript and identify issues based on these enabled checks:
${checksDescription}

${referenceScript ? `Reference Script/Flow:\n${referenceScript}\n` : ''}

For each issue found, provide a JSON object with:
- type: one of [flow_deviation, repetition_loop, language_mismatch, mid_call_restart, quality_issue]
- severity: one of [low, medium, high, critical]
- confidence: number between 0-100
- evidenceSnippet: the exact text from the transcript that demonstrates the issue
- lineNumbers: array of line numbers where the issue occurs
- explanation: detailed explanation of why this is an issue

Return ONLY a JSON array of issues. If no issues are found, return an empty array [].`;

  const userPrompt = `Transcript to analyze:\n${transcriptText}`;

  try {
    const response = await callOpenAI(apiKey, model, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', response);
      return [];
    }

    const issues = JSON.parse(jsonMatch[0]);

    // Convert to DetectedIssue format with IDs
    return issues.map((issue: {
      type: string;
      severity: string;
      confidence: number;
      evidenceSnippet: string;
      lineNumbers: number[];
      explanation: string;
      suggestedFix?: string;
    }, idx: number) => ({
      id: `${transcript.id}-issue-${idx}`,
      callId: transcript.id,
      type: issue.type as IssueType,
      severity: issue.severity as Severity,
      confidence: issue.confidence,
      evidenceSnippet: issue.evidenceSnippet,
      lineNumbers: issue.lineNumbers,
      explanation: issue.explanation,
      suggestedFix: issue.suggestedFix,
    }));
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    throw error;
  }
}

export async function generateFixSuggestions(
  apiKey: string,
  model: string,
  issues: DetectedIssue[],
  transcripts: Transcript[],
  referenceScript: string | null
): Promise<{ scriptFixes: Fix[]; generalFixes: Fix[] }> {
  if (issues.length === 0) {
    return { scriptFixes: [], generalFixes: [] };
  }

  // Group issues by type
  const issuesByType: Record<string, DetectedIssue[]> = {};
  issues.forEach((issue) => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });

  const systemPrompt = `You are an expert AI voice bot developer and prompt engineer. Your task is to generate actionable fix suggestions for detected issues in voice bot call transcripts.

Based on the issues found, generate specific, actionable fixes. Consider:
1. Script/Flow fixes - Changes to the reference script or conversation flow
2. Prompt/Instruction fixes - Improvements to the bot's system prompts or instructions

For each fix suggestion, provide a JSON object with:
- issueType: the type of issue this fix addresses
- problem: concise description of the problem
- suggestion: specific, actionable fix suggestion
- placementHint: where in the script/prompt this should be applied
- exampleResponse: an example of how the bot should respond after the fix
- relatedIssueIds: array of issue IDs this fix addresses

Separate fixes into:
- scriptFixes: Changes to the conversation flow or reference script
- generalFixes: Changes to bot prompts, instructions, or behavior

Return a JSON object with "scriptFixes" and "generalFixes" arrays.`;

  const issuesSummary = issues
    .map(
      (issue) =>
        `Issue ID: ${issue.id}\nType: ${issue.type}\nSeverity: ${issue.severity}\nExplanation: ${issue.explanation}\nEvidence: ${issue.evidenceSnippet}`
    )
    .join('\n\n---\n\n');

  const userPrompt = `Issues detected:\n\n${issuesSummary}\n\n${
    referenceScript ? `Current Reference Script:\n${referenceScript}\n\n` : ''
  }Generate fix suggestions for these issues.`;

  try {
    const response = await callOpenAI(apiKey, model, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON object found in response:', response);
      return { scriptFixes: [], generalFixes: [] };
    }

    const fixesData = JSON.parse(jsonMatch[0]);

    // Add IDs to fixes
    const scriptFixes = (fixesData.scriptFixes || []).map((fix: {
      issueType: string;
      problem: string;
      suggestion: string;
      placementHint: string;
      exampleResponse: string;
      relatedIssueIds: string[];
    }, idx: number) => ({
      ...fix,
      id: `script-fix-${idx}`,
    }));

    const generalFixes = (fixesData.generalFixes || []).map((fix: {
      issueType: string;
      problem: string;
      suggestion: string;
      placementHint: string;
      exampleResponse: string;
      relatedIssueIds: string[];
    }, idx: number) => ({
      ...fix,
      id: `general-fix-${idx}`,
    }));

    return { scriptFixes, generalFixes };
  } catch (error) {
    console.error('Error generating fix suggestions:', error);
    throw error;
  }
}
