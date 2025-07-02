import React, { useState, useRef, useEffect } from 'react';
import HelpdeskService from '../../service/HelpdeskService';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot, FaPaperclip } from 'react-icons/fa';

const HelpdeskPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateMessage, setEscalateMessage] = useState('');
  const [escalateSubmitted, setEscalateSubmitted] = useState(false);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('helpdeskMessages');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save to localStorage on every message change
  useEffect(() => {
    localStorage.setItem('helpdeskMessages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      // File upload placeholder
      if (file) {
        setError('File/image upload coming soon!');
        setFile(null);
        setIsLoading(false);
        return;
      }

      const response = await HelpdeskService.askQuestion(inputMessage);

      const aiMessage = {
        id: response.id,
        content: response.aiResponse,
        sender: 'ai',
        timestamp: response.timestamp || new Date().toISOString(),
        queryId: response.id,
        escalated: response.escalated
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        id: Date.now(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async (queryId) => {
    try {
      await HelpdeskService.escalateToHumanSupport(queryId);

      const escalationMessage = {
        id: Date.now(),
        content: 'Your query has been escalated to human support. You will receive a response via email shortly.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isEscalated: true
      };

      setMessages(prev => [...prev, escalationMessage]);
    } catch (err) {
      setError('Failed to escalate query. Please try again.');
    }
  };

  // Multi-line input: Shift+Enter for new line, Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Inline styles (same as before, can be customized)
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8f9fa'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem',
      textAlign: 'center',
      borderRadius: '0 0 20px 20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    headerTitle: {
      margin: '0 0 0.5rem 0',
      fontSize: '2rem',
      fontWeight: '600'
    },
    headerSubtitle: {
      margin: 0,
      opacity: 0.9,
      fontSize: '1rem'
    },
    messages: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    welcomeMessage: {
      marginBottom: '1rem'
    },
    message: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '80%',
      animation: 'fadeIn 0.3s ease-in'
    },
    userMessage: {
      alignSelf: 'flex-end'
    },
    aiMessage: {
      alignSelf: 'flex-start'
    },
    messageContent: {
      background: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '18px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    },
    userMessageContent: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '18px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    },
    messageList: {
      margin: '0.5rem 0',
      paddingLeft: '1.5rem'
    },
    messageListItem: {
      margin: '0.25rem 0'
    },
    messageTime: {
      fontSize: '0.75rem',
      color: '#666',
      marginTop: '0.25rem',
      textAlign: 'right'
    },
    userMessageTime: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: '0.25rem',
      textAlign: 'right'
    },
    errorMessage: {
      color: '#dc3545',
      fontWeight: '500'
    },
    escalateButton: {
      background: '#28a745',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.875rem',
      cursor: 'pointer',
      marginTop: '0.75rem',
      transition: 'all 0.2s ease'
    },
    escalateButtonHover: {
      background: '#218838',
      transform: 'translateY(-1px)'
    },
    escalatedNotice: {
      background: '#d4edda',
      color: '#155724',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      marginTop: '0.75rem',
      border: '1px solid #c3e6cb'
    },
    typingIndicator: {
      display: 'flex',
      gap: '0.25rem',
      padding: '0.5rem'
    },
    typingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ccc',
      animation: 'typing 1.4s infinite ease-in-out'
    },
    typingDot1: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ccc',
      animation: 'typing 1.4s infinite ease-in-out',
      animationDelay: '-0.32s'
    },
    typingDot2: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#ccc',
      animation: 'typing 1.4s infinite ease-in-out',
      animationDelay: '-0.16s'
    },
    errorBanner: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      border: '1px solid #f5c6cb',
      textAlign: 'center'
    },
    input: {
      background: 'white',
      padding: '1.5rem',
      borderTop: '1px solid #e9ecef',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
    },
    inputContainer: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-end'
    },
    textarea: {
      flex: 1,
      border: '2px solid #e9ecef',
      borderRadius: '25px',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      resize: 'none',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      fontFamily: 'inherit',
      lineHeight: 1.5
    },
    textareaFocus: {
      borderColor: '#667eea'
    },
    textareaDisabled: {
      background: '#f8f9fa',
      cursor: 'not-allowed'
    },
    sendButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '25px',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '80px'
    },
    sendButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
    },
    sendButtonDisabled: {
      background: '#ccc',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    },
    fileInput: {
      display: 'none'
    },
    fileButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#667eea',
      fontSize: '1.5rem',
      marginRight: '0.5rem'
    }
  };

  const QUICK_REPLIES = [
    { label: "Court/Reservation", value: "court_reservation" },
    { label: "Payment", value: "payment" },
    { label: "Feedback", value: "feedback" },
    { label: "Event", value: "event" },
    { label: "Profile", value: "profile" },
    { label: "Membership", value: "membership" }
  ];

  const FEEDBACK_QUESTIONS = [
    "How was your experience?",
    "Would you recommend us?",
    "Any suggestions for improvement?"
  ];

  const TOPIC_QUESTIONS = {
    court_reservation: [
      "How do I book a pickleball court?",
      "What is the booking cancellation policy?",
      "Can I book multiple courts at once?",
      "What are the court operating hours?",
      "What are the court prices (peak/off-peak)?",
      "How do I check court availability?",
      "How do I cancel or change my reservation?",
      "What happens if I miss my reservation?"
    ],
    payment: [
      "What payment methods are accepted?",
      "How do I add money to my wallet?",
      "Can I get a refund?",
      "How do I pay for my booking?",
      "What if my payment fails?"
    ],
    feedback: [
      "How can I leave feedback?",
      "Where can I see my previous feedback?",
      "How is my feedback used?"
    ],
    event: [
      "How do I register for an event?",
      "Can I cancel my event registration?",
      "Where can I see upcoming events?",
      "How do I create a new event?",
      "What are the event rules and requirements?"
    ],
    profile: [
      "How do I edit my profile?",
      "How do I change my user type?",
      "How do I update my email or password?",
      "How do I upload a profile picture?",
      "How do I manage my notification preferences?"
    ],
    membership: [
      "How do I become a member?",
      "What are the benefits of membership?",
      "How do I upgrade my membership?",
      "What are the membership tier levels?"
    ]
  };

  const PREDEFINED_ANSWERS = {
    // Court/Reservation
    "How do I book a pickleball court?": "To book a pickleball court, go to the Booking page, select your preferred date and time, and confirm your reservation.",
    "What is the booking cancellation policy?": "You can cancel your booking up to 24 hours before the scheduled time for a full refund.",
    "Can I book multiple courts at once?": "Yes, you can select multiple courts during the booking process, subject to availability.",
    "What are the court operating hours?": "Court operating hours are typically from 8:00 AM to 10:00 PM. Please check the court details for specific timings.",
    "What are the court prices (peak/off-peak)?": "Peak hours are usually 4:00 PM - 8:00 PM at RM80/hr, off-peak is RM50/hr. See court details for exact pricing.",
    "How do I check court availability?": "You can check court availability on the Court List or Booking page. Available dates and time slots are shown in the booking calendar.",
    "How do I cancel or change my reservation?": "To cancel or change your reservation, go to your Booking History and select the booking you wish to modify.",
    "What happens if I miss my reservation?": "If you miss your reservation, the slot will be released and may be subject to a no-show fee as per our policy.",
    // Payment
    "What payment methods are accepted?": "We accept credit/debit cards, PayPal, and wallet payments.",
    "How do I add money to my wallet?": "Go to the Wallet section in your profile and click 'Add Funds' to top up using your preferred payment method.",
    "Can I get a refund?": "Refunds are processed according to our cancellation policy. Please contact support for assistance.",
    "How do I pay for my booking?": "You can pay for your booking during the checkout process using your wallet or a supported payment method.",
    "What if my payment fails?": "If your payment fails, please check your payment details and try again. If the issue persists, contact support.",
    // Feedback
    "How can I leave feedback?": "After your session, you can leave feedback from your booking history or the feedback section in your profile.",
    "Where can I see my previous feedback?": "All your submitted feedback is visible in the Feedback section of your profile.",
    "How is my feedback used?": "Your feedback helps us improve our services and facilities. We review all feedback regularly.",
    // Event
    "How do I register for an event?": "To register for an event, go to the Events page, select the event you are interested in, and click 'Register'.",
    "Can I cancel my event registration?": "Yes, you can cancel your event registration from your event history or the event details page.",
    "Where can I see upcoming events?": "Upcoming events are listed on the Events page. You can view details and register from there.",
    "How do I create a new event?": "If you are an admin or organizer, go to the Events page and click 'Create Event'. Fill in the event details and submit.",
    "What are the event rules and requirements?": "Event rules and requirements are listed in each event's details. Please review them before registering.",
    // Profile
    "How do I edit my profile?": "Go to your Profile page and click the 'Edit Profile' button. Update your information and save your changes.",
    "How do I change my user type?": "If you are eligible, you can request a user type change from your Profile page or contact support for assistance.",
    "How do I update my email or password?": "Go to your Profile or Account Settings page. There you can update your email and change your password.",
    "How do I upload a profile picture?": "On your Profile page, click your avatar or the 'Upload Picture' button to select and upload a new profile photo.",
    "How do I manage my notification preferences?": "Go to Notification Preferences in your Profile or Settings to enable or disable different types of notifications.",
    // Membership
    "How do I become a member?": "Once you successfully register an account, you automatically become a member. Your initial membership tier is Silver.",
    "What are the benefits of membership?": "You can view the specific benefits for each membership tier (Silver, Gold, Platinum) on the Membership page. Each tier offers different discounts, privileges, and rewards. Please visit the Membership section for full details.",
    "How do I upgrade my membership?": "Each membership tier has a maximum point threshold. When you reach the required points for the next tier, your membership will be automatically upgraded. You can track your points and tier status on the Membership page.",
    "What are the membership tier levels?": "Our membership tiers are: Silver (default for new members), Gold, and Platinum. Each tier offers increasing benefits and rewards. You can view and upgrade your tier from your Profile or Membership page."
  };

  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showFeedbackQuestions, setShowFeedbackQuestions] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(null);

  const handleQuickReply = (value) => {
    setShowQuickReplies(false);
    setPendingQuestions({ topic: value, questions: TOPIC_QUESTIONS[value] });
    setCurrentTopic(value);
    setMessages(prev => [
      ...prev.filter(m => m.type !== 'topic_questions'),
      {
        id: Date.now() + Math.random(),
        sender: 'ai',
        type: 'topic_questions',
        topic: value,
        options: TOPIC_QUESTIONS[value],
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleTopicQuestion = (question) => {
    // Always use currentTopic for topic/options
    const topic = currentTopic;
    const options = TOPIC_QUESTIONS[topic] || [];
    setPendingQuestions(null);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: 'user',
        content: question,
        timestamp: new Date().toISOString()
      }
    ]);
    if (PREDEFINED_ANSWERS[question]) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          sender: 'ai',
          content: PREDEFINED_ANSWERS[question],
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now() + Math.random(),
          sender: 'ai',
          type: 'topic_questions',
          topic: topic,
          options: options,
          timestamp: new Date().toISOString()
        }
      ]);
    } else {
      handleSendMessage(question);
    }
  };

  const handleFeedbackQuestion = (question) => {
    setShowFeedbackQuestions(false);
    handleSendMessage(question);
  };

  const handleEscalateSubmit = async () => {
    try {
      await HelpdeskService.escalateForm({
        message: escalateMessage,
        topic: currentTopic
      });
      setEscalateSubmitted(true);
      setEscalateMessage('');
      // Show escalation confirmation as an AI message in the chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          sender: 'ai',
          content: 'Your query has been escalated to human support. You will receive a response via email shortly.',
          timestamp: new Date().toISOString(),
          isEscalated: true
        }
      ]);
    } catch (err) {
      setEscalateSubmitted(false);
      alert('Failed to submit. Please try again.');
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          content: "Hi there, how can I help you today?",
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'quick_replies',
          options: QUICK_REPLIES,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Helpdesk Support</h1>
        <p style={styles.headerSubtitle}>Ask me anything about bookings, memberships, payments, or general inquiries!</p>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <div style={{ ...styles.message, ...styles.aiMessage }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <FaRobot size={28} style={{ marginRight: 8 }} />
              </div>
              <div style={styles.messageContent}>
                <p>👋 Hello! I'm your AI assistant. I can help you with:</p>
                <ul style={styles.messageList}>
                  <li style={styles.messageListItem}>📅 Court bookings and reservations</li>
                  <li style={styles.messageListItem}>💳 Membership information and benefits</li>
                  <li style={styles.messageListItem}>💳 Payment methods and wallet management</li>
                  <li style={styles.messageListItem}>📝 General questions about our services</li>
                </ul>
                <p>Just type your question below and I'll do my best to help!</p>
              </div>
              <div style={styles.messageTime}>
                {formatTime(new Date())}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} style={{
            ...styles.message,
            ...(message.sender === 'user' ? styles.userMessage : styles.aiMessage)
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {message.sender === 'ai'
                ? <FaRobot size={28} style={{ marginRight: 8 }} />
                : <FaUser size={28} style={{ marginRight: 8 }} />}
              <div style={message.sender === 'user' ? styles.userMessageContent : styles.messageContent}>
                {message.isError ? (
                  <div style={styles.errorMessage}>
                    <span>⚠️ {message.content}</span>
                  </div>
                ) : (
                  message.sender === 'ai'
                    ? <ReactMarkdown>{message.content}</ReactMarkdown>
                    : <span>{message.content}</span>
                )}

                {message.sender === 'ai' && message.queryId && !message.escalated && !message.isEscalated && (
                  <button
                    style={styles.escalateButton}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#218838';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#28a745';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    onClick={() => handleEscalate(message.queryId)}
                  >
                    Escalate to Human Support
                  </button>
                )}

                {message.isEscalated && (
                  <div style={styles.escalatedNotice}>
                    ✅ Query escalated to human support
                  </div>
                )}

                {message.type === 'quick_replies' && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {message.options.map(btn => (
                      <button
                        key={btn.value}
                        onClick={() => handleQuickReply(btn.value)}
                        style={{
                          background: '#e9ecef',
                          color: '#343a40',
                          border: '1px solid #ced4da',
                          borderRadius: '15px',
                          padding: '0.3rem 0.8rem',
                          margin: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dee2e6';
                          e.target.style.borderColor = '#ced4da';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#e9ecef';
                          e.target.style.borderColor = '#ced4da';
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}

                {message.type === 'topic_questions' && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {message.options.map(q => (
                      <button
                        key={q}
                        onClick={() => handleTopicQuestion(q)}
                        style={{
                          background: '#e9ecef',
                          color: '#343a40',
                          border: '1px solid #ced4da',
                          borderRadius: '15px',
                          padding: '0.3rem 0.8rem',
                          margin: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dee2e6';
                          e.target.style.borderColor = '#ced4da';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#e9ecef';
                          e.target.style.borderColor = '#ced4da';
                        }}
                      >
                        {q}
                      </button>
                    ))}
                    {/* Back button */}
                    <button
                      onClick={() => {
                        setPendingQuestions(null);
                        setCurrentTopic(null);
                        setShowQuickReplies(true);
                        setShowEscalateForm(false);
                        setEscalateSubmitted(false);
                        setMessages(prev => [
                          ...prev.filter(m => m.type !== 'topic_questions'),
                          {
                            id: Date.now() + Math.random(),
                            sender: 'ai',
                            type: 'quick_replies',
                            options: QUICK_REPLIES,
                            timestamp: new Date().toISOString()
                          }
                        ]);
                      }}
                      style={{
                        background: '#fff',
                        color: '#667eea',
                        border: '1px solid #667eea',
                        borderRadius: '15px',
                        padding: '0.3rem 0.8rem',
                        margin: '0.25rem 0.5rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f0f4ff';
                        e.target.style.borderColor = '#667eea';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fff';
                        e.target.style.borderColor = '#667eea';
                      }}
                    >
                      ← Back
                    </button>
                    {/* Escalate to Human Support button and form removed */}
                    {showEscalateForm && !escalateSubmitted && (
                      <div style={{ marginTop: '1rem', background: '#f8f9fa', borderRadius: 8, padding: 12 }}>
                        <textarea
                          value={escalateMessage}
                          onChange={e => setEscalateMessage(e.target.value)}
                          placeholder="Describe your issue..."
                          rows={3}
                          style={{ width: '100%', borderRadius: 8, padding: 8, border: '1px solid #ced4da' }}
                        />
                        <button
                          onClick={handleEscalateSubmit}
                          style={{
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '15px',
                            padding: '0.3rem 1.2rem',
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                    {escalateSubmitted && (
                      <div style={{ color: 'green', marginTop: 8, fontWeight: 'bold' }}>
                        Your request has been submitted. Please wait for a response via email.
                      </div>
                    )}
                  </div>
                )}

                {message.type === 'feedback_options' && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {message.options.map(q => (
                      <button
                        key={q}
                        onClick={() => handleFeedbackQuestion(q)}
                        style={{
                          background: '#e9ecef',
                          color: '#343a40',
                          border: '1px solid #ced4da',
                          borderRadius: '15px',
                          padding: '0.3rem 0.8rem',
                          margin: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dee2e6';
                          e.target.style.borderColor = '#ced4da';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#e9ecef';
                          e.target.style.borderColor = '#ced4da';
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={message.sender === 'user' ? styles.userMessageTime : styles.messageTime}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ ...styles.message, ...styles.aiMessage }}>
            <div style={styles.messageContent}>
              <div style={styles.typingIndicator}>
                <span style={styles.typingDot1}></span>
                <span style={styles.typingDot2}></span>
                <span style={styles.typingDot}></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Only show the default input if not selecting topic questions */}
      {!pendingQuestions && (
        <div style={styles.input}>
          <div style={styles.inputContainer}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              disabled={isLoading}
              rows="1"
              style={{
                ...styles.textarea,
                ...(isLoading ? styles.textareaDisabled : {}),
                ...(inputMessage.trim() ? styles.textareaFocus : {})
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                if (!inputMessage.trim()) {
                  e.target.style.borderColor = '#e9ecef';
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                ...styles.sendButton,
                ...(isLoading || !inputMessage.trim() ? styles.sendButtonDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (!isLoading && inputMessage.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && inputMessage.trim()) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Show the topic question input only when pendingQuestions is set */}
      {pendingQuestions && (
        <div style={styles.input}>
          <div style={styles.inputContainer}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask a question about ${currentTopic || ''}...`}
              disabled={isLoading}
              rows="1"
              style={{
                ...styles.textarea,
                ...(isLoading ? styles.textareaDisabled : {}),
                ...(inputMessage.trim() ? styles.textareaFocus : {})
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                if (!inputMessage.trim()) {
                  e.target.style.borderColor = '#e9ecef';
                }
              }}
            />
            <button
              onClick={() => handleTopicQuestion(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                ...styles.sendButton,
                ...(isLoading || !inputMessage.trim() ? styles.sendButtonDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (!isLoading && inputMessage.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && inputMessage.trim()) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes typing {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .helpdesk-container {
              height: 100vh;
              margin: 0;
            }

            .helpdesk-header {
              padding: 1.5rem;
              border-radius: 0;
            }

            .helpdesk-header h1 {
              font-size: 1.5rem;
            }

            .helpdesk-messages {
              padding: 1rem;
            }

            .message {
              max-width: 90%;
            }

            .helpdesk-input {
              padding: 1rem;
            }

            .input-container {
              gap: 0.5rem;
            }

            .send-button {
              padding: 0.75rem 1rem;
              min-width: 60px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default HelpdeskPage; 