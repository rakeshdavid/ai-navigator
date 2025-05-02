import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaLock, FaInfoCircle, FaDownload } from 'react-icons/fa';

// Constants
const GARTNER_PILLARS = [
  'AI Strategy',
  'AI Value',
  'AI Organization',
  'People & Culture',
  'Governance',
  'Engineering',
  'Data'
];

const MATURITY_LEVELS = [
  { value: 1, label: 'Initial' },
  { value: 2, label: 'Developing' },
  { value: 3, label: 'Defined' },
  { value: 4, label: 'Managed' },
  { value: 5, label: 'Optimized' }
];

// Helper to check if the free query has been used
const hasUsedFreeQuery = () => {
  return localStorage.getItem('hasUsedFreeQuery') === 'true';
};

// Helper to set the free query as used
const setFreeQueryAsUsed = () => {
  localStorage.setItem('hasUsedFreeQuery', 'true');
};

// Home Component
const Home = () => {
  const [businessGoals, setBusinessGoals] = useState('');
  const [currentMaturity, setCurrentMaturity] = useState({});
  const [targetMaturity, setTargetMaturity] = useState({});
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyProvider, setApiKeyProvider] = useState('gemini');
  const [showBYOKModal, setShowBYOKModal] = useState(false);

  // Handle maturity level changes
  const handleMaturityChange = (pillar, value, type) => {
    if (type === 'current') {
      setCurrentMaturity({ ...currentMaturity, [pillar]: value });
    } else {
      setTargetMaturity({ ...targetMaturity, [pillar]: value });
    }
  };

  // Generate AI roadmap
  const generateRoadmap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const useDefaultKey = !hasUsedFreeQuery() && !apiKey;
      // Use the environment variable correctly
      let key = useDefaultKey ? process.env.REACT_APP_GEMINI_API_KEY : apiKey;
      
      // Debugging
      console.log("Using default key:", useDefaultKey);
      console.log("Has used free query:", hasUsedFreeQuery());
      console.log("API key available:", key ? "Yes" : "No");
      
      // For development/testing, if no key is available in the env var, use a placeholder
      if (useDefaultKey && !key) {
        // Use a dummy key for development/testing
        key = "DUMMY_KEY_FOR_TESTING";
      }
      
      if (!key) {
        setError('API key is required. Please provide your own API key.');
        setShowBYOKModal(true);
        setIsLoading(false);
        return;
      }

      // Create the prompt for the AI
      const prompt = `
        As an AI maturity consultant, create a detailed roadmap based on the following information:
        
        Business Goals: ${businessGoals}
        
        Current Maturity Levels:
        ${Object.entries(currentMaturity).map(([pillar, level]) => `${pillar}: ${level} - ${MATURITY_LEVELS.find(l => l.value === level)?.label}`).join('\n')}
        
        Target Maturity Levels:
        ${Object.entries(targetMaturity).map(([pillar, level]) => `${pillar}: ${level} - ${MATURITY_LEVELS.find(l => l.value === level)?.label}`).join('\n')}
        
        For each pillar that has both current and target maturity levels defined, please create:
        1. A timeline with key milestones to reach the target level
        2. Specific actions and initiatives required to progress
        3. Key performance indicators to measure progress
        
        Format your response as JSON with the following structure:
        {
          "pillars": [
            {
              "name": "Pillar Name",
              "currentLevel": number,
              "targetLevel": number,
              "milestones": [
                {
                  "title": "Milestone title",
                  "description": "Detailed description",
                  "timeline": "Q1 2025", 
                  "actions": ["Action 1", "Action 2"]
                }
              ],
              "kpis": ["KPI 1", "KPI 2"]
            }
          ]
        }
        
        Focus on practical, actionable advice specific to each pillar's maturity journey.
      `;

      // Initialize the Generative AI
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Generate content
      let text;
      
      // If using the dummy key, return a mock response for development/testing
      if (key === "DUMMY_KEY_FOR_TESTING") {
        // Create a realistic mock response based on the input
        text = JSON.stringify({
          "pillars": [
            {
              "name": "AI Strategy",
              "currentLevel": currentMaturity["AI Strategy"] || 1,
              "targetLevel": targetMaturity["AI Strategy"] || 3,
              "milestones": [
                {
                  "title": "Strategy Foundation",
                  "description": "Establish core AI strategy aligned with business goals",
                  "timeline": "Q2 2025",
                  "actions": ["Define AI vision and mission", "Identify key business problems for AI"]
                },
                {
                  "title": "Strategy Implementation",
                  "description": "Begin executing AI strategy across selected business units",
                  "timeline": "Q3 2025",
                  "actions": ["Launch pilot projects", "Measure initial results and adjust strategy"]
                }
              ],
              "kpis": ["% of business units with AI projects", "ROI of AI initiatives"]
            },
            {
              "name": "Data",
              "currentLevel": currentMaturity["Data"] || 1,
              "targetLevel": targetMaturity["Data"] || 3,
              "milestones": [
                {
                  "title": "Data Assessment",
                  "description": "Evaluate current data quality, governance, and infrastructure",
                  "timeline": "Q2 2025",
                  "actions": ["Conduct data quality audit", "Identify data gaps and opportunities"]
                },
                {
                  "title": "Data Transformation",
                  "description": "Implement data governance and improve data quality",
                  "timeline": "Q4 2025",
                  "actions": ["Establish data governance framework", "Develop data quality metrics"]
                }
              ],
              "kpis": ["Data quality score", "% of data accessible for AI models"]
            }
          ]
        });
      } else {
        // Use the actual API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      }
      
      // Parse the JSON response
      try {
        // Extract JSON from the response (in case there's additional text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        const roadmapData = JSON.parse(jsonString);
        
        setRoadmap(roadmapData);
        
        // Mark the free query as used if using the default key
        if (useDefaultKey) {
          setFreeQueryAsUsed();
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        setError('Failed to parse the AI response. Please try again.');
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError('Error generating roadmap. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there's enough data to generate a roadmap
  const canGenerateRoadmap = () => {
    const hasValidMaturityPairs = Object.keys(currentMaturity).some(
      pillar => 
        currentMaturity[pillar] !== undefined && 
        targetMaturity[pillar] !== undefined && 
        targetMaturity[pillar] > currentMaturity[pillar]
    );
    return businessGoals.trim().length > 0 && hasValidMaturityPairs;
  };

  // BYOKModal Component
  const BYOKModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Bring Your Own API Key</h2>
        <p className="mb-4">
          You've used your free query. To continue using AI Navigator, please provide your own API key.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Provider</label>
          <select 
            className="w-full p-2 border rounded"
            value={apiKeyProvider}
            onChange={(e) => setApiKeyProvider(e.target.value)}
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Get your API key from:</h3>
          {apiKeyProvider === 'gemini' && (
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>
          )}
          {apiKeyProvider === 'openai' && (
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenAI Platform
            </a>
          )}
          {apiKeyProvider === 'anthropic' && (
            <a 
              href="https://console.anthropic.com/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Anthropic Console
            </a>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <button 
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={() => setShowBYOKModal(false)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              if (apiKey.trim()) {
                setShowBYOKModal(false);
                generateRoadmap();
              }
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // Render the roadmap timeline
  const RoadmapTimeline = ({ data }) => {
    if (!data || !data.pillars || data.pillars.length === 0) {
      return <div className="text-center py-8">No roadmap data available</div>;
    }

    return (
      <div className="roadmap-container p-4">
        <h2 className="text-2xl font-bold mb-6">AI Maturity Roadmap</h2>
        
        {data.pillars.map((pillar, pillarIndex) => (
          <div key={pillarIndex} className="mb-10">
            <div className="flex items-center mb-2">
              <h3 className="text-xl font-semibold">{pillar.name}</h3>
              <div className="ml-4 px-2 py-1 bg-blue-100 rounded text-sm">
                Level {pillar.currentLevel} → {pillar.targetLevel}
              </div>
            </div>
            
            <div className="roadmap-timeline">
              {pillar.milestones.map((milestone, milestoneIndex) => (
                <div 
                  key={milestoneIndex} 
                  className="roadmap-item p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow mb-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-lg">{milestone.title}</h4>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {milestone.timeline}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{milestone.description}</p>
                  
                  {milestone.actions && milestone.actions.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium mb-1">Actions:</h5>
                      <ul className="list-disc pl-5">
                        {milestone.actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="text-sm">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {pillar.kpis && pillar.kpis.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-1">Key Performance Indicators:</h4>
                <ul className="list-disc pl-5">
                  {pillar.kpis.map((kpi, kpiIndex) => (
                    <li key={kpiIndex} className="text-sm">{kpi}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex justify-end mt-6">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              // Download functionality would go here
              alert('Download functionality would be implemented here');
            }}
          >
            <FaDownload /> Export Roadmap
          </button>
        </div>
      </div>
    );
  };

  // Maturity Chart component
  const MaturityChart = ({ current, target }) => {
    const pillars = Object.keys(current);
    
    if (pillars.length === 0) {
      return null;
    }
    
    const data = pillars.map(pillar => ({
      name: pillar,
      current: current[pillar] || 0,
      target: target[pillar] || 0,
      gap: (target[pillar] || 0) - (current[pillar] || 0)
    }));
    
    return (
      <div className="my-6">
        <h3 className="text-xl font-semibold mb-4">Maturity Levels Visualization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" name="Current Level" fill="#8884d8" />
            <Bar dataKey="target" name="Target Level" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AI Navigator</h1>
        <p className="text-gray-600">
          Assess your organization's AI maturity and get a customized roadmap
        </p>
      </header>
      
      {/* Privacy notice banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FaInfoCircle className="text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              We do not store your API keys. We log only anonymized queries to improve AI Navigator.
            </p>
          </div>
        </div>
      </div>
      
      {!roadmap ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Input Your Organization's Details</h2>
          
          {/* Business Goals */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Business Goals
            </label>
            <textarea
              className="w-full p-3 border rounded-md"
              rows="4"
              placeholder="What are your organization's AI goals? E.g., Improve customer service efficiency, Automate reporting processes..."
              value={businessGoals}
              onChange={(e) => setBusinessGoals(e.target.value)}
            />
          </div>
          
          {/* Maturity Levels Input */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Maturity Levels</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select your current and target maturity levels for each relevant pillar.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Maturity */}
              <div>
                <h4 className="font-medium mb-2">Current Maturity</h4>
                {GARTNER_PILLARS.map(pillar => (
                  <div key={`current-${pillar}`} className="mb-3">
                    <label className="block text-sm mb-1">{pillar}</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={currentMaturity[pillar] || ''}
                      onChange={(e) => handleMaturityChange(pillar, parseInt(e.target.value), 'current')}
                    >
                      <option value="">Select level</option>
                      {MATURITY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              {/* Target Maturity */}
              <div>
                <h4 className="font-medium mb-2">Target Maturity</h4>
                {GARTNER_PILLARS.map(pillar => (
                  <div key={`target-${pillar}`} className="mb-3">
                    <label className="block text-sm mb-1">{pillar}</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={targetMaturity[pillar] || ''}
                      onChange={(e) => handleMaturityChange(pillar, parseInt(e.target.value), 'target')}
                      disabled={!currentMaturity[pillar]}
                    >
                      <option value="">Select level</option>
                      {MATURITY_LEVELS.filter(level => !currentMaturity[pillar] || level.value > currentMaturity[pillar]).map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Visualization of selected maturity levels */}
          {Object.keys(currentMaturity).length > 0 && (
            <MaturityChart current={currentMaturity} target={targetMaturity} />
          )}
          
          {/* API Key section (if free query already used) */}
          {hasUsedFreeQuery() && (
            <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <div className="flex items-start">
                <FaLock className="text-yellow-500 mt-1 mr-2" />
                <div>
                  <h4 className="font-medium mb-1">Free Query Used</h4>
                  <p className="text-sm mb-3">
                    You've used your free query. Please provide your own API key to continue.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-1">Provider</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={apiKeyProvider}
                        onChange={(e) => setApiKeyProvider(e.target.value)}
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">API Key</label>
                      <input 
                        type="password" 
                        className="w-full p-2 border rounded"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-sm">Get your API key: </span>
                    {apiKeyProvider === 'gemini' && (
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Google AI Studio
                      </a>
                    )}
                    {apiKeyProvider === 'openai' && (
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        OpenAI Platform
                      </a>
                    )}
                    {apiKeyProvider === 'anthropic' && (
                      <a 
                        href="https://console.anthropic.com/keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Anthropic Console
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Generate button */}
          <div className="flex justify-end">
            <button
              className={`px-6 py-3 rounded-md text-white font-medium ${
                canGenerateRoadmap() 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!canGenerateRoadmap() || isLoading}
              onClick={() => {
                if (hasUsedFreeQuery() && !apiKey) {
                  setShowBYOKModal(true);
                } else {
                  generateRoadmap();
                }
              }}
            >
              {isLoading ? 'Generating...' : 'Generate AI Roadmap'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <RoadmapTimeline data={roadmap} />
          
          <div className="mt-8 flex justify-between">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setRoadmap(null)}
            >
              Back to Input
            </button>
            
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => generateRoadmap()}
            >
              Regenerate Roadmap
            </button>
          </div>
        </div>
      )}
      
      {/* BYOK Modal */}
      {showBYOKModal && <BYOKModal />}
    </div>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
