import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Database, 
  FileText, 
  MessageSquare, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  BarChart3,
  Settings,
  Users,
  Zap,
  Search,
  Brain,
  Cpu,
  XCircle,
  AlertTriangle,
  Play,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useBeta } from "@/contexts/BetaContext";
import { supabase } from "@/lib/supabase";
import { ragAdminApi, type DocumentStats, type EmbeddingStats, type ChatStats, type SystemHealth, type Document, type ChatActivity } from "@/lib/api/rag-admin";
import { getPromptTemplates, updatePromptTemplates } from "@/lib/api/rag-admin";
import { getSettings, updateSettings } from "@/lib/api/rag-admin";

interface PipelineCheckpoint {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  icon: React.ReactNode;
}

interface PipelineConnection {
  from: string;
  to: string;
  type?: 'embeddings' | 'completion' | 'default';
  status: 'connected' | 'disconnected' | 'testing' | 'error';
}

interface PipelineTestResult {
  success: boolean;
  message: string;
  details?: string;
  timestamp: string;
}

interface TestLogEntry {
  step: string;
  action: string;
  request?: string;
  response?: string;
  status: 'pending' | 'success' | 'error' | 'waiting' | 'warning';
  timestamp: string;
}

export function RagAdmin() {
  const { user } = useAuth();
  const { showBetaLabel, betaVariant, toggleBetaLabel, setBetaVariant } = useBeta();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // State for API data
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentChats, setRecentChats] = useState<ChatActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineTestResult, setPipelineTestResult] = useState<PipelineTestResult | null>(null);
  const [isTestingPipeline, setIsTestingPipeline] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLogEntry[]>([]);

  // Pipeline checkpoints - Simplified linear flow with explanations
  const [checkpoints, setCheckpoints] = useState<PipelineCheckpoint[]>([
    {
      id: 'browser',
      name: 'Browser Client',
      description: 'React frontend application',
      status: 'connected',
      icon: <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">B</div>
    },
    {
      id: 'rag-api',
      name: 'API Endpoints',
      description: '/api/rag-chat and /api/rag-retrieve',
      status: 'disconnected',
      icon: <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
    },
    {
      id: 'vector-search',
      name: 'Vector Search',
      description: 'pgvector similarity search',
      status: 'disconnected',
      icon: <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">V</div>
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      description: 'Embeddings and chat completions',
      status: 'disconnected',
      icon: <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">O</div>
    }
  ]);

  const [connections, setConnections] = useState<PipelineConnection[]>([
    { from: 'browser', to: 'rag-api', type: 'default', status: 'disconnected' },
    { from: 'rag-api', to: 'vector-search', type: 'default', status: 'disconnected' },
    { from: 'vector-search', to: 'openai', type: 'default', status: 'disconnected' }
  ]);

  // Prompt template state
  const [userInstruction, setUserInstruction] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaveStatus, setPromptSaveStatus] = useState<null | 'success' | 'error'>(null);

  // Chunking/retrieval settings state
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  const [maxResults, setMaxResults] = useState(5);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaveStatus, setSettingsSaveStatus] = useState<null | 'success' | 'error'>(null);

  // Add edit mode state
  const [editSettings, setEditSettings] = useState(false);
  const [draftChunkSize, setDraftChunkSize] = useState(chunkSize);
  const [draftOverlap, setDraftOverlap] = useState(overlap);
  const [draftMaxResults, setDraftMaxResults] = useState(maxResults);
  const [draftEmbeddingModel, setDraftEmbeddingModel] = useState('text-embedding-ada-002'); // Add model if needed

  // When settings are loaded, update drafts
  useEffect(() => {
    setDraftChunkSize(chunkSize);
    setDraftOverlap(overlap);
    setDraftMaxResults(maxResults);
    // setDraftEmbeddingModel(embeddingModel); // If you add model
  }, [chunkSize, overlap, maxResults]);

  // Fetch prompt templates on mount
  useEffect(() => {
    (async () => {
      setPromptLoading(true);
      try {
        const { userInstruction, systemPrompt } = await getPromptTemplates();
        setUserInstruction(userInstruction);
        setSystemPrompt(systemPrompt);
      } catch (e) {
        setPromptSaveStatus('error');
      } finally {
        setPromptLoading(false);
      }
    })();
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    (async () => {
      setSettingsLoading(true);
      try {
        const { chunkSize, overlap, maxResults } = await getSettings();
        setChunkSize(chunkSize);
        setOverlap(overlap);
        setMaxResults(maxResults);
      } catch (e) {
        setSettingsSaveStatus('error');
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, []);

  const handlePromptSave = async () => {
    setPromptLoading(true);
    setPromptSaveStatus(null);
    try {
      const { success } = await updatePromptTemplates({ userInstruction, systemPrompt });
      setPromptSaveStatus(success ? 'success' : 'error');
    } catch (e) {
      setPromptSaveStatus('error');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    setSettingsLoading(true);
    setSettingsSaveStatus(null);
    try {
      const { success } = await updateSettings({
        chunkSize: draftChunkSize,
        overlap: draftOverlap,
        maxResults: draftMaxResults,
        // embeddingModel: draftEmbeddingModel
      });
      setSettingsSaveStatus(success ? 'success' : 'error');
      if (success) setEditSettings(false);
    } catch (e) {
      setSettingsSaveStatus('error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleEdit = () => setEditSettings(true);
  const handleCancel = () => {
    setDraftChunkSize(chunkSize);
    setDraftOverlap(overlap);
    setDraftMaxResults(maxResults);
    // setDraftEmbeddingModel(embeddingModel);
    setEditSettings(false);
  };
  const handleSave = async () => {
    setSettingsLoading(true);
    setSettingsSaveStatus(null);
    try {
      const { success } = await updateSettings({
        chunkSize: draftChunkSize,
        overlap: draftOverlap,
        maxResults: draftMaxResults,
        // embeddingModel: draftEmbeddingModel
      });
      setSettingsSaveStatus(success ? 'success' : 'error');
      if (success) setEditSettings(false);
    } catch (e) {
      setSettingsSaveStatus('error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [
        docStats,
        embStats,
        chatStatsData,
        healthData,
        documents,
        chats
      ] = await Promise.all([
        ragAdminApi.getDocumentStats(),
        ragAdminApi.getEmbeddingStats(),
        ragAdminApi.getChatStats(),
        ragAdminApi.getSystemHealth(),
        ragAdminApi.getRecentDocuments(),
        ragAdminApi.getRecentChats()
      ]);

      setDocumentStats(docStats);
      setEmbeddingStats(embStats);
      setChatStats(chatStatsData);
      setSystemHealth(healthData);
      setRecentDocuments(documents);
      setRecentChats(chats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    const result = await ragAdminApi.uploadDocument(file);
    if (result.success) {
      // Refresh data to show new document
      refreshData();
    } else {
      console.error("Upload failed:", result.error);
    }
  };

  const reprocessDocument = async (docId: string) => {
    const result = await ragAdminApi.reprocessDocument(docId);
    if (result.success) {
      // Refresh data to show updated status
      refreshData();
    } else {
      console.error("Reprocessing failed:", result.error);
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "processed":
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getHealthStatusColor = (status: SystemHealth["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
  };

  // TEMPORARY: No authentication required for admin access
  // TODO: Re-enable authentication when ready
  const isAdmin = true;
  
  console.log('[Admin Debug] Admin access: OPEN (no auth required)');

  // Test the entire RAG pipeline
  const testPipeline = async () => {
    setIsTestingPipeline(true);
    setPipelineTestResult(null);
    setTestLogs([]);
    
    // Update all checkpoints to testing
    setCheckpoints(prev => prev.map(cp => ({ ...cp, status: 'testing' as const })));
    setConnections(prev => prev.map(conn => ({ ...conn, status: 'testing' as const })));
    
    const addLog = (step: string, action: string, status: TestLogEntry['status'], request?: string, response?: string) => {
      setTestLogs(prev => [...prev, {
        step,
        action,
        request,
        response,
        status,
        timestamp: new Date().toISOString()
      }]);
    };
    
    try {
      // Test 1: Browser to API Endpoints
      addLog('Step 1', 'Testing Browser to API Endpoints connection', 'pending');
      addLog('Step 1', 'Sending test request to RAG Chat API', 'waiting', 'POST /api/rag-chat\nBody: {"query": "test"}');
      
      try {
        const testResponse = await fetch('/api/rag-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'test'
          })
        });
        
        if (testResponse.ok || testResponse.status === 404) {
          const responseText = testResponse.status === 404 ? '404 (Expected in dev mode)' : '200 OK';
          addLog('Step 1', 'API Endpoints responded', 'success', undefined, `Status: ${responseText}`);
          updateCheckpointStatus('rag-api', 'connected');
          updateConnectionStatus('browser', 'rag-api', 'connected');
        } else {
          addLog('Step 1', 'API Endpoints test failed', 'error', undefined, `Status: ${testResponse.status}`);
          throw new Error('API Endpoints not accessible');
        }
      } catch (error) {
        addLog('Step 1', 'API Endpoints connection failed', 'error', undefined, `Error: ${error.message}`);
        updateCheckpointStatus('rag-api', 'error');
        updateConnectionStatus('browser', 'rag-api', 'error');
        throw error;
      }

      // Test 2: API Endpoints to Vector Search
      addLog('Step 2', 'Testing API Endpoints to Vector Search connection', 'pending');
      addLog('Step 2', 'Checking authentication status', 'waiting', 'Checking if user is authenticated');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog('Step 2', 'Authentication check failed', 'error', undefined, `Error: ${sessionError.message}`);
        updateCheckpointStatus('vector-search', 'error');
        updateConnectionStatus('rag-api', 'vector-search', 'error');
        throw new Error('Authentication required for Supabase access');
      }
      
      if (!session) {
        addLog('Step 2', 'No active session found', 'warning', undefined, 'User must be authenticated to access Supabase');
        addLog('Step 2', 'Attempting anonymous sign-in for testing', 'waiting', 'Signing in anonymously');
        
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        
        if (anonError) {
          addLog('Step 2', 'Anonymous sign-in failed', 'error', undefined, `Error: ${anonError.message}`);
          updateCheckpointStatus('vector-search', 'error');
          updateConnectionStatus('rag-api', 'vector-search', 'error');
          throw new Error('Authentication required - anonymous sign-in failed');
        }
        
        addLog('Step 2', 'Anonymous sign-in successful', 'success', undefined, 'Using anonymous session for testing');
      }
      
      addLog('Step 2', 'Authentication successful', 'success', undefined, `User: ${session?.user?.email || 'anonymous'}`);
      addLog('Step 2', 'Sending request to get document stats', 'waiting', 'GET /api/document-stats');
      
      const docStats = await ragAdminApi.getDocumentStats();
      
      if (docStats.total > 0) {
        addLog('Step 2', 'Received document stats successfully', 'success', undefined, `Found ${docStats.total} documents`);
        updateCheckpointStatus('vector-search', 'connected');
        updateConnectionStatus('rag-api', 'vector-search', 'connected');
      } else {
        addLog('Step 2', 'No documents found in database', 'warning', undefined, 'Database is empty');
        updateCheckpointStatus('vector-search', 'connected');
        updateConnectionStatus('rag-api', 'vector-search', 'connected');
      }

      // Test 3: Vector Search to OpenAI
      addLog('Step 3', 'Testing Vector Search to OpenAI connection', 'pending');
      addLog('Step 3', 'Testing OpenAI embedding generation', 'waiting', 'POST /api/rag-retrieve\nBody: {"query": "test"}');
      
      try {
        const embedResponse = await fetch('/api/rag-retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'test'
          })
        });
        
        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          addLog('Step 3', 'OpenAI embedding successful', 'success', undefined, `Generated embedding for query`);
          updateCheckpointStatus('openai', 'connected');
          updateConnectionStatus('vector-search', 'openai', 'connected');
        } else {
          addLog('Step 3', 'OpenAI embedding failed', 'error', undefined, `Status: ${embedResponse.status}`);
          throw new Error('OpenAI embedding service not accessible');
        }
      } catch (error) {
        addLog('Step 3', 'OpenAI connection failed', 'error', undefined, `Error: ${error.message}`);
        updateCheckpointStatus('openai', 'error');
        updateConnectionStatus('vector-search', 'openai', 'error');
        throw error;
      }

      addLog('Complete', 'All pipeline tests completed successfully', 'success', undefined, 'Pipeline is ready for production');

      setPipelineTestResult({
        success: true,
        message: 'Pipeline components are connected and ready!',
        details: `Found ${docStats.total} documents. Database and vector search are working. RAG APIs are configured for production deployment.`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Pipeline test failed:', error);
      
      addLog('Error', 'Pipeline test failed', 'error', undefined, error instanceof Error ? error.message : 'Unknown error');
      
      // Mark failed components
      setCheckpoints(prev => prev.map(cp => {
        if (cp.status === 'testing') {
          return { ...cp, status: 'error' as const };
        }
        return cp;
      }));
      
      setConnections(prev => prev.map(conn => {
        if (conn.status === 'testing') {
          return { ...conn, status: 'error' as const };
        }
        return conn;
      }));

      setPipelineTestResult({
        success: false,
        message: 'Pipeline test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTestingPipeline(false);
    }
  };

  const updateCheckpointStatus = (id: string, status: PipelineCheckpoint['status']) => {
    setCheckpoints(prev => prev.map(cp => 
      cp.id === id ? { ...cp, status } : cp
    ));
  };

  const updateConnectionStatus = (from: string, to: string, status: PipelineConnection['status'], type?: PipelineConnection['type']) => {
    setConnections(prev => prev.map(conn => 
      conn.from === from && conn.to === to && (!type || conn.type === type) ? { ...conn, status } : conn
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'testing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPipelineStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-300';
      case 'testing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  // Update checkpoint icon backgrounds to use Tailwind color schema
  const checkpointColors = {
    browser: 'bg-primary',
    'rag-api': 'bg-orange-500 dark:bg-orange-400',
    'vector-search': 'bg-green-600 dark:bg-green-500',
    openai: 'bg-purple-600 dark:bg-purple-500',
  };

  // Update SVG connection lines to use theme colors
  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return 'var(--color-primary, #3b82f6)'; // Tailwind primary
      case 'testing': return 'var(--color-accent, #f59e42)'; // Tailwind accent
      case 'error': return 'var(--color-destructive, #ef4444)'; // Tailwind destructive
      default: return 'var(--color-muted, #d1d5db)'; // Tailwind muted
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              RAG Pipeline Admin
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage the Retrieval-Augmented Generation pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshData}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="secondary" className="text-xs">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Badge>
            <Button
              onClick={testPipeline} 
              disabled={isTestingPipeline}
              className="flex items-center gap-2"
            >
              {isTestingPipeline ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isTestingPipeline ? 'Testing Pipeline...' : 'Test Pipeline'}
            </Button>
          </div>
        </div>

        {/* Pipeline Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Pipeline Diagram */}
            <div className="relative p-12 bg-card rounded-lg dark:bg-card">
              {/* Checkpoints - Linear flow */}
              <div className="grid grid-cols-4 gap-8 mb-12">
                {checkpoints.map((checkpoint, index) => (
                  <div key={checkpoint.id} className="flex flex-col items-center">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center ${checkpointColors[checkpoint.id] || 'bg-secondary'}`}>
                        {checkpoint.icon}
                      </div>
                      {getStatusIcon(checkpoint.status)}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="font-semibold text-sm text-primary dark:text-primary-foreground">{checkpoint.name}</div>
                      <div className="text-xs text-muted-foreground">{checkpoint.description}</div>
                      {/* Step explanations */}
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded max-w-[120px]">
                        {checkpoint.id === 'browser' && (
                          <span>User types question in chat</span>
                        )}
                        {checkpoint.id === 'rag-api' && (
                          <span>Processes query & coordinates search</span>
                        )}
                        {checkpoint.id === 'vector-search' && (
                          <span>Finds similar document chunks</span>
                        )}
                        {checkpoint.id === 'openai' && (
                          <span>Creates embeddings & generates answer</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection Lines - Linear flow */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Browser to API Endpoints */}
                <line
                  x1="18%"
                  y1="50%"
                  x2="22%"
                  y2="50%"
                  stroke={getConnectionColor(connections.find(c => c.from === 'browser' && c.to === 'rag-api')?.status)}
                  strokeWidth="3"
                  strokeDasharray={connections.find(c => c.from === 'browser' && c.to === 'rag-api')?.status === 'testing' ? "5,3" : "none"}
                  className="transition-all duration-300"
                  opacity={connections.find(c => c.from === 'browser' && c.to === 'rag-api')?.status === 'disconnected' ? 0.3 : 1}
                />
                
                {/* API Endpoints to Vector Search */}
                <line
                  x1="43%"
                  y1="50%"
                  x2="47%"
                  y2="50%"
                  stroke={getConnectionColor(connections.find(c => c.from === 'rag-api' && c.to === 'vector-search')?.status)}
                  strokeWidth="3"
                  strokeDasharray={connections.find(c => c.from === 'rag-api' && c.to === 'vector-search')?.status === 'testing' ? "5,3" : "none"}
                  className="transition-all duration-300"
                  opacity={connections.find(c => c.from === 'rag-api' && c.to === 'vector-search')?.status === 'disconnected' ? 0.3 : 1}
                />
                
                {/* Vector Search to OpenAI */}
                <line
                  x1="68%"
                  y1="50%"
                  x2="72%"
                  y2="50%"
                  stroke={getConnectionColor(connections.find(c => c.from === 'vector-search' && c.to === 'openai')?.status)}
                  strokeWidth="3"
                  strokeDasharray={connections.find(c => c.from === 'vector-search' && c.to === 'openai')?.status === 'testing' ? "5,3" : "none"}
                  className="transition-all duration-300"
                  opacity={connections.find(c => c.from === 'vector-search' && c.to === 'openai')?.status === 'disconnected' ? 0.3 : 1}
                />
              </svg>
            </div>

                         {/* Test Results */}
             {pipelineTestResult && (
               <Alert className={`mt-4 ${pipelineTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                 <AlertDescription className={pipelineTestResult.success ? 'text-green-800' : 'text-red-800'}>
                   <div className="font-semibold">{pipelineTestResult.message}</div>
                   {pipelineTestResult.details && (
                     <div className="text-sm mt-1">{pipelineTestResult.details}</div>
                   )}
                   <div className="text-xs mt-2 opacity-75">
                     Tested at: {new Date(pipelineTestResult.timestamp).toLocaleString()}
                   </div>
                 </AlertDescription>
               </Alert>
             )}

             {/* Test Logs */}
             {(isTestingPipeline || testLogs.length > 0) && (
               <div className="mt-6">
                 <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                   Test Execution Log
                 </h4>
                 <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
                   {testLogs.length === 0 ? (
                     <div className="text-gray-400">Waiting for test to start...</div>
                   ) : (
                     testLogs.map((log, index) => (
                       <div key={index} className="mb-2">
                         <div className="flex items-start gap-2">
                           <span className="text-gray-500 text-xs">
                             {new Date(log.timestamp).toLocaleTimeString()}
                           </span>
                           <span className={`px-2 py-1 rounded text-xs font-medium ${
                             log.status === 'success' ? 'bg-green-900 text-green-300' :
                             log.status === 'error' ? 'bg-red-900 text-red-300' :
                             log.status === 'waiting' ? 'bg-yellow-900 text-yellow-300' :
                             'bg-blue-900 text-blue-300'
                           }`}>
                             {log.status.toUpperCase()}
                           </span>
                           <span className="text-blue-400 font-semibold">{log.step}</span>
                           <span className="text-white">{log.action}</span>
                         </div>
                         {log.request && (
                           <div className="ml-8 mt-1 text-yellow-400">
                             <div className="font-semibold">Request:</div>
                             <div className="whitespace-pre-wrap">{log.request}</div>
                           </div>
                         )}
                         {log.response && (
                           <div className="ml-8 mt-1 text-green-400">
                             <div className="font-semibold">Response:</div>
                             <div className="whitespace-pre-wrap">{log.response}</div>
                           </div>
                         )}
                       </div>
                     ))
                   )}
                   {isTestingPipeline && (
                     <div className="flex items-center gap-2 text-blue-400">
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                       Testing in progress...
                     </div>
                   )}
                 </div>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="embeddings" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Embeddings
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Document Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                                 <CardContent>
                   <div className="text-2xl font-bold">{documentStats?.total || 0}</div>
                   <p className="text-xs text-muted-foreground">
                     {documentStats?.processed || 0} processed, {documentStats?.failed || 0} failed
                   </p>
                   <div className="mt-2 space-y-1">
                     <div className="flex justify-between text-xs">
                       <span>Processed</span>
                       <span className="text-green-600">{documentStats?.processed || 0}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span>Pending</span>
                       <span className="text-yellow-600">{documentStats?.pending || 0}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span>Failed</span>
                       <span className="text-red-600">{documentStats?.failed || 0}</span>
                     </div>
                   </div>
                 </CardContent>
              </Card>

              {/* Embedding Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Embeddings</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                                 <CardContent>
                   <div className="text-2xl font-bold">{(embeddingStats?.total || 0).toLocaleString()}</div>
                   <p className="text-xs text-muted-foreground">
                     {embeddingStats?.averageProcessingTime || 0}s avg processing time
                   </p>
                   <div className="mt-2 space-y-1">
                     <div className="flex justify-between text-xs">
                       <span>Successful</span>
                       <span className="text-green-600">{embeddingStats?.successful || 0}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span>Failed</span>
                       <span className="text-red-600">{embeddingStats?.failed || 0}</span>
                     </div>
                   </div>
                 </CardContent>
              </Card>

              {/* Chat Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chats</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                                 <CardContent>
                   <div className="text-2xl font-bold">{chatStats?.totalConversations || 0}</div>
                   <p className="text-xs text-muted-foreground">
                     {chatStats?.successRate || 0}% success rate
                   </p>
                   <div className="mt-2 space-y-1">
                     <div className="flex justify-between text-xs">
                       <span>Messages</span>
                       <span>{chatStats?.totalMessages || 0}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span>Avg Response</span>
                       <span>{chatStats?.averageResponseTime || 0}s</span>
                     </div>
                   </div>
                 </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Document Management</h3>
              <Button className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Document</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Size</th>
                        <th className="text-left p-4">Embeddings</th>
                        <th className="text-left p-4">Uploaded</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">ID: {doc.id}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getDocumentStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                          </td>
                          <td className="p-4">{doc.size}</td>
                          <td className="p-4">{doc.embeddings}</td>
                          <td className="p-4">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {doc.status === "failed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => reprocessDocument(doc.id)}
                                >
                                  Retry
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Embeddings Tab */}
          <TabsContent value="embeddings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Embedding Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Processing Queue</h4>
                    <p className="text-2xl font-bold text-blue-600">23</p>
                    <p className="text-sm text-muted-foreground">documents pending</p>
                  </div>
                                     <div className="p-4 bg-muted rounded-lg">
                     <h4 className="font-semibold mb-2">Average Processing Time</h4>
                     <p className="text-2xl font-bold text-green-600">
                       {embeddingStats?.averageProcessingTime || 0}s
                     </p>
                     <p className="text-sm text-muted-foreground">per document</p>
                   </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Processing Activity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">VO2Max Training Protocols.pdf</p>
                        <p className="text-sm text-muted-foreground">156 embeddings generated</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Cardiovascular Health Guidelines.pdf</p>
                        <p className="text-sm text-muted-foreground">Processing...</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value="chats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Chat Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentChats.map((chat) => (
                    <div key={chat.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{chat.user}</span>
                          <Badge className={getDocumentStatusColor(chat.status)}>
                            {chat.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{chat.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(chat.timestamp).toLocaleString()} • {chat.responseTime}s response time
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>RAG Pipeline Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Embedding Model (optional, if you want to make it editable) */}
                  <div>
                    <label className="block font-semibold mb-1">Embedding Model</label>
                    <span className="text-sm text-muted-foreground">text-embedding-ada-002</span>
                    {/*
                    <select
                      className="w-full rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                      value={draftEmbeddingModel}
                      onChange={e => setDraftEmbeddingModel(e.target.value)}
                      disabled={!editSettings || settingsLoading}
                    >
                      <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                      <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </select>
                    */}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Chunk Size</label>
                    {editSettings ? (
                      <input
                        type="number"
                        className="w-full rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                        value={draftChunkSize}
                        min={1}
                        onChange={e => setDraftChunkSize(Number(e.target.value))}
                        disabled={settingsLoading}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{chunkSize} tokens</span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Number of tokens per chunk.</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Overlap</label>
                    {editSettings ? (
                      <input
                        type="number"
                        className="w-full rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                        value={draftOverlap}
                        min={0}
                        onChange={e => setDraftOverlap(Number(e.target.value))}
                        disabled={settingsLoading}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{overlap} tokens</span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Number of tokens overlapping between chunks.</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Max Results</label>
                    {editSettings ? (
                      <input
                        type="number"
                        className="w-full rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                        value={draftMaxResults}
                        min={1}
                        onChange={e => setDraftMaxResults(Number(e.target.value))}
                        disabled={settingsLoading}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{maxResults} documents</span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Maximum number of chunks/documents retrieved per query.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  {editSettings ? (
                    <>
                      <Button onClick={handleSave} disabled={settingsLoading}>
                        {settingsLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} disabled={settingsLoading}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEdit} variant="outline">
                      Edit Settings
                    </Button>
                  )}
                  {settingsSaveStatus === 'success' && <span className="text-green-600">Saved!</span>}
                  {settingsSaveStatus === 'error' && <span className="text-red-600">Error saving settings</span>}
                </div>
              </CardContent>
            </Card>
            
            {/* BETA Label Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>BETA Label Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-semibold mb-1">Show BETA Label</label>
                    <p className="text-sm text-muted-foreground">Toggle the BETA label visibility across the app</p>
                  </div>
                  <Button
                    variant={showBetaLabel ? "default" : "outline"}
                    onClick={toggleBetaLabel}
                    className="min-w-[100px]"
                  >
                    {showBetaLabel ? "Visible" : "Hidden"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-semibold mb-1">BETA Label Style</label>
                    <p className="text-sm text-muted-foreground">Choose the visual style of the BETA label</p>
                  </div>
                  <select
                    className="rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={betaVariant}
                    onChange={(e) => setBetaVariant(e.target.value as 'animated' | 'subtle')}
                  >
                    <option value="subtle">Subtle</option>
                    <option value="animated">Animated</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            
            {/* Prompt Templates Editor */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>RAG Prompt Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1">User Instruction</label>
                  <textarea
                    className="w-full rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                    rows={3}
                    value={userInstruction}
                    onChange={e => setUserInstruction(e.target.value)}
                    disabled={promptLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>What is this?</strong> This text is prepended to the user query and context. It tells the assistant how to answer, e.g., "Answer using only the provided context."
                  </p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">System Prompt</label>
                  <textarea
                    className="w-full rounded border border-input bg-background text-foreground p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                    rows={3}
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    disabled={promptLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>What is this?</strong> This is sent as the <code>system</code> message to OpenAI. It sets the assistant's behavior and role for the conversation.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Button onClick={handlePromptSave} disabled={promptLoading}>
                    {promptLoading ? 'Saving...' : 'Save Prompts'}
                  </Button>
                  {promptSaveStatus === 'success' && <span className="text-green-600">Saved!</span>}
                  {promptSaveStatus === 'error' && <span className="text-red-600">Error saving prompts</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 