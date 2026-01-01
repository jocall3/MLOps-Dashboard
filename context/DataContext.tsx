import React, { createContext, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
    MLModelExtended, ModelDeployment, FeatureStoreEntry, MLAlertExtended, AuditLogEntry, 
    HyperparameterOptimizationRun, ModelDeploymentStatus
} from '../types';

export interface ExtendedDataContextType {
    mlModels: MLModelExtended[];
    retrainMlModel: (id: string) => void;
    deployMlModel: (model: MLModelExtended, environment: string) => Promise<void>;
    rollbackDeployment: (deploymentId: string) => Promise<void>;
    updateTrafficSplit: (deploymentId: string, trafficSplit: { [modelId: string]: number }) => Promise<void>;
    createHPOptionRun: (modelId: string, config: any) => Promise<void>;
    acknowledgeAlert: (alertId: string, notes: string) => Promise<void>;
    resolveAlert: (alertId: string, notes: string) => Promise<void>;
    allFeatures: FeatureStoreEntry[];
    allDeployments: ModelDeployment[];
    allAlerts: MLAlertExtended[];
    auditLogs: AuditLogEntry[];
}

export const DataContext = createContext<ExtendedDataContextType | null>(null);

// --- Mock Data Generators (Moved from View to Context file for cleaner separation) ---

const generateMockPerformanceHistory = (days: number = 30) => {
    const data = [];
    let currentAccuracy = Math.random() * (95 - 80) + 80;
    let currentPrecision = Math.random() * (0.95 - 0.8) + 0.8;
    let currentRecall = Math.random() * (0.95 - 0.8) + 0.8;
    let currentF1 = Math.random() * (0.95 - 0.8) + 0.8;
    let currentLatency = Math.random() * (100 - 10) + 10;
    let currentThroughput = Math.random() * (1000 - 100) + 100;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        currentAccuracy = Math.max(70, Math.min(99, currentAccuracy + (Math.random() - 0.5) * 2));
        currentPrecision = Math.max(0.7, Math.min(0.99, currentPrecision + (Math.random() - 0.5) * 0.05));
        currentRecall = Math.max(0.7, Math.min(0.99, currentRecall + (Math.random() - 0.5) * 0.05));
        currentF1 = Math.max(0.7, Math.min(0.99, currentF1 + (Math.random() - 0.5) * 0.05));
        currentLatency = Math.max(5, Math.min(200, currentLatency + (Math.random() - 0.5) * 10));
        currentThroughput = Math.max(50, Math.min(2000, currentThroughput + (Math.random() - 0.5) * 100));

        data.push({
            date: date.toISOString().split('T')[0],
            accuracy: parseFloat(currentAccuracy.toFixed(2)),
            precision: parseFloat(currentPrecision.toFixed(2)),
            recall: parseFloat(currentRecall.toFixed(2)),
            f1Score: parseFloat(currentF1.toFixed(2)),
            latency: parseFloat(currentLatency.toFixed(2)),
            throughput: parseFloat(currentThroughput.toFixed(2)),
        });
    }
    return data;
};

const generateMockFeatureImportance = (numFeatures: number = 10) => {
    const features = ['feature_A', 'feature_B', 'feature_C', 'feature_D', 'feature_E', 'feature_F', 'feature_G', 'feature_H', 'feature_I', 'feature_J'];
    return Array.from({ length: numFeatures }, (_, i) => ({
        feature: features[i % features.length] + (i >= features.length ? `_${Math.floor(i / features.length)}` : ''),
        importance: parseFloat((Math.random() * 0.2 + 0.01).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
};

const generateMockXAIInsights = () => [
    {
        id: uuidv4(),
        type: 'SHAP' as const,
        description: 'SHAP values for a recent prediction. Feature_A contributed positively, Feature_C negatively.',
        prediction: { label: 'Class 1', probability: 0.85 },
        explanationData: {
            baseValue: 0.5,
            shapValues: { feature_A: 0.2, feature_B: 0.05, feature_C: -0.1 },
            featureValues: { feature_A: 10, feature_B: 0.5, feature_C: 200 }
        },
        generatedAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        type: 'LIME' as const,
        description: 'LIME explanation for a misclassified instance. High values in Feature_X were critical.',
        prediction: { label: 'Class 0', probability: 0.6, actual: 'Class 1' },
        explanationData: [
            { feature: 'feature_X', weight: 0.3, value: 50 },
            { feature: 'feature_Y', weight: -0.1, value: 2 },
        ],
        generatedAt: new Date(Date.now() - 3600000).toISOString()
    }
];

const generateMockDataDriftReport = (days: number = 10) => {
    const reports = [];
    const featureNames = ['feature_A', 'feature_B', 'feature_C', 'feature_D', 'feature_E'];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const features = featureNames.map(name => ({
            name: name,
            driftScore: parseFloat((Math.random() * 0.5).toFixed(2)), 
            anomaliesDetected: Math.floor(Math.random() * 5),
            distributionShift: i % 3 === 0 ? { 
                baseline: { val1: 0.3, val2: 0.7 },
                current: { val1: Math.random() * 0.4 + 0.1, val2: Math.random() * 0.4 + 0.5 }
            } : undefined
        }));
        const overallDriftScore = (features.reduce((sum, f) => sum + f.driftScore, 0) / features.length).toFixed(2);
        reports.push({
            timestamp: date.toISOString(),
            features: features,
            overallDriftScore: parseFloat(overallDriftScore),
            driftDetected: parseFloat(overallDriftScore) > 0.25
        });
    }
    return reports;
};

const generateMockDeployments = (modelId: string): ModelDeployment[] => [
    {
        id: uuidv4(),
        modelId: modelId,
        version: '1.0',
        environment: 'production',
        status: 'Deployed',
        deployedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        infrastructure: 'Kubernetes',
        region: 'us-east-1',
        monitoringEnabled: true,
        metrics: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
            requestsPerSecond: Math.floor(Math.random() * 100) + 50,
            errorRate: parseFloat((Math.random() * 0.01).toFixed(3)),
            avgLatencyMs: Math.floor(Math.random() * 50) + 20,
            cpuUtilization: parseFloat((Math.random() * 0.8).toFixed(2)),
            memoryUtilization: parseFloat((Math.random() * 0.7).toFixed(2)),
            predictionAccuracy: Math.random() * 0.1 > 0.05 ? parseFloat((Math.random() * 0.05 + 0.9).toFixed(3)) : undefined, 
        }))
    },
    {
        id: uuidv4(),
        modelId: modelId,
        version: '1.1-canary',
        environment: 'canary',
        status: 'Canary',
        deployedAt: new Date(Date.now() - 86400000).toISOString(),
        trafficSplit: { [modelId]: 0.1, 'previous_model_id': 0.9 }, 
        infrastructure: 'Serverless',
        region: 'us-west-2',
        monitoringEnabled: true,
        metrics: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
            requestsPerSecond: Math.floor(Math.random() * 10) + 5,
            errorRate: parseFloat((Math.random() * 0.02).toFixed(3)),
            avgLatencyMs: Math.floor(Math.random() * 70) + 30,
            cpuUtilization: parseFloat((Math.random() * 0.3).toFixed(2)),
            memoryUtilization: parseFloat((Math.random() * 0.2).toFixed(2)),
        }))
    }
];

const generateMockFeatures = (): FeatureStoreEntry[] => {
    const baseFeatures = ['user_id', 'item_id', 'category', 'price', 'reviews_count', 'age_group', 'country', 'engagement_score'];
    return baseFeatures.map((name, i) => ({
        id: uuidv4(),
        name: name,
        description: `Description for ${name}`,
        type: (i % 3 === 0 ? 'numeric' : 'categorical') as 'numeric' | 'categorical',
        version: 1,
        source: `data_pipeline_v${i % 2 === 0 ? 1 : 2}`,
        lastUpdated: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        schema: { value: i % 3 === 0 ? 'float' : 'string' },
        usedByModels: [{ modelId: 'model-123', modelName: 'ChurnPredictor', version: '1.0' }],
        lineage: [`raw_user_data.${name}`, `processed_user_data.${name}_normalized`],
        dataQualityMetrics: {
            missingRate: parseFloat((Math.random() * 0.1).toFixed(2)),
            outlierCount: Math.floor(Math.random() * 50),
            distinctCount: Math.floor(Math.random() * 1000) + 10,
        }
    }));
};

const generateMockAlerts = (): MLAlertExtended[] => [
    {
        id: uuidv4(),
        modelId: 'model-123',
        modelName: 'ChurnPredictor',
        metric: 'accuracy_drop',
        threshold: 0.85,
        currentValue: 0.82,
        triggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'Active',
        severity: 'High',
        message: 'Accuracy dropped below threshold for ChurnPredictor v1.0 in production!',
        assignedTo: 'John Doe',
    },
    {
        id: uuidv4(),
        modelId: 'model-456',
        modelName: 'RecommendationEngine',
        metric: 'latency_spike',
        threshold: 100,
        currentValue: 125,
        triggeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'Resolved',
        severity: 'Medium',
        message: 'Latency spike detected for RecommendationEngine v2.1. Investigating...',
        resolutionNotes: 'Scaling group adjusted, latency normalized.',
    },
    {
        id: uuidv4(),
        modelId: 'model-123',
        modelName: 'ChurnPredictor',
        metric: 'data_drift',
        threshold: 0.3,
        currentValue: 0.35,
        triggeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'Active',
        severity: 'Critical',
        message: 'Significant data drift detected in input features for ChurnPredictor v1.0!',
        assignedTo: 'Jane Smith',
    }
];

const generateMockAuditLogs = (): AuditLogEntry[] => [
    {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
        actor: 'Admin User',
        action: 'model_retrained',
        targetType: 'MLModel',
        targetId: 'model-123',
        details: { modelName: 'ChurnPredictor', oldVersion: '0.9', newVersion: '1.0', accuracyImprovement: '2%' }
    },
    {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        actor: 'CI/CD Pipeline',
        action: 'model_deployed',
        targetType: 'Deployment',
        targetId: 'dep-789',
        details: { modelName: 'ChurnPredictor', version: '1.0', environment: 'production', region: 'us-east-1' }
    },
    {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        actor: 'Monitoring System',
        action: 'alert_triggered',
        targetType: 'Alert',
        targetId: 'alert-101',
        details: { alertName: 'accuracy_drop', modelName: 'ChurnPredictor', severity: 'High' }
    }
];

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mockModels, setMockModels] = useState<MLModelExtended[]>(() => [
        {
            id: 'model-123',
            name: 'ChurnPredictor',
            version: '1.0',
            accuracy: 92.5,
            status: 'Production',
            performanceHistory: generateMockPerformanceHistory(30).map(d => ({ date: d.date, accuracy: d.accuracy })),
            metricsHistory: generateMockPerformanceHistory(30),
            hyperparameters: { learningRate: 0.01, epochs: 100, optimizer: 'Adam' },
            featureImportance: generateMockFeatureImportance(),
            xaiInsights: generateMockXAIInsights(),
            deploymentStatus: 'Deployed',
            deploymentHistory: generateMockDeployments('model-123'),
            costHistory: generateMockPerformanceHistory(30).map(d => ({ date: d.date, cost: parseFloat((Math.random() * 500 + 100).toFixed(2)), cpuHours: parseFloat((Math.random() * 20 + 5).toFixed(2)), gpuHours: parseFloat((Math.random() * 5).toFixed(2)) })),
            dataDriftHistory: generateMockDataDriftReport(10),
        },
        {
            id: 'model-456',
            name: 'RecommendationEngine',
            version: '2.1',
            accuracy: 88.1,
            status: 'Staging',
            performanceHistory: generateMockPerformanceHistory(30).map(d => ({ date: d.date, accuracy: d.accuracy })),
            metricsHistory: generateMockPerformanceHistory(30),
            hyperparameters: { embeddingDim: 64, numLayers: 3, activation: 'ReLU' },
            featureImportance: generateMockFeatureImportance(15),
            xaiInsights: [],
            deploymentStatus: 'Inactive',
            deploymentHistory: [],
            costHistory: generateMockPerformanceHistory(30).map(d => ({ date: d.date, cost: parseFloat((Math.random() * 300 + 50).toFixed(2)), cpuHours: parseFloat((Math.random() * 15 + 3).toFixed(2)), gpuHours: parseFloat((Math.random() * 3).toFixed(2)) })),
            dataDriftHistory: generateMockDataDriftReport(10),
        },
        {
            id: 'model-789',
            name: 'FraudDetector',
            version: '0.9-beta',
            accuracy: 99.2,
            status: 'Training',
            performanceHistory: generateMockPerformanceHistory(10).map(d => ({ date: d.date, accuracy: d.accuracy })),
            metricsHistory: generateMockPerformanceHistory(10),
            hyperparameters: { treeDepth: 10, estimators: 200, learningRate: 0.05 },
            featureImportance: generateMockFeatureImportance(8),
            xaiInsights: [],
            deploymentStatus: 'Inactive',
            deploymentHistory: [],
            costHistory: generateMockPerformanceHistory(10).map(d => ({ date: d.date, cost: parseFloat((Math.random() * 100 + 20).toFixed(2)), cpuHours: parseFloat((Math.random() * 10 + 2).toFixed(2)), gpuHours: parseFloat((Math.random() * 2).toFixed(2)) })),
            dataDriftHistory: generateMockDataDriftReport(5),
        }
    ]);

    const [mockFeatures] = useState<FeatureStoreEntry[]>(generateMockFeatures());
    const [mockAlerts, setMockAlerts] = useState<MLAlertExtended[]>(generateMockAlerts());
    const [mockAuditLogs, setMockAuditLogs] = useState<AuditLogEntry[]>(generateMockAuditLogs());

    const allDeployments = useMemo(() => mockModels.flatMap(m => m.deploymentHistory || []), [mockModels]);

    const retrainMlModel = (id: string) => {
        setMockModels(prev => prev.map(model =>
            model.id === id ? { ...model, status: 'Training', accuracy: parseFloat((model.accuracy - Math.random() * 5).toFixed(2)) } : model
        ));
        setTimeout(() => {
            setMockModels(prev => prev.map(model =>
                model.id === id ? { ...model, status: 'Staging', accuracy: parseFloat((model.accuracy + Math.random() * 7).toFixed(2)), performanceHistory: generateMockPerformanceHistory(30).map(d => ({ date: d.date, accuracy: d.accuracy })) } : model
            ));
        }, 5000); 
    };

    const deployMlModel = async (model: MLModelExtended, environment: string) => {
        console.log(`Deploying model ${model.name} v${model.version} to ${environment}`);
        const newDeployment: ModelDeployment = {
            id: uuidv4(),
            modelId: model.id,
            version: model.version,
            environment: environment as any,
            status: 'Rolling Update',
            deployedAt: new Date().toISOString(),
            infrastructure: 'Kubernetes',
            region: 'us-east-1',
            monitoringEnabled: true,
            metrics: []
        };
        setMockModels(prev => prev.map(m =>
            m.id === model.id ? { ...m, deploymentHistory: [...(m.deploymentHistory || []), newDeployment], deploymentStatus: 'Rolling Update' } : m
        ));
        await new Promise(resolve => setTimeout(resolve, 3000));
        setMockModels(prev => prev.map(m =>
            m.id === model.id ? { ...m, deploymentHistory: m.deploymentHistory?.map(d => d.id === newDeployment.id ? { ...d, status: 'Deployed' } : d), deploymentStatus: 'Deployed' } : m
        ));
        setMockAuditLogs(prev => [...prev, {
            id: uuidv4(), timestamp: new Date().toISOString(), actor: 'System', action: 'model_deployed', targetType: 'Deployment', targetId: newDeployment.id, details: { modelName: model.name, version: model.version, environment }
        }]);
    };

    const rollbackDeployment = async (deploymentId: string) => {
        console.log(`Rolling back deployment ${deploymentId}`);
        setMockModels(prev => prev.map(m => ({
            ...m,
            deploymentHistory: m.deploymentHistory?.map(d => d.id === deploymentId ? { ...d, status: 'Inactive' } : d)
        })));
        await new Promise(resolve => setTimeout(resolve, 2000));
        setMockAuditLogs(prev => [...prev, {
            id: uuidv4(), timestamp: new Date().toISOString(), actor: 'System', action: 'deployment_rolled_back', targetType: 'Deployment', targetId: deploymentId, details: { deploymentId }
        }]);
    };

    const updateTrafficSplit = async (deploymentId: string, trafficSplit: { [modelId: string]: number }) => {
        console.log(`Updating traffic split for deployment ${deploymentId}:`, trafficSplit);
        setMockModels(prev => prev.map(m => ({
            ...m,
            deploymentHistory: m.deploymentHistory?.map(d => d.id === deploymentId ? { ...d, trafficSplit: trafficSplit } : d)
        })));
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMockAuditLogs(prev => [...prev, {
            id: uuidv4(), timestamp: new Date().toISOString(), actor: 'System', action: 'traffic_split_updated', targetType: 'Deployment', targetId: deploymentId, details: { deploymentId, trafficSplit }
        }]);
    };

    const createHPOptionRun = async (modelId: string, config: any) => {
        console.log(`Starting HPO run for model ${modelId} with config:`, config);
        const newRun: HyperparameterOptimizationRun = {
            id: uuidv4(),
            modelId: modelId,
            status: 'Running',
            startedAt: new Date().toISOString(),
            strategy: config.strategy,
            searchSpace: config.searchSpace,
            trials: []
        };
        setMockModels(prev => prev.map(m =>
            m.id === modelId ? { ...m, hpoRuns: [...(m.hpoRuns || []), newRun] } : m
        ));
        await new Promise(resolve => setTimeout(resolve, 5000));
        setMockModels(prev => prev.map(m =>
            m.id === modelId ? { ...m, hpoRuns: m.hpoRuns?.map((run: HyperparameterOptimizationRun) => run.id === newRun.id ? { ...run, status: 'Completed', completedAt: new Date().toISOString(), bestMetricValue: 0.93, bestParameters: { learningRate: 0.005, batchSize: 32 } } : run) } : m
        ));
        setMockAuditLogs(prev => [...prev, {
            id: uuidv4(), timestamp: new Date().toISOString(), actor: 'User', action: 'hpo_run_created', targetType: 'MLModel', targetId: modelId, details: { modelName: mockModels.find(m => m.id === modelId)?.name, strategy: config.strategy }
        }]);
    };

    const acknowledgeAlert = async (alertId: string, notes: string) => {
        setMockAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Acknowledged', assignedTo: 'Current User', resolutionNotes: notes } : a));
        setMockAuditLogs(prev => [...prev, {
            id: uuidv4(), timestamp: new Date().toISOString(), actor: 'Current User', action: 'alert_acknowledged', targetType: 'Alert', targetId: alertId, details: { notes }
        }]);
    };

    const resolveAlert = async (alertId: string, notes: string) => {
        setMockAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Resolved', resolutionNotes: notes || 'Resolved manually.' } : a));
        setMockAuditLogs(prev => [...prev, {
            id: uuidv4(), timestamp: new Date().toISOString(), actor: 'Current User', action: 'alert_resolved', targetType: 'Alert', targetId: alertId, details: { notes }
        }]);
    };

    const contextValue: ExtendedDataContextType = useMemo(() => ({
        mlModels: mockModels,
        retrainMlModel,
        deployMlModel,
        rollbackDeployment,
        updateTrafficSplit,
        createHPOptionRun,
        acknowledgeAlert,
        resolveAlert,
        allFeatures: mockFeatures,
        allDeployments: allDeployments,
        allAlerts: mockAlerts,
        auditLogs: mockAuditLogs,
    }), [mockModels, mockFeatures, allDeployments, mockAlerts, mockAuditLogs]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};