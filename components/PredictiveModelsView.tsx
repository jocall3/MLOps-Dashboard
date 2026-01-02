import React, { useContext, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import Card from './Card';
import DeepAnalysisTool from './DeepAnalysisTool';
import { DataContext, ExtendedDataContextType } from '../context/DataContext';
import { 
    MLModel, MLModelExtended, MLAlertExtended, ModelDeploymentStatus, ModelMetric, HPOCTrial, 
    DataDriftReport, HyperparameterOptimizationRun, ModelDeployment, AuditLogEntry, XAIInsight 
} from '../types';

// --- Sub-components (Helpers) ---

export const StatusBadge: React.FC<{ status: MLModel['status'] | ModelDeploymentStatus }> = ({ status }) => {
    const colors: Record<string, string> = {
        'Production': 'bg-green-500/20 text-green-300',
        'Staging': 'bg-cyan-500/20 text-cyan-300',
        'Training': 'bg-yellow-500/20 text-yellow-300 animate-pulse',
        'Archived': 'bg-gray-500/20 text-gray-300',
        'Deployed': 'bg-green-500/20 text-green-300',
        'Rolling Update': 'bg-indigo-500/20 text-indigo-300 animate-pulse',
        'A/B Testing': 'bg-purple-500/20 text-purple-300',
        'Canary': 'bg-orange-500/20 text-orange-300',
        'Inactive': 'bg-gray-700/20 text-gray-400',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-500/20 text-gray-300'}`}>{status}</span>;
};

export const MetricDisplay: React.FC<{ label: string; value: string | number; unit?: string; tooltip?: string }> = ({ label, value, unit, tooltip }) => (
    <div className="flex flex-col p-3 bg-gray-700/50 rounded-lg" title={tooltip}>
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xl font-bold text-white">{value}{unit}</span>
    </div>
);

export const ModelComparisonChart: React.FC<{ models: MLModelExtended[]; metric: keyof MLModelExtended['metricsHistory'][0] }> = ({ models, metric }) => {
    const data = useMemo(() => {
        if (models.length === 0) return [];
        return models.map(model => ({
            name: `${model.name} v${model.version}`,
            value: model.metricsHistory?.[model.metricsHistory.length - 1]?.[metric] || 0
        }));
    }, [models, metric]);

    const formatMetric = (value: number) => {
        if (metric.includes('accuracy') || metric.includes('precision') || metric.includes('recall') || metric.includes('f1Score')) {
            return `${(value * 100).toFixed(2)}%`;
        }
        return value.toFixed(2);
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => formatMetric(value as number)} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} formatter={(value: number) => formatMetric(value)} />
                <Legend />
                <Bar dataKey="value" name={String(metric)} fill="#06b6d4" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const FeatureImportanceChart: React.FC<{ data: { feature: string; importance: number }[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis dataKey="feature" type="category" stroke="#9ca3af" fontSize={12} width={100} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
            <Bar dataKey="importance" fill="#facc15" name="Importance" />
        </BarChart>
    </ResponsiveContainer>
);

export const HPOTrialsChart: React.FC<{ trials: HPOCTrial[]; metricKey: string }> = ({ trials, metricKey }) => {
    const data = useMemo(() => trials.map((t, i) => ({
        ...t,
        index: i + 1
    })), [trials]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <XAxis dataKey="index" stroke="#9ca3af" fontSize={12} label={{ value: 'Trial Number', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9ca3af" fontSize={12} label={{ value: metricKey, angle: -90, position: 'insideLeft', offset: 0 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                <Legend />
                <Line type="monotone" dataKey="metricValue" stroke="#8884d8" name={metricKey} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export const DataDriftChart: React.FC<{ data: DataDriftReport[] }> = ({ data }) => {
    const chartData = useMemo(() => data.map(d => ({
        date: d.timestamp.split('T')[0],
        overallDriftScore: d.overallDriftScore
    })), [data]);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                <Legend />
                <Line type="monotone" dataKey="overallDriftScore" stroke="#eab308" name="Overall Drift Score" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export const ModelCostChart: React.FC<{ data: Exclude<MLModelExtended['costHistory'], undefined> }> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" domain={[ 'dataMin - 1', 'dataMax + 1' ]} unit="$" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" domain={[ 'dataMin - 1', 'dataMax + 1' ]} unit="Hrs" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#22c55e" name="Cost ($)" />
                <Line yAxisId="right" type="monotone" dataKey="cpuHours" stroke="#f97316" name="CPU Hours" />
                <Line yAxisId="right" type="monotone" dataKey="gpuHours" stroke="#a855f7" name="GPU Hours" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export const DeploymentMetricsChart: React.FC<{ metrics: ModelMetric[] }> = ({ metrics }) => {
    const data = useMemo(() => metrics.map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString(),
        requests: m.requestsPerSecond,
        errors: m.errorRate * 100, // percentage
        latency: m.avgLatencyMs,
        cpu: m.cpuUtilization * 100,
        memory: m.memoryUtilization * 100,
        accuracy: m.predictionAccuracy ? m.predictionAccuracy * 100 : undefined
    })), [metrics]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} label={{ value: 'Req/s | Latency (ms)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} label={{ value: '% | Error %', angle: 90, position: 'insideRight' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#8884d8" name="Requests/s" />
                <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#82ca9d" name="Avg Latency (ms)" />
                <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#ffc658" name="Error Rate (%)" />
                <Line yAxisId="right" type="monotone" dataKey="cpu" stroke="#ff7300" name="CPU Util (%)" />
                <Line yAxisId="right" type="monotone" dataKey="memory" stroke="#00c49f" name="Mem Util (%)" />
                {data.some(d => d.accuracy !== undefined) && <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#ff4d4d" name="Accuracy (%)" />}
            </LineChart>
        </ResponsiveContainer>
    );
};

export const FeatureDistributionChart: React.FC<{ data: { baseline: { [value: string]: number }; current: { [value: string]: number } } }> = ({ data }) => {
    const chartData = useMemo(() => {
        const allKeys = new Set([...Object.keys(data.baseline), ...Object.keys(data.current)]);
        return Array.from(allKeys).map(key => ({
            name: key,
            baseline: data.baseline[key] || 0,
            current: data.current[key] || 0,
        }));
    }, [data]);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                <Legend />
                <Bar dataKey="baseline" fill="#06b6d4" name="Baseline" />
                <Bar dataKey="current" fill="#facc15" name="Current" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const ModelRadarChart: React.FC<{ models: MLModelExtended[]; metrics: string[] }> = ({ models, metrics }) => {
    const data = useMemo(() => {
        if (models.length === 0) return [];
        const maxValues: { [key: string]: number } = {};
        metrics.forEach(m => {
            maxValues[m] = Math.max(...models.map(model => (model.metricsHistory?.[model.metricsHistory.length - 1]?.[m as keyof MLModelExtended['metricsHistory'][0]] || 0) as number));
        });

        return models.map(model => {
            const latestMetrics = model.metricsHistory?.[model.metricsHistory.length - 1] || {};
            const item: { [key: string]: string | number } = { model: model.name };
            metrics.forEach(m => {
                const value = (latestMetrics[m as keyof MLModelExtended['metricsHistory'][0]] || 0) as number;
                item[m] = value;
                item[`${m}_normalized`] = maxValues[m] > 0 ? value / maxValues[m] : 0;
            });
            return item;
        });
    }, [models, metrics]);

    const formatTick = (value: number) => {
        if (value === 0) return '0';
        return (value * 100).toFixed(0);
    };

    return (
        <ResponsiveContainer width="100%" height={350}>
            <RadarChart outerRadius={90} data={data}>
                <PolarGrid stroke="#4b5563" />
                <PolarAngleAxis dataKey="model" stroke="#9ca3af" fontSize={12} />
                <PolarRadiusAxis angle={90} domain={[0, 1]} stroke="#9ca3af" fontSize={10} tickFormatter={formatTick} />
                {models.map((model, index) => (
                    <Radar key={model.id} name={`${model.name} v${model.version}`} dataKey={metrics.map(m => `${m}_normalized`)} stroke={`hsl(${index * 137}, 70%, 50%)`} fill={`hsl(${index * 137}, 70%, 50%)`} fillOpacity={0.6} />
                ))}
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                <Legend />
            </RadarChart>
        </ResponsiveContainer>
    );
};


export const HPOConfigForm: React.FC<{ onRun: (config: any) => void; isLoading: boolean; onGenerate: (prompt: string) => Promise<string | null> }> = ({ onRun, isLoading, onGenerate }) => {
    const [strategy, setStrategy] = useState('Bayesian Optimization');
    const [learningRateMin, setLearningRateMin] = useState('0.0001');
    const [learningRateMax, setLearningRateMax] = useState('0.1');
    const [batchSizes, setBatchSizes] = useState('16,32,64');
    const [numLayersMin, setNumLayersMin] = useState('2');
    const [numLayersMax, setNumLayersMax] = useState('5');
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const config = {
            strategy,
            searchSpace: {
                learningRate: { type: 'float', min: parseFloat(learningRateMin), max: parseFloat(learningRateMax) },
                batchSize: { type: 'categorical', values: batchSizes.split(',').map(Number) },
                numLayers: { type: 'int', min: parseInt(numLayersMin), max: parseInt(numLayersMax) }
            }
        };
        onRun(config);
    };

    const handleGenerateAISuggestions = async () => {
        setIsAiGenerating(true);
        const prompt = `Generate hyperparameter optimization suggestions for a typical classification model. Suggest reasonable ranges for learningRate (float), batchSize (categorical list), and number of layers (integer range). Explain why these ranges are good. Format as a brief professional paragraph.`;
        const response = await onGenerate(prompt);
        setAiSuggestions(response || "Could not generate AI suggestions.");
        setIsAiGenerating(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Strategy</label>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-white">
                    <option value="Bayesian Optimization">Bayesian Optimization</option>
                    <option value="Grid Search">Grid Search</option>
                    <option value="Random Search">Random Search</option>
                </select>
            </div>
            <fieldset className="border border-gray-600 p-4 rounded-md space-y-3">
                <legend className="text-sm font-medium text-gray-300 px-2">Search Space</legend>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Learning Rate (min)</label>
                    <input type="number" step="0.0001" value={learningRateMin} onChange={(e) => setLearningRateMin(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Learning Rate (max)</label>
                    <input type="number" step="0.0001" value={learningRateMax} onChange={(e) => setLearningRateMax(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Batch Sizes (comma-separated)</label>
                    <input type="text" value={batchSizes} onChange={(e) => setBatchSizes(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" placeholder="e.g., 16,32,64" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Num Layers (min)</label>
                    <input type="number" step="1" value={numLayersMin} onChange={(e) => setNumLayersMin(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Num Layers (max)</label>
                    <input type="number" step="1" value={numLayersMax} onChange={(e) => setNumLayersMax(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                </div>
            </fieldset>
            <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-grow px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white disabled:opacity-50">
                    {isLoading ? 'Running HPO...' : 'Start HPO Run'}
                </button>
                <button type="button" onClick={handleGenerateAISuggestions} disabled={isAiGenerating} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white disabled:opacity-50">
                    {isAiGenerating ? 'Generating...' : 'AI Suggest'}
                </button>
            </div>
            {aiSuggestions && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
                    <p className="font-semibold text-white">AI Suggestions:</p>
                    <p className="whitespace-pre-line">{aiSuggestions}</p>
                </div>
            )}
        </form>
    );
};

export const DeploymentConfigurationForm: React.FC<{
    model: MLModelExtended;
    onDeploy: (environment: string, trafficSplit?: { [modelId: string]: number }) => void;
    onGenerateAISuggestions: (prompt: string) => Promise<string | null>;
    isLoading: boolean;
}> = ({ model, onDeploy, onGenerateAISuggestions, isLoading }) => {
    const [environment, setEnvironment] = useState('production');
    const [trafficSplitConfig, setTrafficSplitConfig] = useState('100'); // 100 for single, 10 for canary, etc.
    const [partnerModelId, setPartnerModelId] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let split: { [modelId: string]: number } | undefined = undefined;
        if (environment === 'canary' || environment === 'ab_test') {
            const currentModelShare = parseFloat(trafficSplitConfig) / 100;
            split = { [model.id]: currentModelShare };
            if (partnerModelId && currentModelShare < 1) {
                split[partnerModelId] = 1 - currentModelShare;
            } else if (currentModelShare < 1) {
                // If no partner model, assume remaining traffic goes to current production model (not this new one)
                split['current_production'] = 1 - currentModelShare;
            }
        }
        onDeploy(environment, split);
    };

    const handleGenerateAISuggestions = async () => {
        setIsAiGenerating(true);
        const prompt = `Given model "${model.name} v${model.version}" with accuracy ${model.accuracy}%, suggest appropriate deployment strategies (e.g., direct, canary, A/B) for staging and production environments. Include considerations for traffic splitting, rollback plans, and monitoring.`;
        const response = await onGenerateAISuggestions(prompt);
        setAiSuggestions(response || "Could not generate AI deployment suggestions.");
        setIsAiGenerating(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Deploy {model.name} v{model.version}</h3>
            <div>
                <label className="block text-sm font-medium text-gray-300">Environment</label>
                <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white">
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                    <option value="canary">Canary Release</option>
                    <option value="ab_test">A/B Test</option>
                </select>
            </div>
            {(environment === 'canary' || environment === 'ab_test') && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Traffic Split for this Model (%)</label>
                        <input type="number" min="0" max="100" value={trafficSplitConfig} onChange={(e) => setTrafficSplitConfig(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Compare with Model ID (optional, e.g., current production model)</label>
                        <input type="text" value={partnerModelId} onChange={(e) => setPartnerModelId(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" placeholder="e.g., model-XYZ" />
                    </div>
                </>
            )}
            <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-grow px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50">
                    {isLoading ? 'Deploying...' : 'Deploy Model'}
                </button>
                <button type="button" onClick={handleGenerateAISuggestions} disabled={isAiGenerating} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white disabled:opacity-50">
                    {isAiGenerating ? 'Generating...' : 'AI Advise'}
                </button>
            </div>
            {aiSuggestions && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                    <p className="font-semibold text-white">AI Deployment Advice:</p>
                    <p className="whitespace-pre-line">{aiSuggestions}</p>
                </div>
            )}
        </form>
    );
};

export const AlertConfigurationForm: React.FC<{
    modelId: string;
    onSave: (alert: MLAlertExtended) => void;
    onGenerateAISuggestions: (prompt: string) => Promise<string | null>;
    isLoading: boolean;
}> = ({ modelId, onSave, onGenerateAISuggestions, isLoading }) => {
    const [metric, setMetric] = useState('accuracy_drop');
    const [threshold, setThreshold] = useState('0.05');
    const [severity, setSeverity] = useState<MLAlertExtended['severity']>('High');
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAlert: MLAlertExtended = {
            id: uuidv4(),
            modelId: modelId,
            modelName: `Model ${modelId}`, 
            metric,
            threshold: parseFloat(threshold),
            currentValue: 0, 
            triggeredAt: new Date().toISOString(),
            status: 'Active',
            severity,
            message: `Alert configured for ${metric} on model ${modelId}. Threshold: ${threshold}.`
        };
        onSave(newAlert);
    };

    const handleGenerateAISuggestions = async () => {
        setIsAiGenerating(true);
        const prompt = `Suggest key performance indicators (KPIs) and reasonable thresholds for setting up alerts on a machine learning model. Consider accuracy, latency, error rate, and data drift. Provide a brief, professional summary.`;
        const response = await onGenerateAISuggestions(prompt);
        setAiSuggestions(response || "Could not generate AI alert suggestions.");
        setIsAiGenerating(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Configure New Alert</h3>
            <div>
                <label className="block text-sm font-medium text-gray-300">Metric</label>
                <select value={metric} onChange={(e) => setMetric(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white">
                    <option value="accuracy_drop">Accuracy Drop</option>
                    <option value="latency_spike">Latency Spike (ms)</option>
                    <option value="error_rate_increase">Error Rate Increase (%)</option>
                    <option value="data_drift">Data Drift Score</option>
                    <option value="feature_value_anomaly">Feature Value Anomaly</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Threshold</label>
                <input type="number" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as MLAlertExtended['severity'])} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-grow px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Create Alert'}
                </button>
                <button type="button" onClick={handleGenerateAISuggestions} disabled={isAiGenerating} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white disabled:opacity-50">
                    {isAiGenerating ? 'Generating...' : 'AI Tips'}
                </button>
            </div>
            {aiSuggestions && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                    <p className="font-semibold text-white">AI Alerting Tips:</p>
                    <p className="whitespace-pre-line">{aiSuggestions}</p>
                </div>
            )}
        </form>
    );
};

export const GovernanceAuditLog: React.FC<{ logs: AuditLogEntry[] }> = ({ logs }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actor</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{log.actor}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400">{log.action.replace(/_/g, ' ')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{log.targetType} ({log.targetId.substring(0, 8)})</td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                                {Object.entries(log.details).map(([key, value]) => (
                                    <div key={key} className="flex gap-1">
                                        <span className="font-semibold text-gray-300">{key}:</span>
                                        <span className="text-gray-400">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                    </div>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const FairnessBiasReport: React.FC<{ model: MLModelExtended; onGenerate: (prompt: string) => Promise<string | null> }> = ({ model, onGenerate }) => {
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateFairnessReport = async () => {
        setIsLoading(true);
        setReport('');
        try {
            const prompt = `Generate a fairness and bias assessment report for an ML model. Model details: Name=${model.name}, Version=${model.version}, Accuracy=${model.accuracy}%. Assume it processes data with demographic attributes. Discuss potential sources of bias (e.g., data, algorithm), methods for detection (e.g., disparate impact, equal opportunity), and mitigation strategies.`;
            const aiReport = await onGenerate(prompt);
            setReport(aiReport || "Could not generate fairness and bias report.");
        } catch (error) {
            setReport("Error generating report: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Fairness and Bias Assessment for {model.name} v{model.version}</h3>
            <button onClick={generateFairnessReport} disabled={isLoading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white disabled:opacity-50">
                {isLoading ? 'Generating Report...' : 'Generate Fairness Report (AI)'}
            </button>
            {report && (
                <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-line">
                    {report}
                </div>
            )}
            {!report && !isLoading && (
                <p className="text-gray-500">Click "Generate Fairness Report" to get an AI-powered assessment of potential fairness and bias issues.</p>
            )}
        </div>
    );
};

// --- Main View Component ---

const PredictiveModelsView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("PredictiveModelsView must be within a DataProvider");

    const { mlModels, retrainMlModel, deployMlModel, rollbackDeployment, updateTrafficSplit, createHPOptionRun, allFeatures, allAlerts, acknowledgeAlert, resolveAlert, auditLogs } = context;
    const [selectedModel, setSelectedModel] = useState<MLModelExtended | null>(mlModels[0] || null);
    const [aiDocs, setAiDocs] = useState('');
    const [isDocsLoading, setIsDocsLoading] = useState(false);
    const [selectedComparisonModels, setSelectedComparisonModels] = useState<MLModelExtended[]>([]);
    const [selectedMetricForComparison, setSelectedMetricForComparison] = useState<keyof MLModelExtended['metricsHistory'][0]>('accuracy');
    const [hpoFormLoading, setHpoFormLoading] = useState(false);
    const [selectedXAIInsight, setSelectedXAIInsight] = useState<XAIInsight | null>(null);
    const [activeDeploymentTab, setActiveDeploymentTab] = useState<'monitor' | 'deploy' | 'history'>('monitor');
    const [activeDriftTab, setActiveDriftTab] = useState<'overview' | 'features'>('overview');
    const [selectedDriftFeature, setSelectedDriftFeature] = useState<string | null>(null);
    const [activeFeatureStoreTab, setActiveFeatureStoreTab] = useState<'browse' | 'create' | 'settings'>('browse');
    const [activeAlertTab, setActiveAlertTab] = useState<'active' | 'resolved' | 'configure'>('active');
    const [alertConfigLoading, setAlertConfigLoading] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<MLAlertExtended | null>(null);
    const [aiChatInput, setAiChatInput] = useState('');
    const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [isAiChatLoading, setIsAiChatLoading] = useState(false);

    // AI Initialization
    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || '' }), []);

    const generateDocs = async (model: MLModelExtended) => {
        setAiDocs('');
        setIsDocsLoading(true);
        try {
            const prompt = `Generate a brief, professional documentation entry for this machine learning model. Include a short description, its primary use case, key features, and a summary of its current performance and recent deployments. Model details: Name=${model.name}, Version=${model.version}, Accuracy=${model.accuracy}%, Status=${model.status}, Deployments=${model.deploymentHistory?.length || 0}.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            setAiDocs(response.text || "No documentation generated.");
        } catch(err) {
            setAiDocs("Could not generate documentation. Error: " + (err as Error).message);
        } finally {
            setIsDocsLoading(false);
        }
    };

    const generateAiContent = async (prompt: string): Promise<string | null> => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            return response.text || null;
        } catch (err) {
            console.error("AI content generation failed:", err);
            return null;
        }
    };

    const handleAIChatSubmit = async () => {
        if (!aiChatInput.trim()) return;
        const currentInput = aiChatInput;
        setAiChatInput('');
        setAiChatHistory(prev => [...prev, { role: 'user', text: currentInput }]);
        setIsAiChatLoading(true);

        try {
            // Using a fresh chat instance for simplicity in this demo to avoid session complexity
            // In a real app, maintain `chat` session in state.
            const chat = ai.chats.create({
                model: 'gemini-3-flash-preview',
                // Map local history to SDK history format if needed, but for now we just start fresh or use previous context if implemented fully
            });
            
            // For improved context, we can construct the history:
            // But simplify for this example to just single turn or limited context.
            const result = await chat.sendMessage({ message: currentInput });
            const responseText = result.text;
            setAiChatHistory(prev => [...prev, { role: 'model', text: responseText || "No response." }]);
        } catch (err) {
            setAiChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process that. Please try again. Error: " + (err as Error).message }]);
        } finally {
            setIsAiChatLoading(false);
        }
    };

    const handleModelComparisonSelection = (model: MLModelExtended) => {
        setSelectedComparisonModels(prev =>
            prev.includes(model) ? prev.filter(m => m.id !== model.id) : [...prev, model]
        );
    };

    const handleDeploy = async (environment: string, trafficSplit?: { [modelId: string]: number }) => {
        if (selectedModel) {
            await deployMlModel(selectedModel, environment);
            setActiveDeploymentTab('monitor');
            setSelectedModel(mlModels.find(m => m.id === selectedModel.id) || null); 
        }
    };

    const handleSaveAlert = async (alert: MLAlertExtended) => {
        setAlertConfigLoading(true);
        console.log("Saving new alert:", alert);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAlertConfigLoading(false);
        setActiveAlertTab('active');
    };

    const getModelDeploymentCurrentMetrics = (deployment: ModelDeployment) => {
        if (!deployment.metrics || deployment.metrics.length === 0) return null;
        return deployment.metrics[deployment.metrics.length - 1];
    };

    const selectedDriftReport = useMemo(() => {
        if (!selectedModel || !selectedModel.dataDriftHistory) return null;
        return selectedModel.dataDriftHistory[selectedModel.dataDriftHistory.length - 1];
    }, [selectedModel]);

    const filteredAlerts = useMemo(() => {
        if (!selectedModel) return { active: [], resolved: [] };
        const modelAlerts = allAlerts.filter(a => a.modelId === selectedModel.id);
        return {
            active: modelAlerts.filter(a => a.status === 'Active' || a.status === 'Acknowledged'),
            resolved: modelAlerts.filter(a => a.status === 'Resolved'),
        };
    }, [allAlerts, selectedModel]);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <header className="mb-8">
                 <h2 className="text-3xl font-bold text-white tracking-wider">Predictive Models Hub (MLOps)</h2>
                 <p className="text-gray-400 mt-2">Manage, monitor, and optimize your machine learning lifecycle.</p>
            </header>

            {/* AI Assistant Chat */}
            <Card title="AI MLOps Assistant">
                <div className="flex flex-col h-80">
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-900/50 rounded-md border border-gray-700/50">
                        {aiChatHistory.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                 <p className="text-gray-500 text-center">Start a conversation with your AI MLOps assistant.<br/>Ask about model performance, deployment strategies, or debugging.</p>
                            </div>
                        )}
                        {aiChatHistory.map((entry, index) => (
                            <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${entry.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                    {entry.text}
                                </div>
                            </div>
                        ))}
                        {isAiChatLoading && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2 rounded-lg bg-gray-700 text-gray-400 text-sm animate-pulse rounded-bl-none">
                                    AI is typing...
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            value={aiChatInput}
                            onChange={(e) => setAiChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAIChatSubmit()}
                            className="flex-grow p-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ask the AI about your models..."
                            disabled={isAiChatLoading}
                        />
                        <button
                            onClick={handleAIChatSubmit}
                            disabled={isAiChatLoading || !aiChatInput.trim()}
                            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white disabled:opacity-50 font-medium transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Model Registry">
                         <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {mlModels.map(model => (
                                <button key={model.id} onClick={() => setSelectedModel(model)} className={`w-full text-left p-4 rounded-lg border-l-4 transition-all ${selectedModel?.id === model.id ? 'bg-cyan-900/20 border-cyan-400 shadow-md' : 'bg-gray-800/30 border-transparent hover:bg-gray-700/30'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-white">{model.name}</p>
                                        <StatusBadge status={model.status} />
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                         <span className="font-mono text-gray-500">v{model.version}</span>
                                         <span className="text-gray-400">Acc: <span className="text-cyan-400 font-medium">{model.accuracy}%</span></span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    <Card title={selectedModel ? `Performance: ${selectedModel.name} v${selectedModel.version}` : 'Select a Model'}>
                        {selectedModel ? (
                            <>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={selectedModel.performanceHistory}>
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" domain={[ 'dataMin - 1', 'dataMax + 1' ]} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', borderColor: '#4b5563', color: '#f3f4f6' }} />
                                    <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} name="Accuracy" dot={{fill: '#06b6d4', r: 3}} activeDot={{r: 5}} />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => generateDocs(selectedModel)} disabled={isDocsLoading} className="text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white border border-gray-600 transition-colors">Generate AI Docs</button>
                                <button onClick={() => retrainMlModel(selectedModel.id)} disabled={selectedModel.status === 'Training'} className="text-sm px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50 text-white font-medium transition-colors shadow-lg shadow-cyan-900/20">{selectedModel.status === 'Training' ? 'Training in Progress...' : 'Retrain Model'}</button>
                            </div>
                            </>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                <span>Select a model from the registry to view analytics.</span>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {(isDocsLoading || aiDocs) && (
                <Card title="AI-Generated Documentation">
                    {isDocsLoading ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating documentation...</span>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none text-sm text-gray-300">
                            <p className="whitespace-pre-line leading-relaxed">{aiDocs}</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Model Comparison */}
            <Card title="Model Comparison">
                <div className="mb-6">
                    <p className="text-gray-400 mb-3 text-sm">Select models to compare against each other:</p>
                    <div className="flex flex-wrap gap-2">
                        {mlModels.map(model => (
                            <button
                                key={`comp-${model.id}`}
                                onClick={() => handleModelComparisonSelection(model)}
                                className={`px-4 py-1.5 text-sm rounded-full transition-all border ${selectedComparisonModels.includes(model) ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                {model.name} v{model.version}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedComparisonModels.length > 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <MetricDisplay label="Models Selected" value={selectedComparisonModels.length} />
                            <MetricDisplay label="Avg Accuracy" value={parseFloat((selectedComparisonModels.reduce((sum, m) => sum + m.accuracy, 0) / selectedComparisonModels.length).toFixed(2))} unit="%" />
                            <MetricDisplay label="Best Model" value={selectedComparisonModels.reduce((best, m) => m.accuracy > best.accuracy ? m : best, selectedComparisonModels[0]).name} tooltip="Based on Accuracy" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">Metric Comparison</h3>
                                    <select
                                        value={selectedMetricForComparison}
                                        onChange={(e) => setSelectedMetricForComparison(e.target.value as keyof MLModelExtended['metricsHistory'][0])}
                                        className="bg-gray-800 border-gray-600 rounded-md text-white text-sm px-2 py-1 focus:ring-1 focus:ring-cyan-500 outline-none"
                                    >
                                        <option value="accuracy">Accuracy</option>
                                        <option value="precision">Precision</option>
                                        <option value="recall">Recall</option>
                                        <option value="f1Score">F1 Score</option>
                                        <option value="latency">Latency</option>
                                        <option value="throughput">Throughput</option>
                                    </select>
                                </div>
                                <ModelComparisonChart models={selectedComparisonModels} metric={selectedMetricForComparison} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Performance Radar</h3>
                                <ModelRadarChart models={selectedComparisonModels} metrics={['accuracy', 'precision', 'recall', 'f1Score', 'latency', 'throughput']} />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={async () => {
                                    const prompt = `Analyze the comparison results of the following models based on their latest metrics: ${selectedComparisonModels.map(m => `${m.name} v${m.version} (Accuracy: ${m.accuracy}%, Precision: ${m.metricsHistory?.[m.metricsHistory.length - 1]?.precision?.toFixed(2)}, Latency: ${m.metricsHistory?.[m.metricsHistory.length - 1]?.latency?.toFixed(2)}ms)`).join('; ')}. Highlight strengths and weaknesses of each model and recommend which one might be best for low-latency, high-accuracy production use.`;
                                    const aiReport = await generateAiContent(prompt);
                                    setAiDocs(aiReport || "Could not generate AI comparison analysis.");
                                    setIsDocsLoading(false); 
                                }}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium shadow-lg shadow-indigo-900/20 transition-colors"
                            >
                                Generate AI Analysis Report
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">Select at least one model for comparison.</div>
                )}
            </Card>

            {/* Deep File Analysis Tool - New Feature */}
            <DeepAnalysisTool />

            {/* Deployment Section (Simplified for brevity in generated code) */}
            {selectedModel && (
                <Card title={`Deployment & Monitoring: ${selectedModel.name} v${selectedModel.version}`}>
                     <div className="mb-6 border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            {['monitor', 'deploy', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveDeploymentTab(tab as any)}
                                    className={`${activeDeploymentTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors capitalize`}
                                >
                                    {tab === 'monitor' ? 'Live Monitoring' : tab === 'deploy' ? 'Deploy New Version' : 'Deployment History'}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {activeDeploymentTab === 'monitor' && (
                        <div className="space-y-6">
                            {(selectedModel.deploymentHistory?.filter(d => d.status !== 'Inactive') || []).length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {selectedModel.deploymentHistory?.filter(d => d.status !== 'Inactive').map(deployment => {
                                        return (
                                            <div key={deployment.id} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-lg font-bold text-white capitalize">{deployment.environment} Environment</h4>
                                                            <StatusBadge status={deployment.status} />
                                                        </div>
                                                        <p className="text-sm text-gray-400 mt-1">Version: {deployment.version} • Deployed: {new Date(deployment.deployedAt).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => rollbackDeployment(deployment.id)} className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors">Rollback</button>
                                                        {deployment.environment === 'canary' && (
                                                            <button onClick={() => updateTrafficSplit(deployment.id, {[selectedModel.id]: 1})} className="px-3 py-1.5 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 rounded-lg transition-colors">Promote to 100%</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-64">
                                                    <DeploymentMetricsChart metrics={deployment.metrics || []} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 py-10 text-center">No active deployments found for this model.</p>
                            )}
                        </div>
                    )}
                    {activeDeploymentTab === 'deploy' && (
                        <DeploymentConfigurationForm
                            model={selectedModel}
                            onDeploy={(env, split) => handleDeploy(env, split)}
                            onGenerateAISuggestions={generateAiContent}
                            isLoading={false}
                        />
                    )}
                    {activeDeploymentTab === 'history' && (
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Env</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                    {(selectedModel.deploymentHistory || []).map(dep => (
                                        <tr key={dep.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{dep.version}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">{dep.environment}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={dep.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(dep.deployedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* XAI Section */}
            {selectedModel && selectedModel.xaiInsights && selectedModel.xaiInsights.length > 0 && (
                <Card title={`Explainable AI (XAI): ${selectedModel.name}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Global Feature Importance</h3>
                            <FeatureImportanceChart data={selectedModel.featureImportance} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Local Explanations (Sampled)</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedModel.xaiInsights.map(insight => (
                                    <button
                                        key={insight.id}
                                        onClick={() => setSelectedXAIInsight(insight)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedXAIInsight?.id === insight.id ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {insight.type} • {new Date(insight.generatedAt).toLocaleTimeString()}
                                    </button>
                                ))}
                            </div>
                            {selectedXAIInsight ? (
                                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-3">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-white">{selectedXAIInsight.type} Insight</h4>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed">{selectedXAIInsight.description}</p>
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <button
                                            onClick={async () => {
                                                const prompt = `Explain the following XAI insight for a business stakeholder: Type=${selectedXAIInsight.type}, Description=${selectedXAIInsight.description}. What features mattered most?`;
                                                const aiReport = await generateAiContent(prompt);
                                                setAiDocs(aiReport || "Could not generate explanation.");
                                                setIsDocsLoading(false);
                                            }}
                                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                                        >
                                            Generate Business Explanation
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-40 flex items-center justify-center text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                    Select an insight to view details
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Feature Store */}
            <Card title="Feature Store & Engineering">
                <div className="mb-4">
                     <nav className="flex space-x-6 border-b border-gray-700 mb-4">
                        <button onClick={() => setActiveFeatureStoreTab('browse')} className={`pb-3 text-sm font-medium border-b-2 ${activeFeatureStoreTab === 'browse' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400'}`}>Browse Features</button>
                        <button onClick={() => setActiveFeatureStoreTab('create')} className={`pb-3 text-sm font-medium border-b-2 ${activeFeatureStoreTab === 'create' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400'}`}>Create Feature</button>
                    </nav>
                </div>
                {activeFeatureStoreTab === 'browse' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quality (Missing)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Used By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {allFeatures.map(feature => (
                                    <tr key={feature.id} className="hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{feature.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">{feature.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`${feature.dataQualityMetrics.missingRate > 0.05 ? 'text-red-400' : 'text-green-400'}`}>
                                                {(feature.dataQualityMetrics.missingRate * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {feature.usedByModels.length} models
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4">
                             <button
                                onClick={async () => {
                                    const prompt = `Analyze the current feature store: ${allFeatures.map(f => f.name).join(', ')}. Suggest 3 new engineered features that could improve predictive performance for customer churn or recommendation systems.`;
                                    const aiReport = await generateAiContent(prompt);
                                    setAiDocs(aiReport || "Could not generate feature ideas.");
                                    setIsDocsLoading(false);
                                }}
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                                ✨ AI Suggest New Features
                            </button>
                        </div>
                    </div>
                )}
                 {activeFeatureStoreTab === 'create' && (
                    <div className="p-6 bg-gray-800 rounded-lg text-center text-gray-400">
                        Feature creation form placeholder.
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PredictiveModelsView;