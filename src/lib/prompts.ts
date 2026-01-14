import { CheckType } from '@/types';

export const SYSTEM_PROMPT = `You are an expert AI quality analyst specializing in voice bot and conversational AI analysis. Your job is to analyze customer support call transcripts and identify issues, anomalies, and areas for improvement.

You provide detailed, actionable analysis with specific evidence from the transcripts. You are thorough but concise, focusing on the most impactful issues.

Always respond in valid JSON format as specified in the user prompt.`;

export const CHECK_PROMPTS: Record<CheckType, string> = {
  flow_compliance: `Analyze the transcript for FLOW COMPLIANCE issues by comparing it against the reference script.

Look for:
- Skipped steps (e.g., missing identity verification before account access)
- Out-of-order actions (steps performed in wrong sequence)
- Missing required confirmations or acknowledgments
- Protocol violations (e.g., canceling subscription without verification)

For each issue found, provide:
- The specific step that was skipped or violated
- The line numbers where the violation occurred
- Severity (critical/high/medium/low)
- A confidence score (0-100)
- Brief explanation of why this is problematic`,

  repetition: `Analyze the transcript for REPETITION and LOOPING issues.

Look for:
- Bot repeating the same or very similar responses multiple times
- Suggesting the same solution after customer says they already tried it
- Getting stuck in a loop asking the same questions
- Parroting phrases without adding value

For each issue found, provide:
- The repeated content
- Line numbers where repetition occurs
- Severity (critical if 3+ repetitions, high if 2, medium otherwise)
- Confidence score (0-100)
- Brief explanation of impact on customer experience`,

  language_alignment: `Analyze the transcript for LANGUAGE ALIGNMENT issues.

Look for:
- Customer switching to a different language (Hindi, Spanish, etc.)
- Bot continuing to respond in English after language switch
- Failure to acknowledge customer's language preference
- Missing offer to transfer to appropriate language support

For each issue found, provide:
- The language the customer switched to
- Line numbers where mismatch occurs
- Severity (high if customer explicitly requests language change, medium otherwise)
- Confidence score (0-100)
- Brief explanation`,

  restart_reset: `Analyze the transcript for MID-CALL RESTART or RESET issues.

Look for:
- Bot suddenly greeting customer again mid-conversation ("Hello! Welcome to...")
- Complete loss of conversation context
- Bot asking for information already provided
- Unexpected topic resets

For each issue found, provide:
- What context was lost
- Line numbers where reset occurred
- Severity (critical - this indicates serious technical issues)
- Confidence score (0-100)
- Brief explanation of what went wrong`,

  general_quality: `Analyze the transcript for GENERAL QUALITY issues (independent of any reference script).

Look for:
- Unhelpful or vague responses
- Poor tone or lack of empathy when customer is frustrated
- Missed opportunities to help or escalate
- Abrupt transitions or confusing responses
- Failure to properly close the conversation
- Not acknowledging customer emotions

For each issue found, provide:
- The quality issue type
- Line numbers where issue occurs
- Severity (based on impact on customer experience)
- Confidence score (0-100)
- Suggested improvement`,
};

export function buildAnalysisPrompt(
  transcript: string,
  enabledChecks: CheckType[],
  referenceScript?: string
): string {
  let prompt = `Analyze the following customer support call transcript:\n\n`;
  prompt += `=== TRANSCRIPT ===\n${transcript}\n=== END TRANSCRIPT ===\n\n`;

  if (referenceScript && enabledChecks.includes('flow_compliance')) {
    prompt += `=== REFERENCE SCRIPT ===\n${referenceScript}\n=== END REFERENCE SCRIPT ===\n\n`;
  }

  prompt += `Perform the following checks:\n\n`;

  enabledChecks.forEach((check, index) => {
    prompt += `${index + 1}. ${check.toUpperCase().replace('_', ' ')}\n`;
    prompt += `${CHECK_PROMPTS[check]}\n\n`;
  });

  prompt += `
IMPORTANT: Respond with a valid JSON object in this exact format:
{
  "issues": [
    {
      "type": "flow_deviation|repetition_loop|language_mismatch|mid_call_restart|quality_issue",
      "severity": "critical|high|medium|low",
      "confidence": <number 0-100>,
      "lineNumbers": [<line numbers as integers>],
      "evidenceSnippet": "<exact quote from transcript showing the issue>",
      "explanation": "<brief explanation of what went wrong>",
      "suggestedFix": "<short suggestion for improvement>"
    }
  ],
  "summary": {
    "totalIssuesFound": <number>,
    "criticalCount": <number>,
    "highCount": <number>,
    "mediumCount": <number>,
    "lowCount": <number>
  }
}

Map check types to issue types as follows:
- flow_compliance -> flow_deviation
- repetition -> repetition_loop
- language_alignment -> language_mismatch
- restart_reset -> mid_call_restart
- general_quality -> quality_issue

If no issues are found for a check, still include it in the response with an empty array for that check type.
Be thorough but focus on real issues - don't flag minor or ambiguous cases.`;

  return prompt;
}

export function buildFixGenerationPrompt(
  issues: Array<{
    type: string;
    explanation: string;
    evidenceSnippet: string;
    suggestedFix?: string;
  }>,
  hasReferenceScript: boolean
): string {
  let prompt = `Based on the following issues detected in voice bot call transcripts, generate detailed fix suggestions.

=== DETECTED ISSUES ===
${JSON.stringify(issues, null, 2)}
=== END ISSUES ===

Generate actionable fix suggestions. Group similar issues together and provide:

1. For each unique problem pattern:
   - Clear description of the problem
   - Detailed suggestion for how to fix it in the bot's prompts/scripts
   - Where in the conversation flow to add this fix
   - An example of what the improved bot response should look like

`;

  if (hasReferenceScript) {
    prompt += `
Since a reference script was used, provide TWO categories of fixes:

1. SCRIPT FIXES (scriptFixes): Fixes related to following the reference script/flow
   - Focus on flow compliance, step ordering, verification requirements

2. GENERAL FIXES (generalFixes): Fixes for general quality issues
   - Focus on tone, language handling, repetition avoidance, context management
`;
  } else {
    prompt += `
Provide fixes in the GENERAL FIXES category (generalFixes) since no reference script was used.
`;
  }

  prompt += `
IMPORTANT: Respond with a valid JSON object in this exact format:
{
  "scriptFixes": [
    {
      "issueType": "flow_deviation|repetition_loop|language_mismatch|mid_call_restart|quality_issue",
      "problem": "<clear description of the problem>",
      "suggestion": "<detailed fix suggestion>",
      "placementHint": "<where to add this in the bot's logic>",
      "exampleResponse": "<example of improved bot response>"
    }
  ],
  "generalFixes": [
    {
      "issueType": "flow_deviation|repetition_loop|language_mismatch|mid_call_restart|quality_issue",
      "problem": "<clear description of the problem>",
      "suggestion": "<detailed fix suggestion>",
      "placementHint": "<where to add this in the bot's logic>",
      "exampleResponse": "<example of improved bot response>"
    }
  ]
}

Guidelines:
- Cluster similar issues into single fixes (max 5-7 fixes total)
- Make suggestions specific and actionable
- Example responses should be realistic and natural
- If no script fixes needed, return empty array for scriptFixes
- Focus on the most impactful improvements`;

  return prompt;
}
