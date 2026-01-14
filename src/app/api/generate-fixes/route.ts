import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai';
import { SYSTEM_PROMPT, buildFixGenerationPrompt } from '@/lib/prompts';
import { DetectedIssue, Fix, IssueType, ModelType } from '@/types';

interface GenerateFixesRequest {
  issues: DetectedIssue[];
  hasReferenceScript: boolean;
  model?: ModelType;
}

interface OpenAIFix {
  issueType: IssueType;
  problem: string;
  suggestion: string;
  placementHint: string;
  exampleResponse: string;
}

interface OpenAIFixResponse {
  scriptFixes: OpenAIFix[];
  generalFixes: OpenAIFix[];
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

    const body: GenerateFixesRequest = await request.json();
    const { issues, hasReferenceScript, model = 'gpt-4o-mini' } = body;

    if (!issues || issues.length === 0) {
      return NextResponse.json({
        success: true,
        fixes: {
          scriptFixes: [],
          generalFixes: [],
        },
      });
    }

    // Prepare issues for the prompt
    const issuesForPrompt = issues.map((issue) => ({
      type: issue.type,
      explanation: issue.explanation,
      evidenceSnippet: issue.evidenceSnippet,
      suggestedFix: issue.suggestedFix,
    }));

    // Build the fix generation prompt
    const prompt = buildFixGenerationPrompt(issuesForPrompt, hasReferenceScript);

    // Call OpenAI API
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: 'Empty response from OpenAI' },
        { status: 500 }
      );
    }

    try {
      const fixResponse: OpenAIFixResponse = JSON.parse(responseContent);

      // Convert OpenAI fixes to our Fix format
      let fixIdCounter = 1;

      const scriptFixes: Fix[] = (fixResponse.scriptFixes || []).map((fix) => ({
        id: `fix-${fixIdCounter++}`,
        issueType: fix.issueType,
        problem: fix.problem,
        suggestion: fix.suggestion,
        placementHint: fix.placementHint,
        exampleResponse: fix.exampleResponse,
        relatedIssueIds: issues
          .filter((i) => i.type === fix.issueType)
          .map((i) => i.id),
      }));

      const generalFixes: Fix[] = (fixResponse.generalFixes || []).map((fix) => ({
        id: `fix-${fixIdCounter++}`,
        issueType: fix.issueType,
        problem: fix.problem,
        suggestion: fix.suggestion,
        placementHint: fix.placementHint,
        exampleResponse: fix.exampleResponse,
        relatedIssueIds: issues
          .filter((i) => i.type === fix.issueType)
          .map((i) => i.id),
      }));

      return NextResponse.json({
        success: true,
        fixes: {
          scriptFixes,
          generalFixes,
        },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI fix response:', parseError);
      console.error('Response content:', responseContent);
      return NextResponse.json(
        { error: 'Failed to parse fix suggestions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fix generation error:', error);

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
      { error: 'Fix generation failed', message: String(error) },
      { status: 500 }
    );
  }
}
