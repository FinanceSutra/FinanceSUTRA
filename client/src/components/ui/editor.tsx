import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Initialize Monaco
self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId, label) {
    if (label === 'json') {
      return '/monaco-editor/esm/vs/language/json/json.worker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return '/monaco-editor/esm/vs/language/css/css.worker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return '/monaco-editor/esm/vs/language/html/html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return '/monaco-editor/esm/vs/language/typescript/ts.worker.js';
    }
    return '/monaco-editor/esm/vs/editor/editor.worker.js';
  },
};

// Define the props for the CodeEditor component
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  theme?: string;
  onRun?: () => void;
  onSave?: () => void;
}

// Default Python code sample
const DEFAULT_CODE = `
class MACrossoverStrategy:
    def __init__(self, fast_period=12, slow_period=26):
        self.fast_period = fast_period
        self.slow_period = slow_period
        
    def generate_signals(self, data):
        """Generate trading signals based on moving average crossover."""
        
        data['fast_ma'] = data['close'].rolling(self.fast_period).mean()
        data['slow_ma'] = data['close'].rolling(self.slow_period).mean()
        
        data['signal'] = 0
        data.loc[data['fast_ma'] > data['slow_ma'], 'signal'] = 1    # Buy signal
        data.loc[data['fast_ma'] < data['slow_ma'], 'signal'] = -1   # Sell signal
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest and calculate performance metrics."""
        
        signals = self.generate_signals(data)
        return self._calculate_returns(signals, initial_capital)
`;

// Demo python tokenizer with some basic coloring patterns for the fallback implementation
const tokenizePython = (code: string) => {
  return code.replace(
    /(\"\"\".*?\"\"\")|(\bclass\b|\bdef\b|\bimport\b|\bfrom\b|\breturn\b|\bself\b|\bas\b|\bif\b|\belse\b|\belif\b|\bfor\b|\bin\b|\bwhile\b|\btry\b|\bexcept\b|\bfinally\b|\bwith\b|\bNone\b|\bTrue\b|\bFalse\b)/g,
    (match, docstring, keyword) => {
      if (docstring) return `<span class="text-green-400">${docstring}</span>`;
      if (keyword) return `<span class="text-purple-400">${keyword}</span>`;
      return match;
    }
  ).replace(
    /(#.*)|(\d+(\.\d+)?)|('\w+'|"\w+")/g,
    (match, comment, number, _decimal, string) => {
      if (comment) return `<span class="text-green-400">${comment}</span>`;
      if (number) return `<span class="text-orange-400">${number}</span>`;
      if (string) return `<span class="text-orange-400">${string}</span>`;
      return match;
    }
  );
};

// The CodeEditor component
const CodeEditor: React.FC<CodeEditorProps> = ({
  value = DEFAULT_CODE,
  onChange,
  language = 'python',
  height = '400px',
  theme = 'vs-dark',
  onRun,
  onSave,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [activeTab, setActiveTab] = React.useState('code');
  const [backtestResults, setBacktestResults] = React.useState(null);

  // Initialize Monaco editor
  useEffect(() => {
    if (editorRef.current) {
      try {
        monacoEditorRef.current = monaco.editor.create(editorRef.current, {
          value,
          language,
          theme,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: 'Fira Code, Menlo, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          padding: { top: 10 },
        });

        monacoEditorRef.current.onDidChangeModelContent(() => {
          if (monacoEditorRef.current) {
            onChange(monacoEditorRef.current.getValue());
          }
        });

        return () => {
          if (monacoEditorRef.current) {
            monacoEditorRef.current.dispose();
          }
        };
      } catch (error) {
        console.error("Failed to load Monaco editor:", error);
      }
    }
  }, []);

  // Handle run button click
  const handleRun = () => {
    if (onRun) {
      onRun();
    }
    // Mock backtest results
    setBacktestResults({
      initialCapital: 10000,
      finalCapital: 12500,
      profit: 2500,
      percentReturn: 25,
      sharpeRatio: 1.8,
      maxDrawdown: 8.2,
      trades: 42,
      winRate: 68
    });
    setActiveTab('backtest');
  };

  // Handle save button click
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  // Fallback render when Monaco editor fails to load
  const renderFallbackEditor = () => {
    const lines = value.split('\n');
    
    return (
      <div className="font-mono text-sm overflow-x-auto bg-neutral-800 text-white p-4 rounded-md" style={{ height }}>
        <div className="flex">
          <div className="code-line-numbers pr-4 select-none w-10 text-right">
            {lines.map((_, i) => (
              <div key={i} className="text-neutral-500">{i + 1}</div>
            ))}
          </div>
          <pre className="flex-1 overflow-auto">
            <code dangerouslySetInnerHTML={{ __html: tokenizePython(value) }} />
          </pre>
        </div>
      </div>
    );
  };

  // Render backtest results tab
  const renderBacktestResults = () => {
    if (!backtestResults) {
      return <div className="p-6 text-center text-neutral-500">Run backtest to see results</div>;
    }

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Backtest Results</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Initial Capital</p>
            <p className="text-xl font-semibold">${backtestResults.initialCapital.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Final Capital</p>
            <p className="text-xl font-semibold">${backtestResults.finalCapital.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Profit/Loss</p>
            <p className="text-xl font-semibold text-success">+${backtestResults.profit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Return</p>
            <p className="text-xl font-semibold text-success">+{backtestResults.percentReturn}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Sharpe Ratio</p>
            <p className="text-xl font-semibold">{backtestResults.sharpeRatio}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Max Drawdown</p>
            <p className="text-xl font-semibold">{backtestResults.maxDrawdown}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Number of Trades</p>
            <p className="text-xl font-semibold">{backtestResults.trades}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-500">Win Rate</p>
            <p className="text-xl font-semibold">{backtestResults.winRate}%</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex border-b border-neutral-200">
          <TabsList className="border-b-0">
            <TabsTrigger value="code" className="px-5 py-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Code Editor
            </TabsTrigger>
            <TabsTrigger value="backtest" className="px-5 py-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Backtest
            </TabsTrigger>
            <TabsTrigger value="results" className="px-5 py-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Results
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="code" className="p-0 border-0 m-0">
          <div className="bg-neutral-800 text-white">
            <div ref={editorRef} style={{ height }} />
            {!monacoEditorRef.current && renderFallbackEditor()}
          </div>
        </TabsContent>
        
        <TabsContent value="backtest" className="p-0 border-0 m-0">
          {renderBacktestResults()}
        </TabsContent>
        
        <TabsContent value="results" className="p-0 border-0 m-0">
          <div className="p-6 text-center text-neutral-500">
            No results available yet. Run a backtest first.
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="p-4 bg-neutral-50 text-sm space-x-4 flex justify-end">
        <button 
          className="text-neutral-600 hover:text-neutral-900 font-medium"
          onClick={() => onChange(DEFAULT_CODE)}
        >
          Reset
        </button>
        <button 
          className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-md font-medium hover:bg-neutral-300"
          onClick={handleRun}
        >
          Run Backtest
        </button>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark"
          onClick={handleSave}
        >
          Save Strategy
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;
