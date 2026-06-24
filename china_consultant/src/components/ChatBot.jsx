import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHATBOT_RESPONSES, COMPANY, FAQS } from '../data/siteData';
import { scrollToElement } from '../utils/scroll';

const STORAGE_KEY = 'cvs-chatbot-state';

const QUICK_ACTIONS = [
  { icon: 'CN', label: 'China Tourist Visa', query: 'What are the requirements for a China tourist visa?' },
  { icon: 'JP', label: 'Japan Application', query: 'How to apply for Japan visa?' },
  { icon: 'KR', label: 'Korea Process', query: 'South Korea visa requirements and process' },
  { icon: 'DOC', label: 'Document Checklist', query: 'What documents do I need for visa processing?' },
  { icon: 'NPR', label: 'Visa Fees', query: 'What are the visa processing fees?' },
  { icon: 'TIME', label: 'Processing Time', query: 'How long does visa processing take?' },
];

const FOLLOW_UPS = {
  documents: ['Passport validity rules', 'Photo requirements', 'Travel insurance', 'Financial proof'],
  process: ['Book consultation', 'How long does it take?', 'Can you review my documents?', 'Express processing'],
  contact: ['Office hours', 'WhatsApp support', 'Kathmandu office location', 'Call your office'],
};

const ACTION_MAP = {
  appointment: { label: 'Book Appointment', target: '#appointment' },
  contact: { label: 'Contact Office', target: '#contact' },
  services: { label: 'View Services', target: '#services' },
  countries: { label: 'Explore Countries', target: '#countries' },
};

const createMessage = (text, sender, extra = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  text,
  sender,
  time: new Date(),
  ...extra,
});

const defaultMessages = () => ([
  createMessage(
    `Welcome to ${COMPANY.shortName}. I can guide you on visa requirements, documents, pricing, processing time, appointments, and next steps for China, Japan, and South Korea.`,
    'bot',
    {
      suggestions: ['China tourist visa', 'Document checklist', 'Book consultation'],
      highlights: [
        { label: 'Countries', value: 'China, Japan, South Korea' },
        { label: 'Support', value: 'Documents, appointments, follow-up' },
      ],
      checklist: ['Ask your visa type', 'Review required documents', 'Book a consultation'],
      actions: ['appointment', 'contact'],
    }
  ),
]);

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

function detectIntent(input) {
  const lower = normalizeText(input);
  if (/(document|require|checklist|paper|passport|photo|insurance|bank)/.test(lower)) return 'documents';
  if (/(time|processing|how long|days|urgent|express|appointment|book|schedule|consult|track|status)/.test(lower)) return 'process';
  if (/(office|contact|phone|email|whatsapp|location|address|call)/.test(lower)) return 'contact';
  return 'documents';
}

function detectCountry(input) {
  const lower = normalizeText(input);
  if (lower.includes('china')) return 'China';
  if (lower.includes('japan')) return 'Japan';
  if (lower.includes('korea')) return 'South Korea';
  return 'General';
}

function detectVisaType(input) {
  const lower = normalizeText(input);
  if (lower.includes('tourist')) return 'Tourist';
  if (lower.includes('business')) return 'Business';
  if (lower.includes('student')) return 'Student';
  if (lower.includes('family')) return 'Family';
  if (lower.includes('transit')) return 'Transit';
  return 'General';
}

function findFaqAnswer(input) {
  const tokens = normalizeText(input).split(/\s+/).filter(Boolean);
  let best = null;
  let bestScore = 0;

  FAQS.forEach((faq) => {
    const haystack = normalizeText(`${faq.question} ${faq.answer}`);
    const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  });

  return bestScore >= 2 ? best : null;
}

function buildHighlights(country, visaType, intent) {
  return [
    { label: 'Country', value: country },
    { label: 'Visa Type', value: visaType },
    { label: 'Focus', value: intent === 'contact' ? 'Contact & support' : intent === 'process' ? 'Process & timing' : 'Documents & eligibility' },
  ];
}

function buildChecklist(country, visaType, intent) {
  if (intent === 'contact') {
    return ['Save office contact details', 'Choose visit or WhatsApp follow-up', 'Keep passport number ready'];
  }
  if (intent === 'process') {
    return ['Choose visa category', 'Prepare documents', 'Book consultation or office visit'];
  }
  if (country === 'China' && visaType === 'Tourist') {
    return ['Valid passport', 'Recent passport photos', 'Flight and hotel proof', 'Bank statement or balance certificate'];
  }
  if (visaType === 'Student') {
    return ['Admission letter', 'Academic documents', 'Financial proof', 'Passport validity check'];
  }
  return ['Passport validity check', 'Photo requirements', 'Supporting documents', 'Office review before submission'];
}

function buildReply(input) {
  const lowerInput = normalizeText(input);
  const intent = detectIntent(input);
  const country = detectCountry(input);
  const visaType = detectVisaType(input);
  const faqMatch = findFaqAnswer(input);

  let text = CHATBOT_RESPONSES.default;
  let suggestions = FOLLOW_UPS[intent];
  let actions = intent === 'contact' ? ['contact'] : ['appointment', 'services'];

  if (faqMatch) {
    text = faqMatch.answer;
  } else if (lowerInput.includes('china')) {
    text = CHATBOT_RESPONSES.keywords.china;
    suggestions = ['Tourist visa requirements', 'China business visa', 'China processing time', 'China document checklist'];
    actions = ['appointment', 'countries'];
  } else if (lowerInput.includes('japan')) {
    text = CHATBOT_RESPONSES.keywords.japan;
    suggestions = ['Japan tourist visa', 'Japan student visa', 'Required documents', 'Processing timeline'];
    actions = ['appointment', 'countries'];
  } else if (lowerInput.includes('korea') || lowerInput.includes('korean')) {
    text = CHATBOT_RESPONSES.keywords.korea;
    suggestions = ['Korea tourist visa', 'Working holiday visa', 'Processing timeline', 'Required documents'];
    actions = ['appointment', 'countries'];
  } else if (lowerInput.includes('tourist') || lowerInput.includes('tourism')) {
    text = CHATBOT_RESPONSES.keywords.tourist;
    suggestions = ['Passport validity rules', 'Hotel and flight proof', 'Travel insurance', 'Book consultation'];
  } else if (lowerInput.includes('business')) {
    text = CHATBOT_RESPONSES.keywords.business;
    suggestions = ['Invitation letter help', 'Company documents', 'Business visa timeline', 'Office review'];
  } else if (lowerInput.includes('student') || lowerInput.includes('study')) {
    text = CHATBOT_RESPONSES.keywords.student;
    suggestions = ['Admission letter', 'Financial proof', 'Student visa steps', 'Document review'];
  } else if (lowerInput.includes('document') || lowerInput.includes('require')) {
    text = CHATBOT_RESPONSES.keywords.document;
  } else if (lowerInput.includes('cost') || lowerInput.includes('fee') || lowerInput.includes('price')) {
    text = CHATBOT_RESPONSES.keywords.cost;
    suggestions = ['Standard vs express', 'China visa cost', 'Exact quotation', 'Book consultation'];
  } else if (lowerInput.includes('time') || lowerInput.includes('long') || lowerInput.includes('processing')) {
    text = CHATBOT_RESPONSES.keywords.time;
  } else if (lowerInput.includes('office') || lowerInput.includes('location') || lowerInput.includes('address') || lowerInput.includes('call')) {
    text = CHATBOT_RESPONSES.keywords.office;
    actions = ['contact'];
  } else if (lowerInput.includes('track') || lowerInput.includes('status')) {
    text = CHATBOT_RESPONSES.keywords.track;
    suggestions = ['Customer dashboard help', 'Application updates', 'Invoice status'];
  } else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    text = CHATBOT_RESPONSES.keywords.hello;
    suggestions = ['China visa help', 'Book consultation', 'Required documents'];
  } else if (lowerInput.includes('thank')) {
    text = CHATBOT_RESPONSES.keywords.thanks;
    actions = ['appointment', 'contact'];
  } else if (lowerInput.includes('help') || lowerInput.includes('support')) {
    text = CHATBOT_RESPONSES.keywords.help;
    suggestions = ['China visa', 'Japan visa', 'South Korea visa', 'Book consultation'];
  } else if (lowerInput.includes('appointment') || lowerInput.includes('schedule') || lowerInput.includes('book')) {
    text = `You can book an appointment from the website calendar. Choose your date and time, submit your details, and our team will confirm your consultation. You can also call ${COMPANY.phone} during office hours for urgent scheduling support.`;
    suggestions = FOLLOW_UPS.process;
    actions = ['appointment', 'contact'];
  }

  return {
    text,
    suggestions,
    highlights: buildHighlights(country, visaType, intent),
    checklist: buildChecklist(country, visaType, intent),
    actions,
    intent,
  };
}

export default function ChatBot() {
  const initialState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { open: false, messages: defaultMessages() };
    }

    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.messages?.length) {
        return {
          open: Boolean(saved.open),
          messages: saved.messages.map((message) => ({ ...message, time: new Date(message.time) })),
        };
      }
    } catch {
      return { open: false, messages: defaultMessages() };
    }

    return { open: false, messages: defaultMessages() };
  }, []);

  const [open, setOpen] = useState(initialState.open);
  const [messages, setMessages] = useState(initialState.messages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(messages.length <= 1);
  const [assistantMode, setAssistantMode] = useState('Smart guidance');
  const [activeTopic, setActiveTopic] = useState('Popular');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, messages }));
  }, [open, messages]);

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const performAction = (actionKey) => {
    const action = ACTION_MAP[actionKey];
    if (!action) return;

    const target = document.querySelector(action.target);
    if (target) {
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight ?? 72;
      scrollToElement(target, { duration: 280, offset: navbarHeight });
      setOpen(false);
    } else {
      setInput(action.label);
      inputRef.current?.focus();
    }
  };

  const pushBotReply = (reply) => {
    setMessages((prev) => [
      ...prev,
      createMessage(reply.text, 'bot', {
        suggestions: reply.suggestions,
        highlights: reply.highlights,
        checklist: reply.checklist,
        actions: reply.actions,
      }),
    ]);
  };

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setShowQuickActions(false);
    const reply = buildReply(trimmed);
    setAssistantMode(
      reply.intent === 'contact'
        ? 'Contact concierge'
        : reply.intent === 'process'
          ? 'Process navigator'
          : 'Document strategist'
    );

    setMessages((prev) => [...prev, createMessage(trimmed, 'user')]);
    setInput('');
    setTyping(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      pushBotReply(reply);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleReset = () => {
    setMessages(defaultMessages());
    setShowQuickActions(true);
    setAssistantMode('Smart guidance');
    setActiveTopic('Popular');
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const topicPills = [
    { label: 'Popular', prompt: 'What are your most requested visa services?' },
    { label: 'Documents', prompt: 'What documents do I need?' },
    { label: 'Fees', prompt: 'Tell me about your visa fees.' },
    { label: 'Contact', prompt: 'How can I contact your office quickly?' },
  ];

  return (
    <>
      <div className="floating-contact floating-contact--chatbot">
        <span className="floating-contact__label">Visa Assistant</span>
        <motion.button
          className="chatbot-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Close chat' : 'Open China Visa Assistant'}
          title="China Visa Assistant"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                X
              </motion.span>
            ) : (
              <motion.span
                key="chat"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                AI
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chatbot-window"
            role="dialog"
            aria-label="China Visa Assistant Chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="chatbot-header">
              <div className="chatbot-header__avatar">
                <span>CV</span>
              </div>
              <div className="chatbot-header__info">
                <h4>China Visa Assistant</h4>
                <p className="chatbot-header__mode">{assistantMode}</p>
                <span className="chatbot-header__status">
                  <span className="chatbot-header__status-dot"></span>
                  Live guidance | Saved session
                </span>
              </div>
              <button
                className="chatbot-header__reset"
                onClick={handleReset}
                aria-label="Reset chat"
                title="Reset chat"
              >
                Reset
              </button>
              <button
                className="chatbot-header__close"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                X
              </button>
            </div>

            <div className="chatbot-summary">
              <div className="chatbot-summary__item">
                <strong>Coverage</strong>
                <span>China, Japan, South Korea visas</span>
              </div>
              <div className="chatbot-summary__item">
                <strong>Best For</strong>
                <span>Documents, fees, appointments, next steps</span>
              </div>
            </div>

            <div className="chatbot-topic-bar">
              {topicPills.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  className={`chatbot-topic-pill ${activeTopic === topic.label ? 'chatbot-topic-pill--active' : ''}`}
                  onClick={() => {
                    setActiveTopic(topic.label);
                    handleSend(topic.prompt);
                  }}
                >
                  {topic.label}
                </button>
              ))}
            </div>

            <div className="chatbot-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  className={`chat-message chat-message--${msg.sender}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <div className="chat-message__text">{msg.text}</div>

                  {msg.highlights?.length > 0 && (
                    <div className="chat-message__highlights">
                      {msg.highlights.map((highlight) => (
                        <div key={`${msg.id}-${highlight.label}`} className="chatbot-insight">
                          <span>{highlight.label}</span>
                          <strong>{highlight.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.checklist?.length > 0 && (
                    <div className="chatbot-checklist">
                      {msg.checklist.map((item) => (
                        <div key={`${msg.id}-${item}`} className="chatbot-checklist__item">
                          <span className="chatbot-checklist__dot"></span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.actions?.length > 0 && (
                    <div className="chatbot-action-row">
                      {msg.actions.map((actionKey) => (
                        <button
                          key={`${msg.id}-${actionKey}`}
                          type="button"
                          className="chatbot-action-btn"
                          onClick={() => performAction(actionKey)}
                        >
                          {ACTION_MAP[actionKey]?.label || actionKey}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.suggestions?.length > 0 && (
                    <div className="chat-message__suggestions">
                      {msg.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="chatbot-chip"
                          onClick={() => handleSend(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="chat-message__time">{formatTime(msg.time)}</div>
                </motion.div>
              ))}

              {typing && (
                <motion.div className="chat-typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span></span>
                  <span></span>
                  <span></span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <AnimatePresence>
              {showQuickActions && messages.length <= 1 && (
                <motion.div
                  className="chatbot-quick-actions"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="chatbot-quick-actions__title">Start With One Of These</p>
                  <div className="chatbot-quick-actions__grid">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        className="chatbot-quick-btn chatbot-quick-btn--rich"
                        onClick={() => handleSend(action.query)}
                      >
                        <span className="chatbot-quick-btn__icon">{action.icon}</span>
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="chatbot-input">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about visa type, documents, fees, tracking, or appointment..."
                aria-label="Type your message"
                disabled={typing}
              />
              <button
                onClick={() => handleSend(input)}
                aria-label="Send message"
                disabled={typing || !input.trim()}
                className={input.trim() ? 'chatbot-send--active' : ''}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                </svg>
              </button>
            </div>

            <div className="chatbot-footer">
              Smart guidance for presentation use. For exact case approval, our office team should verify the final documents.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
