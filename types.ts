export interface MLModel {
    id: string;
    name: string;
    version: string;
    accuracy: number;
    status: 'Production' | 'Staging' | 'Training' | 'Archived';
    performanceHistory: { date: string; accuracy: number }[];
}

export interface Feature {
    id: string;
    name: string;
    description: string;
    type: 'numeric' | 'categorical' | 'text' | 'image';
}

export interface MLAlert {
    id: string;
    modelId: string;
    message: string;
    timestamp?: string; // Optional in base, used in extended
}

export interface MLModelExtended extends MLModel {
    metricsHistory: { date: string; precision: number; recall: number; f1Score: number; latency: number; throughput: number }[];
    hyperparameters: { [key: string]: string | number };
    featureImportance: { feature: string; importance: number }[];
    xaiInsights: XAIInsight[];
    deploymentStatus?: ModelDeploymentStatus;
    deploymentHistory?: ModelDeployment[];
    costHistory?: { date: string; cost: number; cpuHours: number; gpuHours: number }[];
    dataDriftHistory?: DataDriftReport[];
    // HPO runs typically attached here in mock
    hpoRuns?: HyperparameterOptimizationRun[];
}

export type ModelDeploymentStatus = 'Deployed' | 'Rolling Update' | 'A/B Testing' | 'Canary' | 'Inactive';

export interface ModelDeployment {
    id: string;
    modelId: string;
    version: string;
    environment: 'staging' | 'production' | 'canary' | 'ab_test';
    status: ModelDeploymentStatus;
    deployedAt: string;
    trafficSplit?: { [modelId: string]: number };
    metrics?: ModelMetric[];
    infrastructure: 'Kubernetes' | 'Serverless' | 'VM';
    region: string;
    monitoringEnabled: boolean;
}

export interface ModelMetric {
    timestamp: string;
    requestsPerSecond: number;
    errorRate: number;
    avgLatencyMs: number;
    cpuUtilization: number;
    memoryUtilization: number;
    predictionAccuracy?: number;
}

export interface DataDriftReport {
    timestamp: string;
    features: {
        name: string;
        driftScore: number;
        distributionShift?: {
            baseline: { [value: string]: number };
            current: { [value: string]: number };
        };
        anomaliesDetected: number;
    }[];
    overallDriftScore: number;
    driftDetected: boolean;
}

export interface XAIInsight {
    id: string;
    type: 'LIME' | 'SHAP' | 'Counterfactual';
    description: string;
    prediction?: any;
    explanationData: any;
    generatedAt: string;
}

export interface HyperparameterOptimizationRun {
    id: string;
    modelId: string;
    status: 'Pending' | 'Running' | 'Completed' | 'Failed';
    startedAt: string;
    completedAt?: string;
    strategy: 'Grid Search' | 'Random Search' | 'Bayesian Optimization';
    searchSpace: { [param: string]: { type: 'categorical' | 'range' | 'float' | 'int'; values?: any[]; min?: number; max?: number; step?: number } };
    bestParameters?: { [param: string]: any };
    bestMetricValue?: number;
    trials: HPOCTrial[];
}

export interface HPOCTrial {
    id: string;
    parameters: { [param: string]: any };
    metricValue: number;
    status: 'Completed' | 'Failed' | 'Running';
    startedAt: string;
    completedAt?: string;
}

export interface FeatureStoreEntry extends Feature {
    version: number;
    source: string;
    lastUpdated: string;
    schema: { [key: string]: string };
    usedByModels: { modelId: string; modelName: string; version: string }[];
    lineage: string[];
    dataQualityMetrics: {
        missingRate: number;
        outlierCount: number;
        distinctCount: number;
    };
}

export interface MLAlertExtended extends MLAlert {
    modelId: string;
    modelName: string;
    metric: string;
    threshold: number;
    currentValue: number;
    triggeredAt: string;
    status: 'Active' | 'Resolved' | 'Acknowledged';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    assignedTo?: string;
    resolutionNotes?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    targetType: 'MLModel' | 'Deployment' | 'Alert' | 'Feature';
    targetId: string;
    details: { [key: string]: any };
}
