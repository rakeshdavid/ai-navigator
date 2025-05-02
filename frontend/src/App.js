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
  return localStorage.getItem('hasUsedFreeQuery') === 'true';
};

// Helper to set the free query as used
const setFreeQueryAsUsed = () => {
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
  
  // Debug state for development
  useEffect(() => {
    console.log("Current Maturity:", currentMaturity);
    console.log("Target Maturity:", targetMaturity);
    const canGenerate = canGenerateRoadmap();
    console.log("Can Generate:", canGenerate);
  }, [currentMaturity, targetMaturity, businessGoals]);

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
      // Get the current date for timeline calculations
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentQuarter = Math.floor(today.getMonth() / 3) + 1;

      const prompt = `
        As an AI maturity consultant, create a detailed roadmap based on the following information:
        
        Business Goals: ${businessGoals}
        
        Current Maturity Levels:
        ${Object.entries(currentMaturity).map(([pillar, level]) => `${pillar}: ${level} - ${MATURITY_LEVELS.find(l => l.value === level)?.label}`).join('\n')}
        
        Target Maturity Levels:
        ${Object.entries(targetMaturity).map(([pillar, level]) => `${pillar}: ${level} - ${MATURITY_LEVELS.find(l => l.value === level)?.label}`).join('\n')}
        
        For each pillar that has both current and target maturity levels defined, please create a detailed roadmap with stages, timelines, milestones, and KPIs.
        
        Format your response as JSON with the following structure:
        {
          "pillars": [
            {
              "name": "Pillar Name",
              "currentLevel": number,
              "targetLevel": number,
              "timelineData": {
                "stages": [
                  {
                    "name": "Stage Name",
                    "startQuarter": "Q1 2025",
                    "endQuarter": "Q2 2025",
                    "description": "Detailed description of this stage",
                    "milestones": ["Milestone 1", "Milestone 2"],
                    "status": "in-progress"
                  }
                ],
                "kpis": ["KPI 1", "KPI 2"]
              }
            }
          ]
        }
        
        The roadmap should follow the Gartner AI Maturity Model framework. Start from the current quarter (Q${currentQuarter} ${currentYear}) and map out a realistic timeline to reach the target maturity level for each pillar.
        
        For the status of each stage, use "in-progress" for the first stage, and "planned" for all subsequent stages.
        
        Focus on practical, actionable advice specific to each pillar's maturity journey. The roadmap should enable the organization to systematically progress from their current maturity level to their target level over a realistic timeframe.
      `;

      // Initialize the Generative AI
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Generate content
      let text;
      
      // If using the dummy key, return a mock response for development/testing
      if (key === "DUMMY_KEY_FOR_TESTING") {
        // Get the current date for timeline calculations
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
        
        // Create a realistic mock response based on the input with Gartner-style timeline format
        const timelineData = {
          "pillars": [
            {
              "name": "AI Strategy",
              "currentLevel": currentMaturity["AI Strategy"] || 1,
              "targetLevel": targetMaturity["AI Strategy"] || 3,
              "timelineData": {
                "stages": [
                  {
                    "name": "Current State Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter} ${currentYear}`,
                    "description": "Assess existing AI capabilities and alignment with business strategy",
                    "milestones": [
                      "Create AI strategy steering committee",
                      "Complete AI capabilities assessment",
                      "Document current AI initiatives"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "AI Strategy Development",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Develop comprehensive AI strategy aligned with business objectives",
                    "milestones": [
                      "Define AI vision and principles",
                      "Create AI investment roadmap",
                      "Identify strategic AI use cases"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Implementation Planning",
                    "startQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Develop implementation plans for AI initiatives",
                    "milestones": [
                      "Prioritize AI use cases",
                      "Assign ownership and resources",
                      "Establish success metrics"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Strategy Execution",
                    "startQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 5 > 4 ? currentQuarter + 5 - 4 : currentQuarter + 5} ${currentQuarter + 5 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Execute AI strategy across business units",
                    "milestones": [
                      "Launch pilot projects",
                      "Scale successful initiatives",
                      "Review and adjust strategy"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "% of business objectives supported by AI initiatives",
                  "AI investment ROI",
                  "Number of AI-enabled business processes"
                ]
              }
            },
            {
              "name": "AI Value",
              "currentLevel": currentMaturity["AI Value"] || 1,
              "targetLevel": targetMaturity["AI Value"] || 4,
              "timelineData": {
                "stages": [
                  {
                    "name": "Value Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Assess current AI value measurement capabilities",
                    "milestones": [
                      "Document existing value measurement practices",
                      "Identify gaps in value tracking",
                      "Benchmark against industry standards"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "Value Framework Development",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Develop framework for measuring AI value",
                    "milestones": [
                      "Define value metrics and KPIs",
                      "Create value tracking processes",
                      "Develop ROI calculation methodology"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Value Optimization",
                    "startQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 5 > 4 ? currentQuarter + 5 - 4 : currentQuarter + 5} ${currentQuarter + 5 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Continuously optimize AI value realization",
                    "milestones": [
                      "Implement value tracking dashboards",
                      "Regular value review meetings",
                      "Adjust initiatives based on value delivery"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "Cost reduction attributed to AI",
                  "Revenue increase from AI initiatives",
                  "Customer satisfaction improvements"
                ]
              }
            },
            {
              "name": "AI Organization",
              "currentLevel": currentMaturity["AI Organization"] || 1,
              "targetLevel": targetMaturity["AI Organization"] || 3,
              "timelineData": {
                "stages": [
                  {
                    "name": "Organizational Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter} ${currentYear}`,
                    "description": "Assess current organizational structure and AI capabilities",
                    "milestones": [
                      "Map existing AI roles and teams",
                      "Identify organizational gaps",
                      "Review governance structure"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "Organizational Design",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Design optimal AI organizational structure",
                    "milestones": [
                      "Define AI roles and responsibilities",
                      "Develop AI center of excellence model",
                      "Create AI governance framework"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Implementation",
                    "startQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 4 > 4 ? currentQuarter + 4 - 4 : currentQuarter + 4} ${currentQuarter + 4 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Implement new AI organizational structure",
                    "milestones": [
                      "Staff key AI roles",
                      "Establish AI center of excellence",
                      "Implement governance processes"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "% of departments with AI expertise",
                  "AI project delivery efficiency",
                  "Cross-functional collaboration metrics"
                ]
              }
            },
            {
              "name": "People & Culture",
              "currentLevel": currentMaturity["People & Culture"] || 1,
              "targetLevel": targetMaturity["People & Culture"] || 3,
              "timelineData": {
                "stages": [
                  {
                    "name": "Skills Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Assess current AI skills and cultural readiness",
                    "milestones": [
                      "Complete AI skills inventory",
                      "Assess AI cultural readiness",
                      "Identify skill gaps"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "Learning & Development",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Develop AI training and upskilling programs",
                    "milestones": [
                      "Create AI learning paths",
                      "Implement training platforms",
                      "Launch awareness campaigns"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Culture Transformation",
                    "startQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 5 > 4 ? currentQuarter + 5 - 4 : currentQuarter + 5} ${currentQuarter + 5 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Foster AI-positive culture across organization",
                    "milestones": [
                      "Implement change management",
                      "Create AI champions network",
                      "Recognize AI achievements"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "% of employees with AI literacy",
                  "AI training completion rates",
                  "Employee AI adoption metrics"
                ]
              }
            },
            {
              "name": "Governance",
              "currentLevel": currentMaturity["Governance"] || 1,
              "targetLevel": targetMaturity["Governance"] || 3,
              "timelineData": {
                "stages": [
                  {
                    "name": "Governance Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter} ${currentYear}`,
                    "description": "Assess current AI governance practices",
                    "milestones": [
                      "Review existing governance policies",
                      "Identify governance gaps",
                      "Benchmark against industry standards"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "Framework Development",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Develop AI governance framework",
                    "milestones": [
                      "Create AI ethics guidelines",
                      "Develop responsible AI principles",
                      "Design risk management approach"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Implementation",
                    "startQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Implement governance framework across organization",
                    "milestones": [
                      "Establish governance committee",
                      "Roll out governance processes",
                      "Train staff on compliance"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Continuous Improvement",
                    "startQuarter": `Q${currentQuarter + 4 > 4 ? currentQuarter + 4 - 4 : currentQuarter + 4} ${currentQuarter + 4 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 6 > 4 ? currentQuarter + 6 - 4 : currentQuarter + 6} ${currentQuarter + 6 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Continuously improve governance practices",
                    "milestones": [
                      "Regular governance reviews",
                      "Update policies as needed",
                      "Respond to regulatory changes"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "AI risk assessment coverage",
                  "Compliance with AI regulations",
                  "Ethics violation incidents"
                ]
              }
            },
            {
              "name": "Engineering",
              "currentLevel": currentMaturity["Engineering"] || 1,
              "targetLevel": targetMaturity["Engineering"] || 4,
              "timelineData": {
                "stages": [
                  {
                    "name": "Engineering Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter} ${currentYear}`,
                    "description": "Assess current AI engineering capabilities",
                    "milestones": [
                      "Audit AI development practices",
                      "Review technical infrastructure",
                      "Identify engineering gaps"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "Foundation Building",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Build foundational AI engineering capabilities",
                    "milestones": [
                      "Implement MLOps practices",
                      "Establish development standards",
                      "Build technical infrastructure"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Scaling Capabilities",
                    "startQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 5 > 4 ? currentQuarter + 5 - 4 : currentQuarter + 5} ${currentQuarter + 5 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Scale AI engineering across organization",
                    "milestones": [
                      "Implement AI platforms",
                      "Automate ML pipelines",
                      "Enable self-service capabilities"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "Model deployment cycle time",
                  "AI system reliability metrics",
                  "Engineering productivity metrics"
                ]
              }
            },
            {
              "name": "Data",
              "currentLevel": currentMaturity["Data"] || 1,
              "targetLevel": targetMaturity["Data"] || 4,
              "timelineData": {
                "stages": [
                  {
                    "name": "Data Assessment",
                    "startQuarter": `Q${currentQuarter} ${currentYear}`,
                    "endQuarter": `Q${currentQuarter} ${currentYear}`,
                    "description": "Assess current data quality, governance, and infrastructure",
                    "milestones": [
                      "Conduct data quality audit",
                      "Map data sources and flows",
                      "Identify data gaps"
                    ],
                    "status": "in-progress"
                  },
                  {
                    "name": "Data Foundation",
                    "startQuarter": `Q${currentQuarter + 1 > 4 ? 1 : currentQuarter + 1} ${currentQuarter + 1 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 2 > 4 ? currentQuarter + 2 - 4 : currentQuarter + 2} ${currentQuarter + 2 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Build foundational data capabilities",
                    "milestones": [
                      "Implement data governance",
                      "Enhance data quality",
                      "Develop data architecture"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Advanced Data Capabilities",
                    "startQuarter": `Q${currentQuarter + 3 > 4 ? currentQuarter + 3 - 4 : currentQuarter + 3} ${currentQuarter + 3 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 4 > 4 ? currentQuarter + 4 - 4 : currentQuarter + 4} ${currentQuarter + 4 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Develop advanced data capabilities for AI",
                    "milestones": [
                      "Implement data catalogs",
                      "Enable self-service analytics",
                      "Develop data sharing capabilities"
                    ],
                    "status": "planned"
                  },
                  {
                    "name": "Data Excellence",
                    "startQuarter": `Q${currentQuarter + 5 > 4 ? currentQuarter + 5 - 4 : currentQuarter + 5} ${currentQuarter + 5 > 4 ? currentYear + 1 : currentYear}`,
                    "endQuarter": `Q${currentQuarter + 7 > 4 ? currentQuarter + 7 - 4 : currentQuarter + 7} ${currentQuarter + 7 > 4 ? currentYear + 1 : currentYear}`,
                    "description": "Achieve data excellence across organization",
                    "milestones": [
                      "Implement advanced data lifecycle management",
                      "Achieve high data literacy",
                      "Enable data-driven decision making"
                    ],
                    "status": "planned"
                  }
                ],
                "kpis": [
                  "Data quality score",
                  "% of data accessible for AI models",
                  "Data governance maturity"
                ]
              }
            }
          ]
        };
        
        // Return the timeline data as a JSON string
        text = JSON.stringify(timelineData);
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
    // Debug the inputs
    console.log("Checking if can generate roadmap:");
    console.log("Business goals:", businessGoals.trim().length > 0);
    
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
