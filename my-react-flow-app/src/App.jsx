import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';


import '@xyflow/react/dist/style.css';



const getGroqChatCompletion = async (inputText, previousData) => {
  try {
    const response = await fetch("http://localhost:5000/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: "You are a career guidance AI designed to help users explore future opportunities based on their academic background, interests, hobbies, and skills. When a user inputs their information, suggest one possible career path at a time, explaining why it suits them. Display this path as a branching timeline with key milestones and resources. Keep responses brief (one to two sentences) and avoid listing multiple options at once. As users explore, remember past choices to refine recommendations and provide targeted next steps. DO NOT USE MARKDOWN. Make sure each output is different from the previous."
          },
          { 
            role: "user", 
            content: `Previous input data: ${previousData}. User input: ${inputText}. Give some advice or potential career opportunities. Keep the response very brief.`
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response";
  } catch (error) {
    console.error("Error fetching from Groq API:", error);
    return "Error fetching response";
  }
};

const LoginPage = ({ onLogin }) => {
  const [interests, setInterests] = useState('');
  const [academics, setAcademics] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ interests, academics, skills, previousData: `${interests}, ${academics}, ${skills}` });
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto', textAlign: 'center' }}>
      
      {/* SkilltreeAI Introduction */}
      <h1>Welcome to SkilltreeAI</h1>
      <p><strong>SkilltreeAI</strong> is an interactive career guidance tool designed to help users explore and visualize potential career paths based on their <strong>interests, academic background, and skills</strong>. Instead of overwhelming users with multiple choices at once, SkilltreeAI builds a <strong>branching skill tree</strong>, presenting one opportunity at a time and dynamically expanding based on user input.</p>

      <h3>How It Works</h3>
      <ul style={{ textAlign: 'left', maxWidth: 500, margin: 'auto' }}>
        <li><strong>📥 User Input:</strong> Users enter their interests, academic background, and skills.</li>
        <li><strong>🤖 AI-Powered Suggestions:</strong> The AI suggests a career path tailored to the user.</li>
        <li><strong>🌱 Visualized Growth:</strong> Each suggestion is represented as a node in a tree, with key milestones and resources branching from it.</li>
        <li><strong>🔀 Decision-Making System:</strong> Users can choose different paths based on AI-generated insights, creating a personalized career journey.</li>
      </ul>


      <p>SkilltreeAI is more than just a career tool—it's a dynamic roadmap for self-improvement, helping users build skills and explore opportunities in a structured yet flexible way.</p>

      {/* User Input Form */}
      <h2>Give me an idea of who YOU are!</h2>
      <form onSubmit={handleSubmit}>
        <textarea 
          placeholder="Enter your interests" 
          value={interests} 
          onChange={(e) => setInterests(e.target.value)} 
          style={{ width: '100%', height: '50px', marginBottom: '10px' }}
        />
        <textarea 
          placeholder="Enter your academic background" 
          value={academics} 
          onChange={(e) => setAcademics(e.target.value)} 
          style={{ width: '100%', height: '50px', marginBottom: '10px' }}
        />
        <textarea 
          placeholder="Enter your skills" 
          value={skills} 
          onChange={(e) => setSkills(e.target.value)} 
          style={{ width: '100%', height: '50px', marginBottom: '10px' }}
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition duration-300"
        >
          Start Exploring
        </button>
      </form>
    </div>
  );
};


const initialNodes = [
  { id: '1', position: { x: 500, y: 500 }, data: { label: 'Start'} },
];
const initialEdges = [];

let id = 2;
const getId = () => `${id++}`;

const FlowWithAddNode = ({ userInfo }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const [promptText, setPromptText] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("1"); // Track which node is selected

  const onNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
  };

  const categorizePrompt = (prompt) => {
    // Basic keyword categorization (replace with NLP if needed)
    if (prompt.includes("tech") || prompt.includes("programming")) return "Tech Path";
    if (prompt.includes("art") || prompt.includes("design")) return "Creative Path";
    if (prompt.includes("business") || prompt.includes("entrepreneurship")) return "Business Path";
    return "General Path";
  };

  const addNewNode = async () => {
    if (!selectedNodeId) return;
    
    const previousNodes = nodes.map(node => node.data.label).join(", ");
    const previousData = `${userInfo.previousData}, ${previousNodes}`;
    const category = categorizePrompt(promptText);
    const newLabel = await getGroqChatCompletion(promptText, previousData);

    const parentNode = nodes.find(node => node.id === selectedNodeId);
    
    const newNode = {
      id: getId(),
      position: { x: parentNode.position.x + 200, y: parentNode.position.y + (Math.random() * 100 - 50) },
      data: { label: `${newLabel} (${category})` },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, { id: `e${parentNode.id}-${newNode.id}`, source: parentNode.id, target: newNode.id }]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick} // Allow node selection
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
        <div className="update-node__controls" style={{ position: 'absolute', left: 10, top: 10, background: 'white', padding: 10, borderRadius: 5, zIndex: 10 }}>
          <textarea 
            placeholder="Enter prompt text" 
            value={promptText} 
            onChange={(e) => setPromptText(e.target.value)} 
            style={{ width: '250px', height: '100px', marginBottom: '5px', display: 'block' }}
          />
          <button onClick={addNewNode}>Add New Node</button>
          <p>Selected Node ID: {selectedNodeId}</p>
        </div>
        <div style={{ position: 'absolute', right: 30, top: 2, textAlign: 'center', zIndex: 10 }}>
          <img src="/skilltreeai.png" alt="SkilltreeAI" style={{ width: '100px', height: '100px' }} />
          <div style={{ fontWeight: 'bold', marginTop: '5px' }}>SkilltreeAI</div>
        </div>
      </ReactFlow>
    </div>
  );
};


const App = () => {
  const [userInfo, setUserInfo] = useState(null);

  return userInfo ? <FlowWithAddNode userInfo={userInfo} /> : <LoginPage onLogin={setUserInfo} />;
};

export default () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);
