import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Terminal, 
  Play, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search,
  Send,
  Bot,
  User as UserIcon,
  Code,
  FileText,
  ChevronRight
} from 'lucide-react';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import Markdown from 'react-markdown';
import axios from 'axios';

const API_BASE_URL = 'https://sdr.onsiteaffiliate.com/api';

interface TestResult {
  id: string;
  timestamp: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  latency: string;
  details?: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}

const SDR_TEST_SPECS = [
  { 
    id: 'cloudflare-domains', 
    name: 'Cloudflare Domains', 
    description: 'Tests domain search, purchase, DNS provisioning, and verification.',
    tests: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10', '2.11', '2.12', '2.13']
  },
  { 
    id: 'smartlead-email', 
    name: 'Smartlead Email', 
    description: 'Tests settings, accounts, campaigns, and inbox management.',
    tests: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '3.10', '3.11', '3.12', '3.13', '3.14', '3.15', '3.16', '3.17', '3.18']
  },
  { 
    id: 'smartlead-webhook', 
    name: 'Smartlead Webhook', 
    description: 'Tests webhook reception, secret validation, and race conditions.',
    tests: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9']
  },
  { 
    id: 'gmail-inbox', 
    name: 'Gmail Inbox', 
    description: 'Tests OAuth, listing, threading, replying, and syncing.',
    tests: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12', '5.13', '5.14', '5.15', '5.16', '5.17', '5.18', '5.19', '5.20', '5.21', '5.22', '5.23']
  },
  { 
    id: 'cross-function', 
    name: 'Cross-Function Integration', 
    description: 'Tests full lifecycle and coexistence of different modules.',
    tests: ['6.1', '6.2', '6.3', '6.4']
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([
    { id: '1', timestamp: '2024-02-28 11:00:01', endpoint: '/api/v1/auth', status: 'success', latency: '124ms' },
  ]);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am your SDR Solution AI. I have been updated with your comprehensive test plan covering Cloudflare, Smartlead, and Gmail integrations. I can run specific tests (e.g., "Run test 2.1") or full suites. What would you like to verify?' }
  ]);
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const executeTest = async (testId: string, params?: any) => {
    const suite = SDR_TEST_SPECS.find(s => s.tests?.includes(testId) || s.id === testId);
    const token = localStorage.getItem('authToken');
    const orgId = localStorage.getItem('orgId') || 'default_org'; // Fallback for testing
    
    // Map test IDs to actual backend functional paths and actions
    let endpoint = `${API_BASE_URL}/email/settings`;
    let action = 'test';

    if (testId.startsWith('2.')) {
      endpoint = `${API_BASE_URL}/email/domains`;
      if (testId === '2.5') action = 'search';
      if (testId === '2.7') action = 'purchase';
      if (testId === '2.6') action = 'list';
    } else if (testId.startsWith('3.')) {
      endpoint = `${API_BASE_URL}/email/accounts`;
      if (testId === '3.1') action = 'list-accounts';
    }

    try {
      const startTime = Date.now();
      const response = await axios.post(endpoint, {
        ...params,
        org_id: orgId,
        action: params?.action || action
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Org-Id': orgId
        }
      });
      const latency = `${Date.now() - startTime}ms`;

      const newResult: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        endpoint: endpoint.replace(API_BASE_URL, ''),
        status: 'success',
        latency,
        details: `Action: ${action} | Response: ${JSON.stringify(response.data)}`
      };
      
      setResults(prev => [newResult, ...prev]);
      return newResult;
    } catch (err: any) {
      const latency = `N/A`;
      const newResult: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        endpoint: endpoint.replace(API_BASE_URL, ''),
        status: 'error',
        latency,
        details: `Error: ${err.response?.data?.error || err.response?.data?.message || err.message}`
      };
      
      setResults(prev => [newResult, ...prev]);
      return newResult;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isAiLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const runTestTool = {
        name: "run_sdr_tests",
        parameters: {
          type: Type.OBJECT,
          description: "Executes one or more SDR tests based on test IDs from the test plan.",
          properties: {
            testIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of test IDs to run (e.g., ['2.1', '2.2', '6.1']).",
            },
            context: {
              type: Type.STRING,
              description: "Optional context or parameters for the tests.",
            }
          },
          required: ["testIds"],
        },
      };

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are an SDR Solution AI Assistant. You have full access to a comprehensive test plan for sdr.onsiteaffiliate.com.
          
          Test Plan Categories:
          2. Cloudflare Domains (cloudflare-domains)
          3. Smartlead Email (smartlead-email)
          4. Smartlead Webhook (smartlead-webhook)
          5. Gmail Inbox (gmail-inbox)
          6. Cross-Function Integration (cross-function)
          
          When a user provides a test plan or asks to run tests, identify the specific test IDs (e.g., 2.1, 3.5, 6.1) and use the 'run_sdr_tests' tool.
          
          If the user asks to "run the full lifecycle", that corresponds to test 6.1.
          If they mention specific bugs (like the sync bugs in 5.19/5.20 or webhook race conditions in 4.7), prioritize those tests.
          
          After running tests, provide a detailed report. Group results by category and highlight any "Expected Failures" vs "Unexpected Failures".
          
          Test Specs Reference:
          ${JSON.stringify(SDR_TEST_SPECS)}`,
          tools: [{ functionDeclarations: [runTestTool] }],
        },
        history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
      });

      let response = await chat.sendMessage({ message: userMessage });
      
      // Handle function calls
      const functionCalls = response.functionCalls;
      if (functionCalls) {
        setMessages(prev => [...prev, { role: 'model', content: 'Executing test sequence...', isThinking: true }]);
        
        const functionResponses = [];
        for (const call of functionCalls) {
          if (call.name === 'run_sdr_tests') {
            const testIds = call.args.testIds as string[];
            const results = [];
            for (const id of testIds) {
              const res = await executeTest(id, { context: call.args.context });
              results.push(res);
            }
            functionResponses.push({
              name: call.name,
              id: call.id,
              response: { results }
            });
          }
        }

        response = await chat.sendMessage({
          message: "The tests have been executed. Please summarize the findings based on the results provided.",
        });
        
        setMessages(prev => prev.filter(m => !m.isThinking));
      }

      setMessages(prev => [...prev, { role: 'model', content: response.text || "Tests completed." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Error processing test plan. Please ensure your Gemini API key is configured." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-line bg-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-ink flex items-center justify-center">
            <Bot className="text-bg w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">SDR AI COMMAND</h1>
            <p className="text-[10px] font-mono opacity-50">AGENTIC INTERFACE FOR sdr.onsiteaffiliate.com</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-line/20 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Core Active
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-ink hover:text-bg transition-colors border border-line"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Interface */}
        <div className="flex-1 flex flex-col border-r border-line bg-white">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-8 h-8 flex items-center justify-center border border-line ${msg.role === 'user' ? 'bg-bg' : 'bg-ink text-bg'}`}>
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-4 border border-line ${msg.role === 'user' ? 'bg-bg/20' : 'bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]'}`}>
                    {msg.isThinking ? (
                      <div className="flex items-center gap-2 font-mono text-xs italic opacity-50">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        AI is executing functions...
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none font-sans text-sm leading-relaxed">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-mono opacity-30 uppercase">
                    {msg.role === 'user' ? 'User Command' : 'AI Response'}
                  </div>
                </div>
              </div>
            ))}
            {isAiLoading && !messages.some(m => m.isThinking) && (
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 flex items-center justify-center border border-line bg-ink text-bg">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 border border-line bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-ink rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-ink rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-ink rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-line bg-bg/5">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell the AI what to test (e.g., 'Run the lead gen test')..."
                className="w-full pl-4 pr-12 py-4 border border-line bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] focus:outline-none focus:ring-2 focus:ring-ink/5 font-sans text-sm"
                disabled={isAiLoading}
              />
              <button 
                type="submit"
                disabled={isAiLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-ink text-bg hover:bg-opacity-90 disabled:opacity-30 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-3 flex items-center gap-4 overflow-x-auto pb-2">
              <span className="text-[10px] font-mono uppercase opacity-40 shrink-0">Suggestions:</span>
              {SDR_TEST_SPECS.map(spec => (
                <button 
                  key={spec.id}
                  onClick={() => setInput(`Run the ${spec.name} test`)}
                  className="shrink-0 px-2 py-1 border border-line/20 hover:border-line text-[10px] font-mono uppercase bg-white transition-colors"
                >
                  {spec.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Execution Log & Specs */}
        <div className="hidden lg:flex w-96 flex-col bg-bg/20">
          {/* Specs List */}
          <div className="p-6 border-b border-line bg-white">
            <h2 className="font-serif italic text-lg mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Test Specifications
            </h2>
            <div className="space-y-3">
              {SDR_TEST_SPECS.map(spec => (
                <div key={spec.id} className="p-3 border border-line/10 bg-bg/30 hover:bg-bg/50 transition-colors group cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">{spec.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] opacity-60 leading-relaxed">{spec.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Log */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="p-4 border-b border-line flex items-center justify-between bg-bg/10">
              <h2 className="font-serif italic text-lg flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Live Log
              </h2>
              <div className="text-[10px] font-mono opacity-40 uppercase">
                {results.length} Entries
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {results.map((res) => (
                <div key={res.id} className="p-4 border-b border-line hover:bg-bg/5 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono opacity-40">#{res.id}</span>
                    {res.status === 'success' ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 text-[10px] font-bold uppercase">
                        <AlertCircle className="w-3 h-3" />
                        FAIL
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono truncate mb-1">{res.endpoint}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-50">
                    <span>{res.timestamp}</span>
                    <span>{res.latency}</span>
                  </div>
                  {res.details && (
                    <div className="mt-2 p-2 bg-bg/20 border border-line/5 text-[9px] font-mono opacity-70 break-words">
                      {res.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
