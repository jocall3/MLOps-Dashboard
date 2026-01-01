import React from 'react';
import { MockDataProvider } from './context/DataContext';
import PredictiveModelsView from './components/PredictiveModelsView';

function App() {
  return (
    <MockDataProvider>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <PredictiveModelsView />
      </div>
    </MockDataProvider>
  );
}

export default App;