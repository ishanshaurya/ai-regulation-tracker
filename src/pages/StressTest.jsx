import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertCircle, Zap, TrendingUp, Clock, Activity } from 'lucide-react';

const StressTest = () => {
  const [deployUrl, setDeployUrl] = useState('');
  const [endpoint, setEndpoint] = useState('/');
  const [architecture, setArchitecture] = useState('');
  const [maxConcurrent, setMaxConcurrent] = useState(1000);
  const [httpMethod, setHttpMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const chartDataRef = useRef([]);

  // Validate URL
  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Simulate concurrent HTTP requests
  const simulateConcurrentRequests = async (url, count) => {
    const results = [];
    const startTime = Date.now();

    // Create request promises for concurrent execution
    const requests = Array(count)
      .fill(null)
      .map((_, i) =>
        fetch(url, {
          method: httpMethod,
          headers: { 'Content-Type': 'application/json' },
          body: httpMethod !== 'GET' ? requestBody : undefined,
        })
          .then((res) => ({
            success: true,
            status: res.status,
            time: Date.now() - startTime,
            index: i,
          }))
          .catch((err) => ({
            success: false,
            error: err.message,
            time: Date.now() - startTime,
            index: i,
          }))
      );

    // Execute all in parallel
    const responses = await Promise.all(requests);
    return responses.sort((a, b) => a.time - b.time);
  };

  // Run stress test with increasing load tiers
  const runStressTest = async () => {
    if (!deployUrl.trim()) {
      setError('Please enter your deployment URL');
      return;
    }

    if (!validateUrl(deployUrl)) {
      setError('Invalid URL. Must include https://');
      return;
    }

    setIsRunning(true);
    setError('');
    setResults(null);
    chartDataRef.current = [];

    try {
      const baseUrl = deployUrl.endsWith('/') ? deployUrl : deployUrl + '/';
      const fullUrl = baseUrl + endpoint.replace(/^\//, '');

      // Load tiers to test
      const tiers = [10, 100, 500, 1000].filter((t) => t <= maxConcurrent);
      const allResults = {
        tiers: [],
        chartData: [],
        overall: {
          totalRequests: 0,
          successCount: 0,
          errorCount: 0,
          avgLatency: 0,
          maxLatency: 0,
          p99Latency: 0,
          breakingPoint: null,
        },
        bottlenecks: [],
      };

      for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
        const tier = tiers[tierIndex];
        setProgress(((tierIndex + 1) / tiers.length) * 100);

        // Simulate concurrent requests for this tier
        const tierResults = await simulateConcurrentRequests(fullUrl, tier);

        const successes = tierResults.filter((r) => r.success);
        const failures = tierResults.filter((r) => !r.success);
        const latencies = successes.map((r) => r.time).sort((a, b) => a - b);

        const tierStats = {
          tier,
          requestCount: tier,
          successCount: successes.length,
          errorCount: failures.length,
          successRate: ((successes.length / tier) * 100).toFixed(1),
          avgLatency: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
          maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
          p99Latency: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] || 0 : 0,
        };

        allResults.tiers.push(tierStats);
        allResults.chartData.push({
          tier: `${tier} users`,
          avgLatency: tierStats.avgLatency,
          p99Latency: tierStats.p99Latency,
          errorRate: (failures.length / tier) * 100,
          requests: tier,
        });

        allResults.overall.totalRequests += tier;
        allResults.overall.successCount += successes.length;
        allResults.overall.errorCount += failures.length;

        // Detect breaking point (>10% error rate)
        if (!allResults.overall.breakingPoint && failures.length / tier > 0.1) {
          allResults.overall.breakingPoint = `${tier} concurrent users`;
        }
      }

      // Calculate overall stats
      const allLatencies = allResults.tiers
        .flatMap((t) => Array(t.successCount).fill(t.avgLatency))
        .sort((a, b) => a - b);

      allResults.overall.avgLatency = Math.round(
        allResults.tiers.reduce((sum, t) => sum + t.avgLatency * t.successCount, 0) /
          allResults.overall.successCount
      );
      allResults.overall.maxLatency = Math.max(...allResults.tiers.map((t) => t.maxLatency));
      allResults.overall.p99Latency = allLatencies[Math.floor(allLatencies.length * 0.99)] || 0;

      // Detect bottlenecks based on architecture
      const bottlenecks = detectBottlenecks(
        allResults.tiers,
        architecture,
        deployUrl
      );
      allResults.bottlenecks = bottlenecks;

      // Call AI for smart analysis
      const aiAnalysis = await getAIBottleneckAnalysis(
        architecture,
        allResults,
        deployUrl
      );
      allResults.aiAnalysis = aiAnalysis;

      setResults(allResults);
      chartDataRef.current = allResults.chartData;
    } catch (err) {
      setError(`Test failed: ${err.message}`);
      console.error(err);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  // Local heuristic bottleneck detection
  const detectBottlenecks = (tiers, architecture, url) => {
    const bottlenecks = [];

    // Analyze latency growth
    for (let i = 1; i < tiers.length; i++) {
      const prev = tiers[i - 1];
      const curr = tiers[i];
      const latencyGrowth = ((curr.avgLatency - prev.avgLatency) / prev.avgLatency) * 100;

      if (latencyGrowth > 50) {
        bottlenecks.push({
          severity: 'high',
          title: `High latency spike at ${curr.tier} users`,
          description: `Latency jumped ${latencyGrowth.toFixed(0)}% from ${prev.tier} to ${curr.tier} users`,
          advice: 'Consider caching, database optimization, or horizontal scaling',
        });
      }
    }

    // Error rate detection
    const lastTier = tiers[tiers.length - 1];
    if (lastTier.errorCount > lastTier.requestCount * 0.05) {
      bottlenecks.push({
        severity: 'critical',
        title: 'High error rate under load',
        description: `${lastTier.errorRate}% of requests failed at ${lastTier.tier} concurrent users`,
        advice: 'Your endpoint is overloaded. Check rate limiting, connection pooling, and resource limits.',
      });
    }

    // Slow endpoint detection
    if (lastTier.avgLatency > 5000) {
      bottlenecks.push({
        severity: 'high',
        title: 'Slow endpoint response time',
        description: `Average response time is ${lastTier.avgLatency}ms at peak load`,
        advice: 'Profile your code. Check for N+1 queries, slow AI API calls, or missing indexes.',
      });
    }

    return bottlenecks;
  };

  // Call AI for intelligent bottleneck analysis
  const getAIBottleneckAnalysis = async (architecture, results, deployUrl) => {
    try {
      const prompt = `
You are a DevOps expert analyzing load test results. Given this architecture and load test data, provide 2-3 specific recommendations.

Architecture: ${architecture}
Deployment: ${deployUrl}

Load Test Results:
${results.tiers
  .map(
    (t) =>
      `${t.tier} concurrent users: ${t.avgLatency}ms avg, ${t.p99Latency}ms p99, ${t.errorRate}% errors`
  )
  .join('\n')}

Breaking point: ${results.overall.breakingPoint || 'None detected'}

Provide a JSON response with this structure:
{
  "summary": "1 sentence summary of health",
  "recommendations": [
    { "priority": "critical|high|medium", "action": "specific action", "expectedImpact": "expected improvement" }
  ],
  "nextSteps": "what to do next"
}
`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          maxTokens: 1000,
        }),
      });

      const data = await response.json();

      try {
        return JSON.parse(data.response);
      } catch {
        return {
          summary: 'Load test completed. Review results above.',
          recommendations: [],
          nextSteps: 'Monitor production metrics and implement optimizations as needed.',
        };
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg p-3">
            <Zap className="w-6 h-6 text-[#00ff88]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Stress Tester</h1>
            <p className="text-gray-400">
              Test your deployed site with increasing concurrent load → Identify bottlenecks → Get AI recommendations
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#ccffee]">
            <strong>Real Endpoint Testing:</strong> We'll probe your live deployed URL with simulated concurrent requests.
            Your endpoint will receive actual traffic. Use a staging URL if you prefer not to load-test production.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 space-y-6 sticky top-8">
              <div>
                <label className="block text-sm font-semibold mb-2">Deployment URL *</label>
                <input
                  type="text"
                  placeholder="https://myapp.vercel.app"
                  value={deployUrl}
                  onChange={(e) => setDeployUrl(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-[#0d0d0d] border border-[#222222] rounded px-3 py-2 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">Include https://</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Endpoint Path</label>
                <input
                  type="text"
                  placeholder="/"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-[#0d0d0d] border border-[#222222] rounded px-3 py-2 text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., /api/analyze or /api/health</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">HTTP Method</label>
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-[#0d0d0d] border border-[#222222] rounded px-3 py-2 text-white focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>

              {httpMethod !== 'GET' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Request Body (JSON)</label>
                  <textarea
                    placeholder='{"test": "data"}'
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    disabled={isRunning}
                    rows={4}
                    className="w-full bg-[#0d0d0d] border border-[#222222] rounded px-3 py-2 text-white placeholder-gray-500 text-xs focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Max Load to Test: {maxConcurrent} users
                </label>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="100"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(parseInt(e.target.value))}
                  disabled={isRunning}
                  className="w-full disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">Tiers: 10, 100, 500, 1K, 5K</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Architecture Description</label>
                <textarea
                  placeholder="e.g., Vercel frontend + Supabase DB + Claude API calls on /api/analyze"
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value)}
                  disabled={isRunning}
                  rows={4}
                  className="w-full bg-[#0d0d0d] border border-[#222222] rounded px-3 py-2 text-white placeholder-gray-500 text-xs focus:border-[#00ff88] focus:outline-none disabled:opacity-50"
                />
              </div>

              <button
                onClick={runStressTest}
                disabled={isRunning}
                className="w-full bg-[#00ff88] hover:bg-[#00cc6a] disabled:bg-[#1a1a1a] text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" />
                    Running... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run Stress Test
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!results && !isRunning && (
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-12 text-center">
                <Zap className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">Enter your URL and click "Run Stress Test" to begin</p>
              </div>
            )}

            {isRunning && (
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8 text-center">
                <Activity className="w-12 h-12 text-[#00ff88] mx-auto mb-4 animate-spin" />
                <p className="text-lg font-semibold mb-2">Running stress test...</p>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div
                    className="bg-[#00ff88] h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">{Math.round(progress)}% complete</p>
              </div>
            )}

            {results && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Peak Avg Latency"
                    value={`${results.overall.avgLatency}ms`}
                  />
                  <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="P99 Latency"
                    value={`${results.overall.p99Latency}ms`}
                  />
                  <StatCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Success Rate"
                    value={`${((results.overall.successCount / results.overall.totalRequests) * 100).toFixed(1)}%`}
                  />
                  <StatCard
                    icon={<AlertCircle className="w-5 h-5" />}
                    label="Breaking Point"
                    value={results.overall.breakingPoint || 'None detected'}
                  />
                </div>

                {/* Latency Chart */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Latency & Error Rates</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={results.chartData}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis dataKey="tier" stroke="#444" />
                      <YAxis stroke="#444" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111111',
                          border: '1px solid #1a1a1a',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [`${value.toFixed(0)}ms`, 'Latency']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="avgLatency"
                        stroke="#00ff88"
                        fillOpacity={1}
                        fill="url(#colorLatency)"
                        name="Avg Latency"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Tier Breakdown */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Per-Tier Breakdown</h3>
                  <div className="space-y-3">
                    {results.tiers.map((tier, idx) => (
                      <div key={idx} className="bg-[#0d0d0d] rounded p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{tier.tier} concurrent users</p>
                          <p className="text-sm text-gray-400">
                            {tier.successCount}/{tier.requestCount} successful
                            {tier.errorCount > 0 && ` • ${tier.errorRate}% error rate`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold">{tier.avgLatency}ms</p>
                          <p className="text-sm text-gray-400">p99: {tier.p99Latency}ms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottleneck Detection */}
                {results.bottlenecks.length > 0 && (
                  <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#00ff88]" />
                      Detected Bottlenecks
                    </h3>
                    <div className="space-y-3">
                      {results.bottlenecks.map((bn, idx) => (
                        <div
                          key={idx}
                          className={`rounded p-4 border ${
                            bn.severity === 'critical'
                              ? 'bg-[#0d0d0d] border-red-500/30'
                              : 'bg-[#0d0d0d] border-yellow-500/30'
                          }`}
                        >
                          <p className="font-semibold text-white">{bn.title}</p>
                          <p className="text-sm text-gray-300 mt-1">{bn.description}</p>
                          <p className="text-sm mt-2 text-green-300">💡 {bn.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {results.aiAnalysis && (
                  <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
                    <p className="text-gray-300 mb-4">{results.aiAnalysis.summary}</p>
                    {results.aiAnalysis.recommendations.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {results.aiAnalysis.recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-[#0d0d0d] rounded p-3 text-sm">
                            <p className="font-semibold text-white">
                              [{rec.priority.toUpperCase()}] {rec.action}
                            </p>
                            <p className="text-gray-400 mt-1">Expected impact: {rec.expectedImpact}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-400">Next steps: {results.aiAnalysis.nextSteps}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-[#00ff88]">{icon}</div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default StressTest;
