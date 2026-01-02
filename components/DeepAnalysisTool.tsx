import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from './Card';

const ANALYSIS_PROMPT_TEMPLATE = `
# Deep File Analysis Prompt

**Role & Objective**
Act as a world-class senior engineer and technical analyst. Perform a deep, expert-level analysis of the provided file. Prevent shallow summaries; produce thorough, structured, long-form analysis that treats the file as a meaningful artifact.

**Core Principles**
- One file = one full analysis.
- Depth is mandatory.
- Reveal intent, skill, tradeoffs, meaning, risk, and future potential.
- Output must be readable, structured, and opinionated.

**Analysis Structure (Required)**

1. **File Identity & Context**
   - What the file is and why it exists.
   - Implications of the file name and type.
   - Architectural placement and lifecycle role.
   - Failure impact (what breaks if removed).

2. **Purpose & Intent**
   - Primary and emergent purposes.
   - Implicit assumptions and constraints.
   - Anti-use cases.

3. **Skills & Knowledge Embedded**
   - Technical skills and domain expertise required.
   - Experience level for safe modification.
   - Common misunderstandings vs. expert recognition.

4. **Craft, Structure & Design Decisions**
   - Patterns used (intentional or accidental).
   - Complexity justification and tradeoffs.
   - Evidence of iteration or shortcuts.
   - Fragility vs. resilience.

5. **Semantic & Conceptual Meaning**
   - Communication to other developers/systems.
   - Values encoded (speed, safety, flexibility).
   - Creator's priorities and mindset.

6. **Current Functional Role**
   - Usage, dependencies (upstream/downstream).
   - Performance/reliability implications.
   - Operational importance.

7. **Risk & Failure Analysis**
   - Failure modes (silent vs. loud).
   - Security/data risks.
   - Scaling and maintenance risks.

8. **Evolution & Refactor Potential**
   - Likely evolution and refactoring signals.
   - Safe vs. dangerous modification paths.
   - Modernization opportunities.

9. **Summary Narrative**
   - Cohesive wrap-up of significance.
   - Why ignoring this file would be a mistake.

**Input**
File Name: {{FILENAME}}
File Content:
{{CONTENT}}
`;

const DeepAnalysisTool: React.FC = () => {
    const [fileName, setFileName] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!fileName.trim() || !fileContent.trim()) {
            setError('Please provide both a file name and content.');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            const prompt = ANALYSIS_PROMPT_TEMPLATE
                .replace('{{FILENAME}}', fileName)
                .replace('{{CONTENT}}', fileContent);

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    temperature: 0.7,
                }
            });

            setAnalysis(response.text || 'No analysis generated.');
        } catch (err) {
            setError((err as Error).message || 'An error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Deep File Analysis (Gemini 3 Pro)">
            <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                    Perform a comprehensive, structured analysis of any file code, config, or documentation to reveal hidden intent, quality, and risks.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-300 mb-1">File Name</label>
                        <input 
                            type="text" 
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500"
                            placeholder="e.g., AuthController.ts"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">File Content</label>
                    <textarea 
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        className="w-full h-48 bg-gray-700 border border-gray-600 rounded-md p-3 text-white text-sm font-mono focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500"
                        placeholder="Paste file content here..."
                    />
                </div>

                <div className="flex items-center justify-between">
                     <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg text-white font-medium shadow-lg disabled:opacity-50 transition-all transform active:scale-95"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Analyzing Artifact...</span>
                            </div>
                        ) : (
                            'Run Deep Analysis'
                        )}
                    </button>
                    {error && <span className="text-red-400 text-sm">{error}</span>}
                </div>

                {analysis && (
                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Analysis Report</h3>
                        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                            <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                                {analysis}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default DeepAnalysisTool;
