import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai';
import { SYSTEM_PROMPT, buildAnalysisPrompt } from '@/lib/prompts';
import { CheckType, Transcript, DetectedIssue, IssueType, Severity } from '@/types';

interface AnalyzeRequest {
  transcripts: Transcript[];
  enabledChecks: CheckType[];
  referenceScript?: string;
}

interface OpenAIIssue {
  type: IssueType;
  severity: Severity;
  confidence: number;
  lineNumbers: number[];
  evidenceSnippet: string;
  explanation: string;
  suggestedFix?: string;
}

interface OpenAIResponse {
  issues: OpenAIIssue[];
  summary: {
    totalIssuesFound: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          message: 'Please set OPENAI_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    const body: AnalyzeRequest = await request.json();
    const { transcripts, enabledChecks, referenceScript } = body;

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json(
        { error: 'No transcripts provided' },
        { status: 400 }
      );
    }

    if (!enabledChecks || enabledChecks.length === 0) {
      return NextResponse.json(
        { error: 'No checks enabled' },
        { status: 400 }
      );
    }

    const allIssues: DetectedIssue[] = [];
    let issueIdCounter = 1;

    // Analyze each transcript
    for (const transcript of transcripts) {
      // Convert transcript to text format
      const transcriptText = transcript.lines
        .map((line, index) => `${index + 1}. [${line.speaker.toUpperCase()}]: ${line.text}${line.language && line.language !== 'en' ? ` (${line.language})` : ''}`)
        .join('\n');

      // Build the analysis prompt
      const prompt = buildAnalysisPrompt(
        transcriptText,
        enabledChecks,
        referenceScript
      );

      // Call OpenAI API
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        console.error('Empty response from OpenAI for transcript:', transcript.id);
        continue;
      }

      try {
        const analysisResult: OpenAIResponse = JSON.parse(responseContent);

        // Convert OpenAI issues to our DetectedIssue format
        for (const issue of analysisResult.issues) {
          allIssues.push({
            id: `issue-${issueIdCounter++}`,
            callId: transcript.id,
            type: issue.type,
            severity: issue.severity,
            confidence: issue.confidence,
            evidenceSnippet: issue.evidenceSnippet,
            lineNumbers: issue.lineNumbers,
            explanation: issue.explanation,
            suggestedFix: issue.suggestedFix,
          });
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Response content:', responseContent);
      }
    }

    // Calculate analytics
    const totalCalls = transcripts.length;
    const callsWithIssues = new Set(allIssues.map((i) => i.callId)).size;

    const issuesByType: Record<IssueType, number> = {
      flow_deviation: 0,
      repetition_loop: 0,
      language_mismatch: 0,
      mid_call_restart: 0,
      quality_issue: 0,
    };

    const severityDistribution: Record<Severity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    allIssues.forEach((issue) => {
      issuesByType[issue.type]++;
      severityDistribution[issue.severity]++;
    });

    const languageMismatchRate =
      totalCalls > 0
        ? (issuesByType.language_mismatch / totalCalls) * 100
        : 0;

    return NextResponse.json({
      success: true,
      results: {
        totalCalls,
        callsWithIssues,
        issues: allIssues,
        issuesByType,
        severityDistribution,
        languageMismatchRate,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // Check for specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Analysis failed', message: String(error) },
      { status: 500 }
    );
  }
}
