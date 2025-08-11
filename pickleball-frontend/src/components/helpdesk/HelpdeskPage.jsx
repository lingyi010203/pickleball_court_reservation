import React, { useState, useRef, useEffect } from 'react';
import HelpdeskService from '../../service/HelpdeskService';
import ReactMarkdown from 'react-markdown';
import { FaUser, FaRobot, FaPaperclip, FaArrowLeft } from 'react-icons/fa';
import { useTheme, alpha } from '@mui/material/styles';
import { IconButton, Button, CircularProgress, Box, Typography, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const HelpdeskPage = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateMessage, setEscalateMessage] = useState('');
  const [escalateSubmitted, setEscalateSubmitted] = useState(false);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  // Handle scroll events to detect manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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

    // Clear input first for better UX
    setInputMessage('');
    
    // Force scroll to bottom when user sends a message
    setShouldAutoScroll(true);
    
    setMessages(prev => [...prev, userMessage]);
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

  // Updated UI styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.palette.background.default
    },
    header: {
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      padding: '1.5rem',
      textAlign: 'center',
      boxShadow: theme.shadows[1],
      borderBottom: '2px solid',
      borderColor: theme.palette.divider,
      opacity: 0.8,
      position: 'relative'
    },
    headerTitle: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.5rem',
      fontWeight: '700',
      color: theme.palette.primary.main
    },
    headerSubtitle: {
      margin: 0,
      opacity: 0.8,
      fontSize: '0.9rem',
      color: theme.palette.text.secondary
    },
    messages: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      background: theme.palette.background.default
    },
    welcomeMessage: {
      marginBottom: '1rem'
    },
    message: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '85%',
      animation: 'fadeIn 0.3s ease-in',
      transition: 'all 0.2s'
    },
    userMessage: {
      alignSelf: 'flex-end'
    },
    aiMessage: {
      alignSelf: 'flex-start'
    },
    messageContent: {
      background: theme.palette.mode === 'light'
        ? alpha(theme.palette.grey[50], 0.98)
        : theme.palette.background.paper,
      color: theme.palette.text.primary,
      padding: '1rem 1.25rem',
      borderRadius: '18px',
      boxShadow: theme.shadows[1],
      position: 'relative',
      borderBottomLeftRadius: '4px'
    },
    userMessageContent: {
      background: theme.palette.mode === 'light'
        ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.light, 0.85)} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
      color: theme.palette.primary.contrastText,
      padding: '1rem 1.25rem',
      borderRadius: '18px',
      boxShadow: theme.shadows[1],
      position: 'relative',
      borderBottomRightRadius: '4px'
    },
    messageList: {
      margin: '0.5rem 0',
      paddingLeft: '1.5rem'
    },
    messageListItem: {
      margin: '0.25rem 0'
    },
    messageTime: {
      fontSize: '0.7rem',
      color: theme.palette.text.secondary,
      marginTop: '0.25rem',
      textAlign: 'right'
    },
    userMessageTime: {
      fontSize: '0.7rem',
      color: alpha(theme.palette.primary.contrastText, 0.7),
      marginTop: '0.25rem',
      textAlign: 'right'
    },
    errorMessage: {
      color: theme.palette.error.main,
      fontWeight: '500'
    },
    escalateButton: {
      background: theme.palette.success.main,
      color: theme.palette.getContrastText(theme.palette.success.main),
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.875rem',
      cursor: 'pointer',
      marginTop: '0.75rem',
      transition: 'all 0.2s ease',
      fontWeight: 500,
      display: 'block'
    },
    escalateButtonHover: {
      background: theme.palette.success.dark,
      transform: 'translateY(-1px)'
    },
    escalatedNotice: {
      background: alpha(theme.palette.success.light, 0.2),
      color: theme.palette.success.dark,
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      marginTop: '0.75rem',
      border: `1px solid ${alpha(theme.palette.success.light, 0.5)}`
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
      background: theme.palette.divider,
      animation: 'typing 1.4s infinite ease-in-out'
    },
    typingDot1: {
      animationDelay: '-0.32s'
    },
    typingDot2: {
      animationDelay: '-0.16s'
    },
    errorBanner: {
      background: alpha(theme.palette.error.light, 0.2),
      color: theme.palette.error.dark,
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      border: `1px solid ${theme.palette.error.light}`,
      textAlign: 'center'
    },
    input: {
      background: theme.palette.mode === 'light'
        ? alpha(theme.palette.grey[50], 0.98)
        : theme.palette.background.paper,
      padding: '1rem',
      borderTop: '2px solid',
      borderColor: theme.palette.divider,
      opacity: 0.8,
      boxShadow: theme.shadows[2]
    },
    inputContainer: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-end'
    },
    textarea: {
      flex: 1,
      border: '2px solid',
      borderColor: theme.palette.divider,
      opacity: 0.8,
      borderRadius: '25px',
      padding: '0.75rem 1.25rem',
      fontSize: '1rem',
      resize: 'none',
      outline: 'none',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      lineHeight: 1.5,
      background: theme.palette.mode === 'light'
        ? alpha(theme.palette.grey[100], 0.95)
        : theme.palette.background.default,
      color: theme.palette.text.primary,
      minHeight: '50px'
    },
    textareaFocus: {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
    },
    textareaDisabled: {
      background: theme.palette.action.disabledBackground,
      cursor: 'not-allowed'
    },
    sendButton: {
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      color: theme.palette.primary.contrastText,
      border: 'none',
      padding: '0.75rem',
      borderRadius: '50%',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme.shadows[2]
    },
    sendButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4]
    },
    sendButtonDisabled: {
      background: theme.palette.action.disabled,
      color: theme.palette.text.disabled,
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
      color: theme.palette.primary.main,
      fontSize: '1.25rem',
      marginRight: '0.5rem'
    },
    quickReplyContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginTop: '1rem'
    },
    quickReplyButton: {
      background: theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.light, 0.08)
        : theme.palette.background.paper,
      color: theme.palette.primary.main,
      border: `1.5px solid ${theme.palette.primary.main}`,
      borderRadius: '20px',
      padding: '0.4rem 1rem',
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: 500
    },
    backButton: {
      background: theme.palette.background.paper,
      color: theme.palette.text.secondary,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '20px',
      padding: '0.4rem 1rem',
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem'
    },
    topicQuestionButton: {
      background: theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.light, 0.08)
        : theme.palette.background.paper,
      color: theme.palette.primary.main,
      border: `1.5px solid ${theme.palette.primary.main}`,
      borderRadius: '20px',
      padding: '0.4rem 1rem',
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: 500,
      textAlign: 'left'
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

      <div style={styles.messages} ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <div style={{ ...styles.message, ...styles.aiMessage }}>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ 
                  background: alpha(theme.palette.primary.main, 0.1), 
                  borderRadius: '50%', 
                  padding: '0.5rem',
                  marginRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaRobot size={24} style={{ color: theme.palette.primary.main }} />
                </div>
              </div>
              <div style={styles.messageContent}>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>👋 Hello! I'm your Groq AI assistant. I can help you with:</p>
                <ul style={styles.messageList}>
                  <li style={styles.messageListItem}>📅 Court bookings and reservations</li>
                  <li style={styles.messageListItem}>💳 Membership information and benefits</li>
                  <li style={styles.messageListItem}>💰 Payment methods and wallet management</li>
                  <li style={styles.messageListItem}>📝 General questions about our services</li>
                </ul>
                <p style={{ marginTop: '0.5rem' }}>Just type your question below and I'll do my best to help!</p>
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
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end',
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
            }}>
              {message.sender === 'ai' ? (
                <div style={{ 
                  background: alpha(theme.palette.primary.main, 0.1), 
                  borderRadius: '50%', 
                  padding: '0.5rem',
                  marginRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaRobot size={24} style={{ color: theme.palette.primary.main }} />
                </div>
              ) : (
                <div style={{ 
                  background: alpha(theme.palette.primary.main, 0.2), 
                  borderRadius: '50%', 
                  padding: '0.5rem',
                  marginLeft: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaUser size={20} style={{ color: theme.palette.primary.main }} />
                </div>
              )}
              
              <div style={message.sender === 'user' ? styles.userMessageContent : styles.messageContent}>
                {message.isError ? (
                  <div style={styles.errorMessage}>
                    <span>⚠️ {message.content}</span>
                  </div>
                ) : (
                  message.sender === 'ai' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <span>{message.content}</span>
                  )
                )}

                {message.sender === 'ai' && message.queryId && !message.escalated && !message.isEscalated && (
                  <button
                    style={styles.escalateButton}
                    onMouseEnter={(e) => {
                      e.target.style.background = theme.palette.success.dark;
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = theme.palette.success.main;
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
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: theme.palette.text.secondary }}>
                      What do you need help with?
                    </p>
                    <div style={styles.quickReplyContainer}>
                      {message.options.map(btn => (
                        <button
                          key={btn.value}
                          onClick={() => handleQuickReply(btn.value)}
                          style={styles.quickReplyButton}
                          onMouseEnter={(e) => {
                            e.target.style.background = alpha(theme.palette.primary.main, 0.1);
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme.palette.background.paper;
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.type === 'topic_questions' && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: theme.palette.text.secondary }}>
                      Here are some common questions about {message.topic.replace('_', ' ')}:
                    </p>
                    <div style={styles.quickReplyContainer}>
                      {message.options.map(q => (
                        <button
                          key={q}
                          onClick={() => handleTopicQuestion(q)}
                          style={styles.topicQuestionButton}
                          onMouseEnter={(e) => {
                            e.target.style.background = theme.palette.action.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme.palette.background.paper;
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
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
                        style={styles.backButton}
                        onMouseEnter={(e) => {
                          e.target.style.background = theme.palette.action.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = theme.palette.background.paper;
                        }}
                      >
                        <FaArrowLeft size={12} /> Back to topics
                      </button>
                    </div>
                  </div>
                )}

                {message.type === 'feedback_options' && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={styles.quickReplyContainer}>
                      {message.options.map(q => (
                        <button
                          key={q}
                          onClick={() => handleFeedbackQuestion(q)}
                          style={styles.topicQuestionButton}
                          onMouseEnter={(e) => {
                            e.target.style.background = theme.palette.action.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme.palette.background.paper;
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
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
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ 
                background: alpha(theme.palette.primary.main, 0.1), 
                borderRadius: '50%', 
                padding: '0.5rem',
                marginRight: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaRobot size={24} style={{ color: theme.palette.primary.main }} />
              </div>
              <div style={styles.messageContent}>
                <div style={styles.typingIndicator}>
                  <span style={{ ...styles.typingDot, ...styles.typingDot1 }}></span>
                  <span style={{ ...styles.typingDot, ...styles.typingDot2 }}></span>
                  <span style={styles.typingDot}></span>
                </div>
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
                e.target.style.borderColor = theme.palette.primary.main;
                e.target.style.boxShadow = `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`;
              }}
              onBlur={(e) => {
                if (!inputMessage.trim()) {
                  e.target.style.borderColor = theme.palette.divider;
                  e.target.style.boxShadow = 'none';
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
                  e.target.style.boxShadow = theme.shadows[4];
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && inputMessage.trim()) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = theme.shadows[2];
                }
              }}
            >
              <SendIcon fontSize="small" />
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
                e.target.style.borderColor = theme.palette.primary.main;
                e.target.style.boxShadow = `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`;
              }}
              onBlur={(e) => {
                if (!inputMessage.trim()) {
                  e.target.style.borderColor = theme.palette.divider;
                  e.target.style.boxShadow = 'none';
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
                  e.target.style.boxShadow = theme.shadows[4];
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && inputMessage.trim()) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = theme.shadows[2];
                }
              }}
            >
              <SendIcon fontSize="small" />
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