import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, Clock, Info, Check, Activity, Pill, HeartPulse, User, Database, ChevronRight, Sun, Moon } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function useTheme() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center border border-clinical-100 dark:border-slate-700 bg-white dark:bg-surface-dark hover:bg-clinical-50 dark:hover:bg-slate-800 transition-colors shrink-0"
    >
      <Sun className={`w-4 h-4 absolute transition-all duration-300 text-amber-500 ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`w-4 h-4 absolute transition-all duration-300 text-clinical-200 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
    </button>
  );
}

ThemeToggle.propTypes = {
  isDark: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingDraft, setEditingDraft] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/messages`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setMessages(data);
    } catch {
      console.warn("Backend not found, loading fallback mock data for UI demonstration.");
      setMessages(mockData);
    } finally {
      setLoading(false);
    }
  };

  const selectedMessage = messages.find(m => m.id === selectedMsgId);

  useEffect(() => {
    if (selectedMessage) {
      setEditingDraft(selectedMessage.ai_draft || '');
    }
  }, [selectedMessage]);

  const handleApprove = async () => {
    if (!selectedMessage) return;
    setIsApproving(true);
    try {
      const res = await fetch(`${API_BASE}/messages/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          ai_draft: editingDraft
        })
      });

      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
        setSelectedMsgId(null);
      } else {
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
        setSelectedMsgId(null);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      setSelectedMsgId(null);
    } finally {
      setIsApproving(false);
    }
  };

  const triggerSeed = async () => {
    try {
      await fetch(`${API_BASE}/messages/seed`, { method: 'POST' });
      fetchMessages();
    } catch {
      alert("Seed triggered! (Ensure backend is running)");
    }
  };

  const getUrgencyColors = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
      case 'urgent': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
      default: return 'bg-clinical-50 text-clinical-600 border-clinical-100 dark:bg-clinical-900/20 dark:text-clinical-200 dark:border-clinical-700';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'urgent': return <Clock className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const pendingMessages = messages.filter(m => m.status === 'pending');

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white dark:bg-surface-dark border-b border-clinical-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-clinical-500 p-2 rounded-lg text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-ink dark:text-ink-dark leading-tight">Inbasket Triage</h1>
            <p className="text-[11px] text-clinical-500 dark:text-clinical-200 font-semibold tracking-widest uppercase">AI Clinical Copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerSeed}
            className="flex items-center gap-2 text-sm bg-clinical-50 hover:bg-clinical-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-clinical-700 dark:text-clinical-100 px-4 py-2 rounded-md transition-colors font-medium border border-clinical-100 dark:border-slate-700"
          >
            <Database className="w-4 h-4" />
            Seed Mock Data
          </button>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      {/* Main Layout Split */}
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL: Inbox Queue */}
        <aside className="w-1/3 max-w-md bg-white dark:bg-surface-dark border-r border-clinical-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-clinical-100 dark:border-slate-800 bg-clinical-50/40 dark:bg-slate-900/40 flex justify-between items-center shrink-0">
            <h2 className="font-display font-semibold text-ink dark:text-ink-dark">Pending Review</h2>
            <span className="bg-clinical-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingMessages.length}
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading inbox&hellip;</div>
            ) : pendingMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-emerald-400" />
                <p>Inbox zero. Great job.</p>
              </div>
            ) : (
              pendingMessages.map((msg) => {
                const isCritical = msg.urgency?.toLowerCase() === 'critical';
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMsgId(msg.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3
                      ${selectedMsgId === msg.id
                        ? 'bg-clinical-50 dark:bg-clinical-900/30 border-clinical-300 dark:border-clinical-600 shadow-sm ring-1 ring-clinical-200 dark:ring-clinical-700'
                        : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 hover:border-clinical-300 dark:hover:border-clinical-600 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-display font-semibold text-ink dark:text-ink-dark flex items-center gap-2 truncate">
                        {isCritical && (
                          <span className="relative w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulseRing" />
                        )}
                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        {msg.patient_name}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {msg.raw_text}
                    </p>

                    <div className="flex gap-2 items-center flex-wrap mt-1">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border ${getUrgencyColors(msg.urgency)}`}>
                        {getUrgencyIcon(msg.urgency)}
                        {msg.urgency}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                        {msg.category}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Details & AI Triage */}
        <section className="flex-1 bg-paper dark:bg-paper-dark flex flex-col h-full overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 flex flex-col gap-6">

              {/* Header */}
              <div className="flex flex-col gap-2 border-b border-clinical-100 dark:border-slate-800 pb-6">
                <h2 className="text-2xl font-display font-semibold text-ink dark:text-ink-dark flex items-center gap-3 flex-wrap">
                  {selectedMessage.patient_name}
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 border ${getUrgencyColors(selectedMessage.urgency)}`}>
                    {getUrgencyIcon(selectedMessage.urgency)} {selectedMessage.urgency}
                  </span>
                </h2>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Category: <span className="text-ink dark:text-ink-dark">{selectedMessage.category}</span>
                </div>
              </div>

              {/* Patient Message */}
              <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-clinical-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-bold text-clinical-500 dark:text-clinical-200 uppercase tracking-widest mb-3">Original Message</h3>
                <p className="text-ink dark:text-ink-dark whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.raw_text}
                </p>
              </div>

              {/* Extracted Entities */}
              <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-clinical-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-bold text-clinical-500 dark:text-clinical-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> AI Extracted Entities
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Symptoms */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <HeartPulse className="w-3 h-3" /> Symptoms
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                      {selectedMessage.extracted_entities?.symptoms?.length > 0 ? (
                        selectedMessage.extracted_entities.symptoms.map((s, i) => (
                          <li key={i} className="bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900 px-2 py-1 rounded text-sm">{s}</li>
                        ))
                      ) : <li className="text-slate-400 dark:text-slate-500 text-sm italic">None detected</li>}
                    </ul>
                  </div>

                  {/* Medications */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <Pill className="w-3 h-3" /> Medications
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                      {selectedMessage.extracted_entities?.medications?.length > 0 ? (
                        selectedMessage.extracted_entities.medications.map((m, i) => (
                          <li key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900 px-2 py-1 rounded text-sm">{m}</li>
                        ))
                      ) : <li className="text-slate-400 dark:text-slate-500 text-sm italic">None detected</li>}
                    </ul>
                  </div>

                  {/* Vitals */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Vitals
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                      {selectedMessage.extracted_entities?.vitals?.length > 0 ? (
                        selectedMessage.extracted_entities.vitals.map((v, i) => (
                          <li key={i} className="bg-clinical-50 text-clinical-600 border border-clinical-100 dark:bg-clinical-900/20 dark:text-clinical-200 dark:border-clinical-700 px-2 py-1 rounded text-sm">{v}</li>
                        ))
                      ) : <li className="text-slate-400 dark:text-slate-500 text-sm italic">None detected</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* AI Draft Response */}
              <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border-2 border-clinical-100 dark:border-clinical-800 shadow-sm flex flex-col flex-1">
                <h3 className="text-xs font-bold text-clinical-600 dark:text-clinical-200 uppercase tracking-widest mb-3 flex justify-between items-center">
                  <span>AI Drafted Response</span>
                  <span className="text-xs bg-clinical-50 text-clinical-500 dark:bg-clinical-900/30 dark:text-clinical-200 px-2 py-0.5 rounded border border-clinical-200 dark:border-clinical-700 lowercase font-medium">Editable</span>
                </h3>
                <textarea
                  className="w-full flex-1 min-h-[150px] p-4 bg-clinical-50/40 dark:bg-slate-900/60 border border-clinical-100 dark:border-slate-700 rounded-lg text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-clinical-400 focus:bg-white dark:focus:bg-slate-900 transition-colors resize-none leading-relaxed"
                  value={editingDraft}
                  onChange={(e) => setEditingDraft(e.target.value)}
                />

                <div className="mt-4 pt-4 border-t border-clinical-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-clinical-500 hover:bg-clinical-600 disabled:bg-clinical-200 disabled:dark:bg-slate-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2"
                  >
                    {isApproving ? 'Approving…' : 'Approve & Send'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
              <div className="bg-clinical-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                <Activity className="w-8 h-8 text-clinical-300 dark:text-clinical-500" />
              </div>
              <h3 className="text-lg font-display font-medium text-ink dark:text-ink-dark mb-2">Select a patient message</h3>
              <p className="max-w-xs text-sm">Choose a message from the queue to review AI extractions and draft responses.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

// Fallback Mock Data for UI demonstration if backend isn't running
const mockData = [
  {
    id: 1,
    patient_name: "Sarah Jenkins",
    raw_text: "I've been having intense chest tightness for the last 30 minutes, it feels heavy and my left arm is starting to ache. Should I wait for my appointment tomorrow?",
    urgency: "Critical",
    category: "Clinical",
    extracted_entities: {
      symptoms: ["chest tightness", "heavy chest", "left arm ache"],
      medications: [],
      vitals: []
    },
    ai_draft: "Sarah, this sounds like a potential medical emergency. Please do not wait for your appointment tomorrow. Call 911 immediately or go to the nearest emergency room for evaluation.\n\n[Drafted by AI Assistant - Pending Provider Review]",
    status: "pending",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 2,
    patient_name: "Michael Chen",
    raw_text: "My temperature is 102.5 and I can't keep any fluids down. The antibiotics (Amoxicillin) aren't working for my sinus infection.",
    urgency: "Urgent",
    category: "Clinical",
    extracted_entities: {
      symptoms: ["inability to keep fluids down", "sinus infection"],
      medications: ["Amoxicillin"],
      vitals: ["102.5 fever"]
    },
    ai_draft: "Hi Michael, given your high fever and inability to keep fluids down, the doctor would like to evaluate you today. Please call the front desk at 555-0123 to schedule an urgent same-day or telehealth visit so we can discuss alternative treatments.\n\n[Drafted by AI Assistant - Pending Provider Review]",
    status: "pending",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 3,
    patient_name: "Eleanor Rigby",
    raw_text: "Hi, I need a refill on my lisinopril 10mg. The pharmacy said I am out of refills.",
    urgency: "Standard",
    category: "Prescription Refill",
    extracted_entities: {
      symptoms: [],
      medications: ["Lisinopril 10mg"],
      vitals: []
    },
    ai_draft: "Hello Eleanor, we have received your request for a Lisinopril refill. The clinical team will review your chart and send the prescription to your pharmacy on file by the end of the day if approved. We will let you know if we need anything else.\n\n[Drafted by AI Assistant - Pending Provider Review]",
    status: "pending",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];
