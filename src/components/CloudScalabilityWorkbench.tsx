import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  ShieldAlert, 
  HardDrive, 
  Activity, 
  Globe, 
  Layers, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Play, 
  RotateCcw,
  CloudLightning,
  Wifi,
  FileText,
  Clock,
  Check
} from 'lucide-react';

export function CloudScalabilityWorkbench() {
  const [activeModule, setActiveModule] = useState<'lb' | 'redis' | 'gateway' | 's3' | 'mq' | 'cdn' | 'pool' | 'autoscaling' | 'observability' | 'dr'>('lb');

  // 1. Load Balancer State
  const [lbAlgorithm, setLbAlgorithm] = useState<'round-robin' | 'least-connections'>('round-robin');
  const [nodeCount, setNodeCount] = useState<number>(4);
  const [lbNodes, setLbNodes] = useState([
    { id: 'node-1', name: 'us-east-core-01', weight: 1, activeConns: 12, health: 'Healthy', requestsHandled: 4820, latency: 14 },
    { id: 'node-2', name: 'us-east-core-02', weight: 1, activeConns: 8, health: 'Healthy', requestsHandled: 4150, latency: 12 },
    { id: 'node-3', name: 'eu-west-edge-01', weight: 2, activeConns: 19, health: 'Healthy', requestsHandled: 7930, latency: 28 },
    { id: 'node-4', name: 'af-south-nairobi-01', weight: 2, activeConns: 15, health: 'Healthy', requestsHandled: 9140, latency: 8 },
  ]);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [trafficLog, setTrafficLog] = useState<string[]>([]);

  const simulateLoadBalancerTraffic = () => {
    setIsSimulatingTraffic(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const targetIdx = lbAlgorithm === 'round-robin' 
        ? (count % nodeCount) 
        : lbNodes.reduce((minIdx, n, idx, arr) => n.activeConns < arr[minIdx].activeConns ? idx : minIdx, 0);

      setLbNodes(prev => prev.map((node, i) => {
        if (i === targetIdx) {
          return {
            ...node,
            activeConns: node.activeConns + Math.floor(Math.random() * 3) + 1,
            requestsHandled: node.requestsHandled + 1
          };
        }
        return node;
      }));

      setTrafficLog(prev => [
        `[${new Date().toLocaleTimeString()}] Routed HTTP request #${count} via ${lbAlgorithm.toUpperCase()} to node ${lbNodes[targetIdx]?.name} (${lbNodes[targetIdx]?.latency}ms latency)`,
        ...prev.slice(0, 15)
      ]);

      if (count >= 15) {
        clearInterval(interval);
        setIsSimulatingTraffic(false);
      }
    }, 200);
  };

  // 2. Redis Cache State
  const [redisEnabled, setRedisEnabled] = useState(true);
  const [cacheHits, setCacheHits] = useState(14820);
  const [cacheMisses, setCacheMisses] = useState(512);
  const [redisKeys, setRedisKeys] = useState([
    { key: 'cache:patients:all', ttl: '58m', size: '248 KB', hits: 4320 },
    { key: 'cache:lab_catalog:active', ttl: '23h', size: '42 KB', hits: 8150 },
    { key: 'cache:pharmacy:stock_summary', ttl: '12m', size: '116 KB', hits: 2350 },
    { key: 'cache:auth:session_tokens', ttl: '4m', size: '18 KB', hits: 910 },
  ]);

  const flushRedisCache = () => {
    setCacheHits(0);
    setCacheMisses(0);
    setRedisKeys(prev => prev.map(k => ({ ...k, hits: 0 })));
  };

  // 3. API Gateway Rate Limiter State
  const [rateLimitRpm, setRateLimitRpm] = useState(120);
  const [requestCount, setRequestCount] = useState(48);
  const [blockedRequests, setBlockedRequests] = useState(0);
  const [clientIp, setClientIp] = useState('192.168.1.105');

  const simulateApiBurst = () => {
    let blocked = 0;
    let allowed = 0;
    for (let i = 0; i < 25; i++) {
      if (requestCount + i > rateLimitRpm) {
        blocked++;
      } else {
        allowed++;
      }
    }
    setRequestCount(prev => Math.min(rateLimitRpm, prev + allowed));
    setBlockedRequests(prev => prev + blocked);
  };

  // 4. Object Storage (S3) State
  const [s3Files, setS3Files] = useState([
    { name: 'DICOM_Patient_Chest_Xray_2026.dcm', size: '42.8 MB', bucket: 'pcea-medical-imaging-s3', uploaded: '2026-08-09 14:22' },
    { name: 'Lab_Pathology_Biopsy_Scans.pdf', size: '14.2 MB', bucket: 'pcea-clinical-documents-s3', uploaded: '2026-08-10 08:15' },
    { name: 'Board_Meeting_Financial_Audit_Q2.xlsx', size: '3.4 MB', bucket: 'pcea-executive-vault-s3', uploaded: '2026-08-01 09:00' },
  ]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const simulateUpload = () => {
    setUploadProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setUploadProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setS3Files(prev => [
            { name: `Clinical_Record_Archive_${Math.floor(Math.random() * 9000)}.pdf`, size: '8.5 MB', bucket: 'pcea-clinical-documents-s3', uploaded: new Date().toISOString().replace('T', ' ').substring(0, 16) },
            ...prev
          ]);
          setUploadProgress(null);
        }, 400);
      }
    }, 250);
  };

  // 5. Asynchronous Message Queue State
  const [mqJobs, setMqJobs] = useState([
    { id: 'JOB-9481', type: 'AI Compliance Lab OCR Audit', status: 'Completed', duration: '142ms', queue: 'high-priority' },
    { id: 'JOB-9482', type: 'Bulk SMS Patient Appointments Dispatch', status: 'Processing', duration: '480ms', queue: 'notifications' },
    { id: 'JOB-9483', type: 'Monthly Board Financial PDF Export', status: 'Queued', duration: '-', queue: 'reports' },
    { id: 'JOB-9484', type: 'Insurance Claims Electronic Batch Sync', status: 'Queued', duration: '-', queue: 'billing' },
  ]);
  const [workerCount, setWorkerCount] = useState(6);

  const triggerNewJob = () => {
    const newJob = {
      id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      type: ['AI Clinical Diagnostic Review', 'Inventory Reorder Webhook', 'Encrypted Backup Snapshot'][Math.floor(Math.random() * 3)],
      status: 'Processing',
      duration: '85ms',
      queue: 'default'
    };
    setMqJobs(prev => [newJob, ...prev]);
  };

  // 6. Global CDN State
  const [cdnEnabled, setCdnEnabled] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('Nairobi (KE)');
  const cdnRegions = [
    { name: 'Nairobi (KE)', pop: 'NBO-01', ping: '12ms', hitRate: '99.2%' },
    { name: 'Frankfurt (DE)', pop: 'FRA-04', ping: '112ms', hitRate: '94.8%' },
    { name: 'London (UK)', pop: 'LON-02', ping: '98ms', hitRate: '96.1%' },
    { name: 'Tokyo (JP)', pop: 'TYO-03', ping: '184ms', hitRate: '91.5%' },
    { name: 'New York (US)', pop: 'NYC-01', ping: '145ms', hitRate: '95.0%' },
  ];

  // 7. Connection Pool State
  const [poolActive, setPoolActive] = useState(18);
  const [poolIdle, setPoolIdle] = useState(32);
  const poolMax = 100;

  // 8. Auto-Scaling State
  const [cpuUsage, setCpuUsage] = useState(48);
  const [desiredReplicas, setDesiredReplicas] = useState(3);

  // 9. Observability State
  const [prometheusScrapes, setPrometheusScrapes] = useState(142050);

  // 10. Disaster Recovery State
  const [drStatus, setDrStatus] = useState<'Synced' | 'Failover Ready'>('Synced');
  const [replicationLag, setReplicationLag] = useState(0.38);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Enterprise Architecture Workbench
            </span>
            <span className="text-xs text-indigo-300 font-mono">10 Scalability Pillars Active</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Cloud Scalability & Production Architecture Engine</h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
            Interactive engineering workspace and live simulators for load balancing, Redis caching, API rate limiting, object storage, async message queues, edge CDN, connection pooling, auto-scaling, observability, and disaster recovery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] text-indigo-300 block uppercase font-mono">System Health</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
              <CheckCircle2 className="w-3.5 h-3.5" /> 99.99% SLA
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for 10 Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {[
          { id: 'lb', label: '1. Load Balancer', icon: Server },
          { id: 'redis', label: '2. Redis Cache', icon: Zap },
          { id: 'gateway', label: '3. API Gateway', icon: ShieldAlert },
          { id: 's3', label: '4. Object Storage', icon: HardDrive },
          { id: 'mq', label: '5. Message Queue', icon: CloudLightning },
          { id: 'cdn', label: '6. Edge CDN', icon: Globe },
          { id: 'pool', label: '7. Conn. Pool', icon: Layers },
          { id: 'autoscaling', label: '8. Auto-Scaling', icon: Cpu },
          { id: 'observability', label: '9. Observability', icon: Activity },
          { id: 'dr', label: '10. Disaster Rec.', icon: RefreshCw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as any)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isActive 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                  : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-2 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
              <span className="text-[11px] font-bold leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Module Display Area */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        
        {/* 1. LOAD BALANCER MODULE */}
        {activeModule === 'lb' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  1. High Traffic Load Balancer Simulator (Nginx / AWS ALB)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Distributes incoming clinical EMR traffic across active compute nodes using advanced balancing algorithms.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={lbAlgorithm}
                  onChange={(e) => setLbAlgorithm(e.target.value as any)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-800"
                >
                  <option value="round-robin">Algorithm: Round Robin</option>
                  <option value="least-connections">Algorithm: Least Connections</option>
                </select>
                <button
                  onClick={simulateLoadBalancerTraffic}
                  disabled={isSimulatingTraffic}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isSimulatingTraffic ? 'Routing Traffic...' : 'Simulate 15 Requests'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {lbNodes.map((node) => (
                <div key={node.id} className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 font-mono">{node.name}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {node.health}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Active Connections:</span>
                      <span className="font-bold text-indigo-600">{node.activeConns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requests Handled:</span>
                      <span className="font-bold text-stone-900">{node.requestsHandled.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Latency:</span>
                      <span className="font-bold text-emerald-700">{node.latency} ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto">
              <span className="text-slate-500 block mb-1"># Nginx Ingress Load Balancer Live Traffic Stream:</span>
              {trafficLog.length === 0 ? (
                <span className="text-slate-600 italic">Click "Simulate 15 Requests" to test load balancer routing...</span>
              ) : (
                trafficLog.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        )}

        {/* 2. REDIS CACHE MODULE */}
        {activeModule === 'redis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  2. Redis In-Memory Cache Layer & Database Acceleration
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Reduces Firestore / SQL database load by caching frequently accessed patient records and inventories.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRedisEnabled(!redisEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    redisEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  Redis Cache: {redisEnabled ? 'ONLINE (Active)' : 'BYPASSED'}
                </button>
                <button
                  onClick={flushRedisCache}
                  className="bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Flush Cache
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">Cache Hit Efficiency</span>
                <span className="text-3xl font-black text-emerald-950 mt-1 block">
                  {Math.round((cacheHits / (cacheHits + cacheMisses || 1)) * 100)}%
                </span>
                <span className="text-xs text-emerald-700 mt-1 block">{cacheHits.toLocaleString()} hits / {cacheMisses} misses</span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">Average Query Latency</span>
                <span className="text-3xl font-black text-indigo-950 mt-1 block">{redisEnabled ? '1.8 ms' : '142.5 ms'}</span>
                <span className="text-xs text-indigo-700 mt-1 block">{redisEnabled ? 'Served from RAM buffer' : 'Direct disk read'}</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">Memory Footprint</span>
                <span className="text-3xl font-black text-amber-950 mt-1 block">418 KB</span>
                <span className="text-xs text-amber-700 mt-1 block">Max limit: 512 MB (LRU Eviction)</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-700 uppercase">Active Redis Key-Value Store Registry</h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 font-semibold text-stone-600">
                    <tr>
                      <th className="p-3">Redis Key</th>
                      <th className="p-3">TTL Expiry</th>
                      <th className="p-3">Payload Size</th>
                      <th className="p-3 text-right">Hit Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {redisKeys.map((rk, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-3 font-bold text-indigo-700">{rk.key}</td>
                        <td className="p-3 text-stone-600">{rk.ttl}</td>
                        <td className="p-3 text-stone-600">{rk.size}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{rk.hits.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. API GATEWAY RATE LIMITER MODULE */}
        {activeModule === 'gateway' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  3. API Gateway & Token Bucket Rate Limiter (DDoS & Abuse Protection)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Protects backend clinical endpoints against scraping bots and accidental runaway client loops.
                </p>
              </div>
              <button
                onClick={simulateApiBurst}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" /> Simulate 25 Client Requests Burst
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-stone-600 uppercase">Rate Limit Threshold</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="10"
                    value={rateLimitRpm}
                    onChange={(e) => setRateLimitRpm(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-mono font-bold text-stone-900 text-sm whitespace-nowrap">{rateLimitRpm} RPM</span>
                </div>
                <p className="text-[11px] text-stone-400">Max requests allowed per IP address per minute.</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">Requests Allowed</span>
                <span className="text-3xl font-black text-emerald-950 mt-1 block">{requestCount}</span>
                <span className="text-xs text-emerald-700 mt-1 block">Token bucket active for IP {clientIp}</span>
              </div>

              <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">Throttled (HTTP 429)</span>
                <span className="text-3xl font-black text-rose-950 mt-1 block">{blockedRequests}</span>
                <span className="text-xs text-rose-700 mt-1 block">Abusive bot requests dropped</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. OBJECT STORAGE MODULE */}
        {activeModule === 's3' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-600" />
                  4. Object Storage Bucket Manager (AWS S3 / Google Cloud Storage)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Stores DICOM medical images, high-resolution laboratory pathology PDFs, and encrypted board audit archives.
                </p>
              </div>
              <button
                onClick={simulateUpload}
                disabled={uploadProgress !== null}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                {uploadProgress !== null ? `Uploading (${uploadProgress}%)...` : 'Upload Sample DICOM Scan'}
              </button>
            </div>

            {uploadProgress !== null && (
              <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-cyan-900">
                  <span>Uploading Object via Multipart S3 Protocol...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-cyan-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 font-semibold text-stone-600">
                  <tr>
                    <th className="p-3">Object Name</th>
                    <th className="p-3">Target Bucket</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Upload Timestamp</th>
                    <th className="p-3 text-right">Signed URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {s3Files.map((file, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-600" /> {file.name}
                      </td>
                      <td className="p-3 font-mono text-stone-600">{file.bucket}</td>
                      <td className="p-3 text-stone-600">{file.size}</td>
                      <td className="p-3 text-stone-500">{file.uploaded}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => alert(`Generated secure pre-signed GET URL for ${file.name} (Valid 15m)`)} className="text-indigo-600 hover:text-indigo-800 font-bold">
                          Get Signed URL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. MESSAGE QUEUE MODULE */}
        {activeModule === 'mq' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CloudLightning className="w-4 h-4 text-amber-600" />
                  5. Asynchronous Message Queue & Background Workers (Kafka / RabbitMQ)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Offloads heavy tasks (AI report generation, bulk SMS notifications, PDF compilation) to background workers.
                </p>
              </div>
              <button
                onClick={triggerNewJob}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" /> Dispatch Background Job
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-stone-600 uppercase">Active Worker Threads</span>
                <span className="text-3xl font-black text-stone-900 mt-1 block">{workerCount} Workers</span>
                <span className="text-xs text-stone-500 mt-1 block">Zero queue lag detected</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 uppercase">Processed Today</span>
                <span className="text-3xl font-black text-emerald-950 mt-1 block">4,812 Jobs</span>
                <span className="text-xs text-emerald-700 mt-1 block">99.98% success rate</span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-indigo-900 uppercase">Avg Processing Time</span>
                <span className="text-3xl font-black text-indigo-950 mt-1 block">64 ms</span>
                <span className="text-xs text-indigo-700 mt-1 block">Optimized async batch workers</span>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 font-semibold text-stone-600">
                  <tr>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Task Type</th>
                    <th className="p-3">Queue Topic</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Execution Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {mqJobs.map((job, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-indigo-700">{job.id}</td>
                      <td className="p-3 text-stone-900 font-sans">{job.type}</td>
                      <td className="p-3 text-stone-600">{job.queue}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          job.status === 'Processing' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-stone-800">{job.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. EDGE CDN MODULE */}
        {activeModule === 'cdn' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  6. Global Edge CDN & PoP Latency Accelerator (CloudFront / Cloudflare)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Caches static medical portal assets at regional edge points of presence across the globe.
                </p>
              </div>
              <button
                onClick={() => setCdnEnabled(!cdnEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  cdnEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                Global CDN: {cdnEnabled ? 'ENABLED' : 'BYPASSED'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {cdnRegions.map((reg, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedRegion(reg.name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedRegion === reg.name ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold block ${selectedRegion === reg.name ? 'text-emerald-200' : 'text-stone-500'}`}>{reg.pop}</span>
                  <span className="text-xs font-bold block mt-1">{reg.name}</span>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
                    <span>Ping: {reg.ping}</span>
                    <span className="font-bold">Hit: {reg.hitRate}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-stone-800">Edge Cache-Control HTTP Headers</span>
              <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=3600<br/>
                X-Edge-PoP: NBO-01 (Nairobi, Kenya)<br/>
                X-Cache-Status: HIT (Edge TTL remaining: 22h 41m)
              </pre>
            </div>
          </div>
        )}

        {/* 7. CONNECTION POOLING MODULE */}
        {activeModule === 'pool' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  7. Database Connection Pooling (PgBouncer / Firestore Multiplexing)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Reuses open database socket connections to prevent thread starvation during peak hospital hours.
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-full">
                Max Pool Limit: {poolMax}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 uppercase">Active Connections</span>
                <span className="text-3xl font-black text-emerald-950 mt-1 block">{poolActive}</span>
                <span className="text-xs text-emerald-700 mt-1 block">Serving active client queries</span>
              </div>
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-stone-600 uppercase">Idle Connections (Pooled)</span>
                <span className="text-3xl font-black text-stone-900 mt-1 block">{poolIdle}</span>
                <span className="text-xs text-stone-500 mt-1 block">Ready for instant reuse</span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-indigo-900 uppercase">Queue Starvation Time</span>
                <span className="text-3xl font-black text-indigo-950 mt-1 block">0.0 ms</span>
                <span className="text-xs text-indigo-700 mt-1 block">Zero waiting threads</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. AUTO-SCALING MODULE */}
        {activeModule === 'autoscaling' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  8. Auto-Scaling Policy Engine (Kubernetes HPA / Cloud Run)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automatically provisions container replicas when CPU utilization exceeds 75%.
                </p>
              </div>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-full">
                Scaling Range: Min 2, Max 10 Replicas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-stone-700 uppercase">Simulate Cluster CPU Load</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={cpuUsage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCpuUsage(val);
                      if (val > 75) setDesiredReplicas(6);
                      else if (val > 50) setDesiredReplicas(4);
                      else setDesiredReplicas(2);
                    }}
                    className="w-full accent-purple-600"
                  />
                  <span className="font-mono font-bold text-stone-900 text-sm whitespace-nowrap">{cpuUsage}% CPU</span>
                </div>
              </div>

              <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-900 uppercase">Active Compute Replicas</span>
                  <span className="text-3xl font-black text-purple-950 mt-1 block">{desiredReplicas} Pods Running</span>
                  <span className="text-xs text-purple-700 mt-1 block">Target CPU Threshold: 75%</span>
                </div>
                <div className="bg-purple-600 text-white p-3 rounded-xl">
                  <Cpu className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. OBSERVABILITY MODULE */}
        {activeModule === 'observability' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  9. Real-Time Observability & Distributed Tracing (Prometheus + Grafana)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Monitors latency percentiles (p50, p95, p99) and captures distributed traces across microservices.
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                Scrapes: {prometheusScrapes.toLocaleString()} metrics/min
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-stone-600 uppercase">P50 Median Latency</span>
                <span className="text-3xl font-black text-stone-900 mt-1 block">12.4 ms</span>
              </div>
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-stone-600 uppercase">P95 Latency Percentile</span>
                <span className="text-3xl font-black text-stone-900 mt-1 block">48.2 ms</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 uppercase">P99 Tail Latency</span>
                <span className="text-3xl font-black text-emerald-950 mt-1 block">94.0 ms</span>
              </div>
            </div>
          </div>
        )}

        {/* 10. DISASTER RECOVERY MODULE */}
        {activeModule === 'dr' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  10. Disaster Recovery & Active-Passive Multi-Region Replication
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Maintains continuous cross-region standby replicas for instant zero-data-loss failover.
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                Status: {drStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl space-y-1">
                <span className="text-xs font-bold text-emerald-900 uppercase">Cross-Region Replication Lag</span>
                <span className="text-3xl font-black text-emerald-950">{replicationLag} ms</span>
                <p className="text-xs text-emerald-700">Primary: Frankfurt (EU) → Standby: Nairobi (Africa Central)</p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-stone-700 uppercase">Point-in-Time Recovery (PITR)</span>
                <button
                  onClick={() => alert('PITR Snapshot Restored Successfully: All records intact up to current second.')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Restore Snapshot from 5 Mins Ago
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
