import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaLock, FaInfoCircle, FaDownload, FaCheckCircle, FaExclamationTriangle, FaCog } from 'react-icons/fa';
import { add, format, parseISO } from 'date-fns';
import moment from 'moment';

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
  console.log("Checking localStorage for hasUsedFreeQuery:", localStorage.getItem('hasUsedFreeQuery'));
  return localStorage.getItem('hasUsedFreeQuery') === 'true';
};

// Helper to set the free query as used
const setFreeQueryAsUsed = () => {
  console.log("Setting free query as used in localStorage");
  localStorage.setItem('hasUsedFreeQuery', 'true');
};

// Home Component
const Home = () => {
  // Initialize component state with empty values
  const [businessGoals, setBusinessGoals] = useState('');
  const [currentMaturity, setCurrentMaturity] = useState({});
  const [targetMaturity, setTargetMaturity] = useState({});
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyProvider, setApiKeyProvider] = useState('gemini');
  const [showBYOKModal, setShowBYOKModal] = useState(false);
  
  // Check local storage on component mount to see if free query is used
  useEffect(() => {
    console.log("Component mounted, checking if free query was used");
    const freeQueryUsed = hasUsedFreeQuery();
    console.log("Free query used:", freeQueryUsed);
  }, []);

  // Check if there's enough data to generate a roadmap
  const canGenerateRoadmap = () => {
    // Debug the inputs
    console.log("Checking if can generate roadmap:");
    console.log("Business goals:", businessGoals.trim().length > 0);
    console.log("API key provided:", apiKey.trim().length > 0);
    
    // If user has already provided their own API key and business goals, enable the button
    if (apiKey.trim().length > 0 && businessGoals.trim().length > 0) {
      console.log("User provided API key and business goals - enabling generation");
      return true;
    }
    
    if (Object.keys(currentMaturity).length === 0) {
      console.log("No current maturity levels set");
      return false;
    }
    
    // Check each pillar to find at least one valid pair
    const validPillars = Object.keys(currentMaturity).filter(pillar => {
      const current = currentMaturity[pillar];
      const target = targetMaturity[pillar];
      const isValid = current !== undefined && target !== undefined && target > current;
      console.log(`Pillar ${pillar}: current=${current}, target=${target}, valid=${isValid}`);
      return isValid;
    });
    
    const hasValidMaturityPairs = validPillars.length > 0;
    console.log("Valid pillars:", validPillars);
    console.log("Has valid maturity pairs:", hasValidMaturityPairs);
    
    return businessGoals.trim().length > 0 && hasValidMaturityPairs;
  };
  
  // Debug state for development
  useEffect(() => {
    console.log("Current Maturity:", currentMaturity);
    console.log("Target Maturity:", targetMaturity);
    const canGenerate = canGenerateRoadmap();
    console.log("Can Generate:", canGenerate);
  }, [currentMaturity, targetMaturity, businessGoals]);
  
  // Handle maturity level changes
  const handleMaturityChange = (pillar, value, type) => {
    const numValue = parseInt(value);
    console.log(`Handling ${type} maturity change for ${pillar} to ${numValue}`);
    
    if (type === 'current') {
      setCurrentMaturity(prev => {
        const updated = { ...prev, [pillar]: numValue };
        console.log('Updated currentMaturity:', updated);
        return updated;
      });
      
      // If target is not set or less than new current value, update target too
      if (!targetMaturity[pillar] || targetMaturity[pillar] <= numValue) {
        setTargetMaturity(prev => {
          // Set target to current + 1 (or 5 max)
          const newTarget = Math.min(numValue + 1, 5);
          const updated = { ...prev, [pillar]: newTarget };
          console.log('Auto-updated targetMaturity:', updated);
          return updated;
        });
      }
    } else {
      setTargetMaturity(prev => {
        const updated = { ...prev, [pillar]: numValue };
        console.log('Updated targetMaturity:', updated);
        return updated;
      });
    }
  };

  // Generate AI roadmap
  const generateRoadmap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const freeQueryUsed = hasUsedFreeQuery();
      console.log("When generating roadmap, free query used status:", freeQueryUsed);
      
      // Determine which key to use
      const useDefaultKey = !freeQueryUsed && !apiKey.trim();
      let key = useDefaultKey ? process.env.REACT_APP_GEMINI_API_KEY : apiKey;
      
      // Debugging
      console.log("Using default key:", useDefaultKey);
      console.log("Has used free query:", freeQueryUsed);
      console.log("API key available:", key ? "Yes" : "No");
      console.log("User provided API key:", apiKey.trim() || "None");
      
      // For development/testing, if no key is available in the env var, use a placeholder
      if (useDefaultKey && !key) {
        console.log("Using dummy key for testing");
        key = "DUMMY_KEY_FOR_TESTING";
      }
      
      // If we need a key but don't have one, show the BYOK modal
      if (freeQueryUsed && !apiKey.trim()) {
        console.log("Free query used but no API key provided - showing BYOK modal");
        setError('API key is required. Please provide your own API key.');
        setShowBYOKModal(true);
        setIsLoading(false);
        return;
      }

      // Get the current date for timeline calculations
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentQuarter = Math.floor(today.getMonth() / 3) + 1;

      // Create mock data for the selected pillars
      const roadmapData = {
        pillars: []
      };
      
      // Add pillars based on user selections
      Object.entries(currentMaturity).forEach(([pillarName, currentLevel]) => {
        if (targetMaturity[pillarName] && targetMaturity[pillarName] > currentLevel) {
          // Generate stages based on the maturity gap
          const targetLevel = targetMaturity[pillarName];
          const levelGap = targetLevel - currentLevel;
          const numStages = Math.min(Math.max(levelGap + 1, 2), 4); // At least 2, at most 4 stages
          
          const stages = [];
          for (let i = 0; i < numStages; i++) {
            // Generate timestamps for stages
            const startQuarterOffset = i;
            const endQuarterOffset = i + 1;
            
            const startQuarterNum = ((currentQuarter + startQuarterOffset - 1) % 4) + 1;
            const startYearOffset = Math.floor((currentQuarter + startQuarterOffset - 1) / 4);
            const startYear = currentYear + startYearOffset;
            
            const endQuarterNum = ((currentQuarter + endQuarterOffset - 1) % 4) + 1;
            const endYearOffset = Math.floor((currentQuarter + endQuarterOffset - 1) / 4);
            const endYear = currentYear + endYearOffset;
            
            // Generate stage content based on pillar type
            let stageName, stageMilestones;
            
            // Set stage name based on pillar type and stage index
            switch (pillarName) {
              case "AI Strategy":
                stageName = ["Assessment", "Strategy Development", "Implementation Planning", "Execution"][i] || `Stage ${i+1}`;
                stageMilestones = [
                  ["Document current AI initiatives", "Form AI strategy team", "Identify strategic gaps"],
                  ["Define AI vision and mission", "Create AI investment roadmap", "Identify strategic AI use cases"],
                  ["Prioritize AI initiatives", "Assign ownership and resources", "Establish success metrics"],
                  ["Launch pilot projects", "Scale successful initiatives", "Review and adjust strategy"]
                ][i] || ["Milestone 1", "Milestone 2", "Milestone 3"];
                break;
              case "Data":
                stageName = ["Data Assessment", "Data Foundation", "Advanced Capabilities", "Data Excellence"][i] || `Stage ${i+1}`;
                stageMilestones = [
                  ["Conduct data quality audit", "Map data sources and flows", "Identify data gaps"],
                  ["Implement data governance", "Enhance data quality", "Develop data architecture"],
                  ["Implement data catalogs", "Enable self-service analytics", "Enhance data integration"],
                  ["Advanced data lifecycle management", "Achieve high data literacy", "Enable predictive capabilities"]
                ][i] || ["Milestone 1", "Milestone 2", "Milestone 3"];
                break;
              case "Governance":
                stageName = ["Governance Assessment", "Framework Development", "Implementation", "Continuous Improvement"][i] || `Stage ${i+1}`;
                stageMilestones = [
                  ["Review existing governance policies", "Identify governance gaps", "Benchmark against industry standards"],
                  ["Create AI ethics guidelines", "Develop responsible AI principles", "Design risk management approach"],
                  ["Establish governance committee", "Roll out governance processes", "Train staff on compliance"],
                  ["Regular governance reviews", "Update policies as needed", "Respond to regulatory changes"]
                ][i] || ["Milestone 1", "Milestone 2", "Milestone 3"];
                break;
              case "People & Culture":
                stageName = ["Skills Assessment", "Training Development", "Culture Change", "Excellence"][i] || `Stage ${i+1}`;
                stageMilestones = [
                  ["Complete AI skills inventory", "Assess AI cultural readiness", "Identify skill gaps"],
                  ["Create AI learning paths", "Implement training platforms", "Launch awareness campaigns"],
                  ["Implement change management", "Create AI champions network", "Recognize AI achievements"],
                  ["Advanced skill development", "Measure culture transformation", "Continuous learning"]
                ][i] || ["Milestone 1", "Milestone 2", "Milestone 3"];
                break;
              default:
                stageName = ["Assessment", "Planning", "Implementation", "Optimization"][i] || `Stage ${i+1}`;
                stageMilestones = [
                  ["Document current state", "Identify gaps and opportunities", "Define baseline metrics"],
                  ["Develop framework", "Create implementation plan", "Define success metrics"],
                  ["Begin implementation", "Monitor progress", "Adjust approach as needed"],
                  ["Scale successful initiatives", "Measure outcomes", "Optimize and improve"]
                ][i] || ["Milestone 1", "Milestone 2", "Milestone 3"];
            }
            
            // Generate description based on business goals
            const lowercaseGoals = businessGoals.toLowerCase();
            let focus = "business value";
            
            if (lowercaseGoals.includes("customer")) {
              focus = "customer experience";
            } else if (lowercaseGoals.includes("efficien")) {
              focus = "operational efficiency";
            } else if (lowercaseGoals.includes("cost")) {
              focus = "cost reduction";
            } else if (lowercaseGoals.includes("innovat")) {
              focus = "innovation";
            } else if (lowercaseGoals.includes("product")) {
              focus = "product development";
            }
            
            let stageDescription;
            if (i === 0) {
              stageDescription = `Assess current ${pillarName.toLowerCase()} capabilities and identify opportunities for ${focus} improvement.`;
            } else if (i === 1) {
              stageDescription = `Develop comprehensive ${pillarName.toLowerCase()} framework and roadmap focused on ${focus}.`;
            } else if (i === 2) {
              stageDescription = `Implement ${pillarName.toLowerCase()} initiatives across the organization to drive ${focus}.`;
            } else {
              stageDescription = `Optimize ${pillarName.toLowerCase()} capabilities and measure impact on ${focus}.`;
            }
            
            // Create the stage object
            stages.push({
              name: stageName,
              startQuarter: `Q${startQuarterNum} ${startYear}`,
              endQuarter: `Q${endQuarterNum} ${endYear}`,
              description: stageDescription,
              milestones: stageMilestones,
              status: i === 0 ? "in-progress" : "planned"
            });
          }
          
          // Define KPIs based on pillar type
          let kpis;
          switch(pillarName) {
            case "AI Strategy":
              kpis = [
                "% of business objectives supported by AI initiatives",
                "AI investment ROI",
                "Number of AI-enabled business processes"
              ];
              break;
            case "AI Value":
              kpis = [
                "Cost reduction attributed to AI",
                "Revenue increase from AI initiatives", 
                "Customer satisfaction improvements"
              ];
              break;
            case "Data":
              kpis = [
                "Data quality score",
                "% of data accessible for AI models",
                "Data governance maturity"
              ];
              break;
            case "Governance":
              kpis = [
                "AI risk assessment coverage",
                "Compliance with AI regulations",
                "Ethics violation incidents"
              ];
              break;
            case "People & Culture":
              kpis = [
                "% of employees with AI literacy",
                "AI training completion rates",
                "Employee AI adoption metrics"
              ];
              break;
            default:
              kpis = [
                "Implementation success rate",
                "Process efficiency improvement",
                "Business impact metrics"
              ];
          }
          
          // Add the pillar to our roadmap data
          roadmapData.pillars.push({
            name: pillarName,
            currentLevel: currentLevel,
            targetLevel: targetLevel,
            timelineData: {
              stages: stages,
              kpis: kpis
            }
          });
        }
      });
      
      console.log("Generated roadmap data:", roadmapData);
      
      // Set the roadmap data
      setRoadmap(roadmapData);
      
      // If using the default key, mark the free query as used
      if (useDefaultKey) {
        console.log("Using default key - marking free query as used");
        setFreeQueryAsUsed();
      }
      
      // If using a custom API key, store it in state (but not in localStorage for privacy)
      if (apiKey.trim()) {
        console.log("Using custom API key - storing in component state");
      }
      
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError('Error generating roadmap. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // BYOKModal Component
  const BYOKModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Bring Your Own API Key</h2>
        <p className="mb-4">
          You've used your free query. To continue using AI Navigator, please provide your own API key. Once you've entered your API key and business goals, you'll be able to generate a roadmap.
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
              console.log("API key provided in modal:", apiKey.trim().length > 0);
              if (apiKey.trim()) {
                setShowBYOKModal(false);
                // Short delay to ensure state is updated
                setTimeout(() => {
                  generateRoadmap();
                }, 100);
              } else {
                alert("Please enter an API key to continue.");
              }
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // Render the roadmap timeline as a Gantt chart
  const RoadmapTimeline = ({ data }) => {
    if (!data || !data.pillars || data.pillars.length === 0) {
      return <div className="text-center py-8">No roadmap data available</div>;
    }
    
    // Get all unique quarters from the data for the timeline header
    const allQuarters = new Set();
    data.pillars.forEach(pillar => {
      if (pillar.timelineData && pillar.timelineData.stages) {
        pillar.timelineData.stages.forEach(stage => {
          // Convert "Q1 2025" format to a sortable format like "2025-1"
          const startParts = stage.startQuarter.split(' ');
          const endParts = stage.endQuarter.split(' ');
          
          if (startParts.length === 2 && endParts.length === 2) {
            const startQuarter = parseInt(startParts[0].replace('Q', ''));
            const startYear = parseInt(startParts[1]);
            const endQuarter = parseInt(endParts[0].replace('Q', ''));
            const endYear = parseInt(endParts[1]);
            
            // Add all quarters between start and end
            for (let year = startYear; year <= endYear; year++) {
              const startQ = (year === startYear) ? startQuarter : 1;
              const endQ = (year === endYear) ? endQuarter : 4;
              
              for (let q = startQ; q <= endQ; q++) {
                allQuarters.add(`${year}-${q}`);
              }
            }
          }
        });
      }
    });
    
    // Convert to array and sort chronologically
    const sortedQuarters = Array.from(allQuarters)
      .sort((a, b) => {
        const [yearA, quarterA] = a.split('-').map(Number);
        const [yearB, quarterB] = b.split('-').map(Number);
        
        if (yearA !== yearB) {
          return yearA - yearB;
        }
        return quarterA - quarterB;
      });
    
    // Convert back to display format "Q1 2025"
    const displayQuarters = sortedQuarters.map(q => {
      const [year, quarter] = q.split('-');
      return `Q${quarter} ${year}`;
    });
    
    // Define colors for different statuses
    const statusColors = {
      'in-progress': 'bg-blue-500',
      'planned': 'bg-gray-300',
      'completed': 'bg-green-500',
      'delayed': 'bg-yellow-500',
      'at-risk': 'bg-red-400'
    };
    
    // Status icons
    const statusIcons = {
      'in-progress': <FaCog className="animate-spin" />,
      'planned': <FaInfoCircle />,
      'completed': <FaCheckCircle />,
      'at-risk': <FaExclamationTriangle />
    };
    
    // Helper function to get the quarter index in our timeline
    const getQuarterIndex = (quarterStr) => {
      return displayQuarters.findIndex(q => q === quarterStr);
    };
    
    // Helper function to calculate stage width based on start and end quarters
    const calculateStageWidth = (startQuarter, endQuarter) => {
      const startIdx = getQuarterIndex(startQuarter);
      const endIdx = getQuarterIndex(endQuarter);
      
      if (startIdx === -1 || endIdx === -1) return 1; // Default to 1 if not found
      
      // Width is the span plus 1 (to include the end quarter)
      return endIdx - startIdx + 1;
    };
    
    return (
      <div className="gantt-chart-container p-4 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-6">AI Maturity Roadmap</h2>
        
        {/* Timeline header */}
        <div className="gantt-header flex border-b mb-4">
          <div className="gantt-header-pillar w-48 shrink-0 font-semibold p-2">
            Pillar
          </div>
          <div className="gantt-header-timeline flex-grow flex">
            {displayQuarters.map((quarter, idx) => (
              <div key={idx} 
                className="gantt-quarter shrink-0 w-32 text-center p-2 font-semibold">
                {quarter}
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline content */}
        <div className="gantt-body">
          {data.pillars.map((pillar, pillarIndex) => (
            <div key={pillarIndex} className="gantt-pillar mb-12">
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-semibold">{pillar.name}</h3>
                <div className="ml-4 px-2 py-1 bg-blue-100 rounded text-sm">
                  Level {pillar.currentLevel} → {pillar.targetLevel}
                </div>
              </div>
              
              {pillar.timelineData && pillar.timelineData.stages && (
                <div className="gantt-stages">
                  {pillar.timelineData.stages.map((stage, stageIndex) => (
                    <div key={stageIndex} className="gantt-stage mb-6">
                      <div className="flex">
                        <div className="gantt-stage-title w-48 shrink-0 p-2">
                          <div className="font-medium text-gray-900">{stage.name}</div>
                          <div className="text-xs text-gray-500">
                            {stage.startQuarter} to {stage.endQuarter}
                          </div>
                        </div>
                        
                        <div className="gantt-stage-timeline flex-grow flex relative h-12">
                          {/* Empty placeholders for each quarter */}
                          {displayQuarters.map((_, idx) => (
                            <div key={idx} 
                              className="gantt-quarter-placeholder w-32 shrink-0 border-r border-gray-100">
                            </div>
                          ))}
                          
                          {/* The actual stage bar */}
                          <div 
                            className={`gantt-stage-bar absolute h-10 rounded-md px-2 py-1 flex items-center
                              ${statusColors[stage.status] || 'bg-gray-300'} text-white overflow-hidden`}
                            style={{
                              left: `${getQuarterIndex(stage.startQuarter) * 8}rem`,
                              width: `${calculateStageWidth(stage.startQuarter, stage.endQuarter) * 8}rem`,
                              top: '0.25rem'
                            }}
                          >
                            <div className="mr-1">
                              {statusIcons[stage.status]}
                            </div>
                            <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {stage.name}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stage details section */}
                      <div className="gantt-stage-details ml-48 mt-2 pl-2 border-l-2 border-gray-200 text-sm">
                        <div className="text-gray-700 mb-2">{stage.description}</div>
                        
                        {stage.milestones && stage.milestones.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-900 mb-1">Key Milestones:</h5>
                            <ul className="list-disc pl-5">
                              {stage.milestones.map((milestone, milestoneIndex) => (
                                <li key={milestoneIndex} className="text-gray-700">{milestone}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* KPIs section */}
                  {pillar.timelineData.kpis && pillar.timelineData.kpis.length > 0 && (
                    <div className="gantt-kpis mt-6 bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-gray-900 mb-2">Key Performance Indicators:</h4>
                      <ul className="list-disc pl-5">
                        {pillar.timelineData.kpis.map((kpi, kpiIndex) => (
                          <li key={kpiIndex} className="text-gray-700">{kpi}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              // Download functionality would go here
              alert('Export functionality would be implemented here');
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
                      onChange={(e) => handleMaturityChange(pillar, e.target.value, 'current')}
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
                      onChange={(e) => handleMaturityChange(pillar, e.target.value, 'target')}
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
          
          {/* API Key section (always visible if free query already used) */}
          {hasUsedFreeQuery() && (
            <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <div className="flex items-start">
                <FaLock className="text-yellow-500 mt-1 mr-2" />
                <div className="w-full">
                  <h4 className="font-medium mb-1">Free Query Used</h4>
                  <p className="text-sm mb-3">
                    You've used your free query. Please provide your own API key to continue. Make sure you've also entered your business goals above.
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
                        onChange={(e) => {
                          console.log("API key changed:", e.target.value.trim().length > 0);
                          setApiKey(e.target.value);
                        }}
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
                  
                  {apiKey.trim() && (
                    <div className="mt-4 text-sm text-green-600 flex items-center">
                      <FaCheckCircle className="mr-1" /> API key provided. You can now generate a roadmap.
                    </div>
                  )}
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
                console.log("Generate button clicked");
                console.log("Has used free query?", hasUsedFreeQuery());
                console.log("API key provided?", apiKey.trim().length > 0);
                
                if (hasUsedFreeQuery() && !apiKey.trim()) {
                  console.log("Showing BYOK modal");
                  setShowBYOKModal(true);
                } else {
                  console.log("Generating roadmap");
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