# AI Agent Control Center

A control center to test voice-bot calls using transcripts, detect issues/anomalies, show error analytics, and suggest fixes to prompts/scripts — in one simple flow.

**Built by Convin**

## Features

- **AI-Powered Analysis**: Uses OpenAI GPT-4 to analyze voice bot transcripts for issues
- **5 Check Types**:
  - Flow Compliance (Script Adherence)
  - Repetition / Looping
  - Language Alignment
  - Restart / Reset Detection
  - General Quality (Transcript-only)
- **Real-time Analytics**: KPI cards, charts, and issue tables
- **Fix Suggestions**: AI-generated actionable fixes with copy/export functionality
- **Premium UI**: Glassmorphism design with smooth animations

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd anthropic-v3
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Add environment variable:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
5. Click "Deploy"

### Option 2: Deploy via CLI

```bash
npm install -g vercel
vercel
```

When prompted, add your `OPENAI_API_KEY` environment variable.

## Usage Flow

1. **Input**: Load demo transcripts or paste your own
2. **Configure**: Enable/disable checks, edit reference script
3. **Run Analysis**: AI analyzes transcripts for issues
4. **View Results**: See KPIs, charts, and issue details
5. **Generate Fixes**: Get AI-suggested improvements

## Demo Data

The app comes with pre-loaded demo transcripts containing:
- Flow deviation (skipped verification steps)
- Repetition loops (bot repeating suggestions)
- Language mismatch (customer switches to Hindi)
- Mid-call restart (bot greeting again mid-conversation)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State**: Zustand
- **AI**: OpenAI GPT-4

## API Endpoints

- `POST /api/analyze` - Analyze transcripts for issues
- `POST /api/generate-fixes` - Generate fix suggestions based on detected issues

## Cost Estimation

Each analysis run costs approximately $0.01-0.10 depending on:
- Number of transcripts
- Length of transcripts
- Number of enabled checks

## License

MIT
