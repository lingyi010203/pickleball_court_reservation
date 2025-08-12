import React, { useState, useRef, useEffect } from 'react';
import { 
  Fab, 
  Tooltip, 
  Box, 
  Paper, 
  Typography, 
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  CircularProgress
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MessageIcon from '@mui/icons-material/Message';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import PaymentIcon from '@mui/icons-material/Payment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SendIcon from '@mui/icons-material/Send';
import { FaUser, FaRobot } from 'react-icons/fa';
import HelpdeskService from '../../service/HelpdeskService';
import { useAuth } from '../../context/AuthContext';

const FloatingMessageButton = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const messagesEndRef = useRef(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      const isLoggedIn = currentUser?.username;
      const username = isLoggedIn || 'Guest';
      
      // Initialize chat when opening
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          content: isLoggedIn 
            ? `Hello ${username}! Welcome to the Pickleball Court Reservation app! How can I assist you today? Do you need help with making a reservation, checking availability, or something else?`
            : `Hello there! Welcome to the Pickleball Court Reservation app! I'm here to help you learn about our services. You can ask me about court availability, pricing, rules, or how to get started. Would you like to know more about anything specific?`,
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'quick_replies',
          options: isLoggedIn ? QUICK_REPLIES : GUEST_QUICK_REPLIES,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setInputMessage('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if user is logged in
      const isLoggedIn = currentUser?.username;
      
      if (isLoggedIn) {
        // For logged in users, use the backend service
        const response = await HelpdeskService.askQuestion(message);
        const aiMessage = {
          id: response.id,
          content: response.aiResponse,
          sender: 'ai',
          timestamp: response.timestamp || new Date().toISOString(),
          queryId: response.id,
          escalated: response.escalated
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // For non-logged in users, provide local responses
        const localResponse = getLocalResponse(message);
        const aiMessage = {
          id: Date.now(),
          content: localResponse,
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
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

  const formatAiContent = (text) => {
    const safe = typeof text === 'string' ? text : '';
    return safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*?):/g, '<h3>$1:</h3>')
      .replace(/\n/g, '<br>')
      .replace(/\* (.*?)(?=<br>|$)/g, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<br><br>/g, '<br>');
  };

  const getLocalResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Court Information
    if (lowerMessage.includes('court') || lowerMessage.includes('court information')) {
      return `**Court Information**

### Available Courts
We have multiple indoor and outdoor pickleball courts available for booking. * All courts are well-maintained and meet professional standards. * Courts are equipped with proper lighting and ventilation.

### Court Types
* **Indoor Courts**: Climate-controlled environment, perfect for year-round play
* **Outdoor Courts**: Natural lighting, great for daytime sessions
* **Premium Courts**: Enhanced facilities with additional amenities

### Equipment Provided
* Pickleball paddles and balls are available for rent
* You can also bring your own equipment
* Court shoes are recommended for better performance`;
    }
    
    // Pricing
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
      return `**Pricing Information**

### Court Rental Rates
* **Peak Hours** (6:00 PM - 10:00 PM): RM 55/hour
* **Off-Peak Hours** (8:00 AM - 6:00 PM): RM 30/hour
* **Weekend Rates**: RM 45/hour

### Discounts Available
* **Student Discount**: 20% off with valid student ID
* **Senior Citizen Discount**: 15% off for ages 60+
* **Package Deals**: 10% off for bookings of 3+ hours

### Payment Methods
* Credit/Debit cards
* Digital wallets
* Cash payments accepted`;
    }
    
    // Registration
    if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('account')) {
      return `**How to Register**

### Registration Process
* Click the "Register" button in the top right corner
* Fill in your basic information (name, email, password)
* Verify your email address
* Complete your profile with additional details

### Registration Benefits
* Free account creation
* Access to court booking system
* Member discounts and rewards
* Booking history tracking

### Required Information
* Full name
* Email address
* Phone number
* Password (minimum 6 characters)`;
    }
    
    // Rules
    if (lowerMessage.includes('rule') || lowerMessage.includes('guideline') || lowerMessage.includes('policy')) {
      return `**Court Rules & Guidelines**

### General Rules
* Arrive 10 minutes before your booking time
* Wear appropriate sports attire and court shoes
* Respect other players and maintain good sportsmanship
* Keep the courts clean and tidy

### Cancellation Policy
* Free cancellation up to 24 hours before booking
* 50% refund for cancellations 2-24 hours before
* No refund for cancellations less than 2 hours before

### Equipment Rules
* You can bring your own equipment
* Rental equipment is available on-site
* Please return rental equipment in good condition`;
    }
    
    // Location
    if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
      return `**Location & Hours**

### Address
Kuala Lumpur, Malaysia
* Easy access via public transportation
* Ample parking available
* Wheelchair accessible facilities

### Operating Hours
* **Monday - Friday**: 8:00 AM - 10:00 PM
* **Saturday - Sunday**: 7:00 AM - 11:00 PM
* **Public Holidays**: 8:00 AM - 10:00 PM

### Facilities
* Changing rooms and showers
* Equipment rental counter
* Vending machines
* Seating areas for spectators`;
    }
    
    // Contact
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return `**Contact Information**

### Customer Service
* **Phone**: +60 12-345 6789
* **Email**: support@pickleball.com
* **WhatsApp**: +60 12-345 6789

### Service Hours
* **Monday - Friday**: 9:00 AM - 6:00 PM
* **Saturday**: 9:00 AM - 4:00 PM
* **Sunday**: 10:00 AM - 2:00 PM

### Visit Us
You're welcome to visit our facility during operating hours to see the courts and meet our staff. No appointment necessary!`;
    }
    
    // Default response
    return `Thank you for your question! I'm here to help you learn about our pickleball court reservation system. 

You can ask me about:
* **Court Information** - Available courts and facilities
* **Pricing** - Rates and payment options  
* **Registration** - How to create an account
* **Rules & Guidelines** - Court policies and procedures
* **Location & Hours** - Address and operating times
* **Contact Information** - How to reach us

Feel free to ask any specific questions about these topics!`;
  };

  const helpTopics = [
    { icon: <SportsTennisIcon />, text: 'Court/Reservation', color: '#4CAF50' },
    { icon: <PaymentIcon />, text: 'Payment', color: '#2196F3' },
    { icon: <FeedbackIcon />, text: 'Feedback', color: '#FF9800' },
    { icon: <EventIcon />, text: 'Event', color: '#9C27B0' },
    { icon: <PersonIcon />, text: 'Profile', color: '#607D8B' },
    { icon: <CardMembershipIcon />, text: 'Membership', color: '#E91E63' },
  ];

  const QUICK_REPLIES = [
    { label: "Court/Reservation", value: "court_reservation" },
    { label: "Payment", value: "payment" },
    { label: "Feedback", value: "feedback" },
    { label: "Event", value: "event" },
    { label: "Profile", value: "profile" },
    { label: "Membership", value: "membership" }
  ];

  const GUEST_QUICK_REPLIES = [
    { label: "Court Information", value: "court_info" },
    { label: "Pricing", value: "pricing" },
    { label: "How to Register", value: "registration" },
    { label: "Rules & Guidelines", value: "rules" },
    { label: "Location & Hours", value: "location" },
    { label: "Contact Us", value: "contact" }
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
    ],
    // Guest user questions
    court_info: [
      "What types of courts do you have?",
      "Are the courts indoor or outdoor?",
      "What equipment is provided?",
      "How many courts are available?",
      "Are the courts well-maintained?"
    ],
    pricing: [
      "What are your court rental rates?",
      "Do you offer any discounts?",
      "Are there peak and off-peak rates?",
      "Do you offer package deals?",
      "What payment methods do you accept?"
    ],
    registration: [
      "How do I create an account?",
      "Is registration free?",
      "What information do I need to register?",
      "Can I book without registering?",
      "How long does registration take?"
    ],
    rules: [
      "What are the court rules?",
      "Are there dress code requirements?",
      "What is the cancellation policy?",
      "Can I bring my own equipment?",
      "Are there age restrictions?"
    ],
    location: [
      "Where are you located?",
      "What are your operating hours?",
      "Is there parking available?",
      "Are you accessible by public transport?",
      "Do you have changing rooms?"
    ],
    contact: [
      "How can I contact you?",
      "What is your phone number?",
      "Do you have an email address?",
      "What are your customer service hours?",
      "Can I visit without booking?"
    ]
  };

  const PREDEFINED_ANSWERS = {
    "How do I book a pickleball court?": `**Making a Booking with Pickleball Court Reservation**

### Step 1: **Log in or Sign up**
If you already have an account, log in with your email and password. * If you're new to our app, sign up for a free account by providing your email, password, and other basic information.

### Step 2: **Choose Your Court and Time**
Browse through our available courts and select the one you'd like to book. * Choose the date and time you'd like to play. Make sure to check the court's availability before booking.

### Step 3: **Enter Your Booking Details**
Fill in your personal information and contact details. * Add any additional players or guests to your booking. * Specify any special requests or notes for staff.

### Step 4: **Confirm Your Booking**
Review your booking details carefully to ensure everything is accurate. * Review our terms and conditions, then click "Book Now" to confirm your reservation. * You'll receive a confirmation email with your booking details.`,

    "What is the booking cancellation policy?": `**Booking Cancellation Policy**

### Step 1: **Cancellation Timeframe**
You can cancel your booking up to 24 hours before the scheduled time for a full refund. * Cancellations made within 24 hours may be subject to a partial refund or no refund depending on our policy.

### Step 2: **How to Cancel**
Go to your Booking History in your profile. * Select the booking you wish to cancel. * Click the "Cancel Booking" button and confirm your cancellation.

### Step 3: **Refund Process**
Refunds are processed within 3-5 business days. * The refund will be credited back to your original payment method. * You'll receive a confirmation email once the refund is processed.`,

    "Can I book multiple courts at once?": `**Multiple Court Bookings**

### Step 1: **Availability Check**
Yes, you can select multiple courts during the booking process, subject to availability. * Check the availability calendar to see which courts are free at your preferred time.

### Step 2: **Booking Process**
Select multiple courts from the available options. * Choose the same date and time for all courts. * Add all players to each court booking.

### Step 3: **Payment and Confirmation**
Pay for all courts in a single transaction. * Receive separate confirmation emails for each court booking. * Each booking will have its own unique reference number.`,

    "What are the court operating hours?": `**Court Operating Hours**

### Step 1: **General Hours**
Court operating hours are typically from 8:00 AM to 10:00 PM daily. * Please check the court details for specific timings as some courts may have different schedules.

### Step 2: **Peak vs Off-Peak**
Peak hours: 4:00 PM - 8:00 PM (higher rates apply). * Off-peak hours: 8:00 AM - 4:00 PM and 8:00 PM - 10:00 PM (lower rates).

### Step 3: **Special Hours**
Holiday hours may vary - check our announcements page. * Early morning and late night bookings may be available upon request.`,

    "What are the court prices (peak/off-peak)?": `**Court Pricing Information**

### Step 1: **Peak Hours Pricing**
Peak hours are usually 4:00 PM - 8:00 PM at RM80/hr. * This includes weekends and public holidays. * Premium courts may have additional charges.

### Step 2: **Off-Peak Pricing**
Off-peak is RM50/hr during weekdays 8:00 AM - 4:00 PM. * Late night rates (8:00 PM - 10:00 PM) are also RM50/hr. * See court details for exact pricing as rates may vary by location.

### Step 3: **Additional Costs**
Equipment rental: RM10 per set. * Coaching services: RM100 per hour. * Membership discounts apply to all rates.`,

    "How do I check court availability?": `**Checking Court Availability**

### Step 1: **Navigate to Courts**
You can check court availability on the Court List or Booking page. * Available dates and time slots are shown in the booking calendar.

### Step 2: **Calendar View**
Use the calendar to select your preferred date. * Available time slots will be highlighted in green. * Booked slots will be shown in red or gray.

### Step 3: **Real-Time Updates**
Availability is updated in real-time. * Refresh the page to see the latest availability. * You can set up notifications for when courts become available.`,

    "How do I cancel or change my reservation?": `**Modifying Your Reservation**

### Step 1: **Access Booking History**
To cancel or change your reservation, go to your Booking History. * Select the booking you wish to modify from your list of active bookings.

### Step 2: **Modification Options**
Click "Edit Booking" to change date, time, or court. * Click "Cancel Booking" to cancel entirely. * Add or remove players from your booking.

### Step 3: **Confirmation**
Review your changes before confirming. * You'll receive an updated confirmation email. * Any refunds will be processed according to our cancellation policy.`,

    "What happens if I miss my reservation?": `**No-Show Policy**

### Step 1: **Immediate Actions**
If you miss your reservation, the slot will be released after 15 minutes. * The court becomes available for other players to book.

### Step 2: **Fees and Penalties**
No-show fees may apply as per our policy. * First offense: Warning email. * Subsequent offenses: RM20 fee per missed booking.

### Step 3: **Prevention Tips**
Set reminders on your phone. * Arrive 10 minutes early. * Contact us if you need to cancel last minute.`,

    "What payment methods are accepted?": `**Accepted Payment Methods**

### Step 1: **Digital Payments**
We accept credit/debit cards (Visa, MasterCard, American Express). * PayPal payments are supported for international users. * Digital wallets like Apple Pay and Google Pay.

### Step 2: **Wallet System**
Use our in-app wallet for faster transactions. * Top up your wallet using any accepted payment method. * Wallet payments are instant and secure.

### Step 3: **Security**
All payments are processed through secure payment gateways. * Your payment information is encrypted and never stored on our servers.`,

    "How do I add money to my wallet?": `**Adding Funds to Your Wallet**

### Step 1: **Access Wallet**
Go to the Wallet section in your profile. * Click 'Add Funds' to top up using your preferred payment method.

### Step 2: **Select Amount**
Choose from preset amounts or enter a custom amount. * Minimum top-up: RM10. * Maximum top-up: RM500 per transaction.

### Step 3: **Payment and Confirmation**
Select your payment method and complete the transaction. * Funds are added instantly to your wallet. * You'll receive a confirmation email with transaction details.`,

    "Can I get a refund?": `**Refund Policy**

### Step 1: **Eligible Refunds**
Refunds are processed according to our cancellation policy. * Full refunds for cancellations made 24+ hours in advance. * Partial refunds may be available for late cancellations.

### Step 2: **How to Request**
Contact support through the helpdesk or email. * Provide your booking reference number. * Explain the reason for your refund request.

### Step 3: **Processing Time**
Refunds are processed within 3-5 business days. * You'll receive an email confirmation once processed. * Funds are returned to your original payment method.`,

    "How do I pay for my booking?": `**Payment Process**

### Step 1: **Select Payment Method**
You can pay for your booking during the checkout process. * Choose between wallet payment or direct payment method.

### Step 2: **Wallet Payment**
If using wallet, funds are deducted instantly. * No additional fees for wallet payments. * Insufficient funds will prompt you to top up.

### Step 3: **Direct Payment**
Enter your card details or use saved payment methods. * Payment is processed securely through our payment gateway. * You'll receive a payment confirmation email.`,

    "What if my payment fails?": `**Payment Failure Resolution**

### Step 1: **Common Issues**
If your payment fails, please check your payment details. * Ensure sufficient funds in your account. * Verify your card hasn't expired.

### Step 2: **Retry Process**
Try the payment again with corrected information. * Wait a few minutes before retrying. * Contact your bank if the issue persists.

### Step 3: **Alternative Solutions**
Try a different payment method. * Use wallet payment if available. * Contact support for assistance with payment issues.`,

    "How can I leave feedback?": `**Leaving Feedback**

### Step 1: **After Your Session**
After your session, you can leave feedback from your booking history. * Go to the feedback section in your profile. * Click "Leave Feedback" on your completed booking.

### Step 2: **Feedback Form**
Rate your experience from 1-5 stars. * Write detailed comments about your experience. * Rate specific aspects like court condition, staff service, etc.

### Step 3: **Submission**
Submit your feedback to help us improve. * Your feedback is anonymous to other users. * We review all feedback to enhance our services.`,

    "Where can I see my previous feedback?": `**Viewing Your Feedback History**

### Step 1: **Access Feedback Section**
All your submitted feedback is visible in the Feedback section of your profile. * Navigate to your profile and click on "My Feedback".

### Step 2: **Feedback History**
View all your past feedback submissions. * See your ratings and comments. * Track how your feedback has been addressed.

### Step 3: **Management**
Edit or update your feedback if needed. * Delete feedback if you change your mind. * See responses from staff if any.`,

    "How is my feedback used?": `**How We Use Your Feedback**

### Step 1: **Service Improvement**
Your feedback helps us improve our services and facilities. * We review all feedback regularly to identify areas for improvement.

### Step 2: **Staff Training**
Feedback is used for staff training and development. * Positive feedback motivates our team. * Constructive criticism helps us grow.

### Step 3: **Policy Updates**
We use feedback to update our policies and procedures. * Your suggestions help shape our service offerings. * We prioritize feedback in our development roadmap.`,

    "How do I register for an event?": `**Event Registration Process**

### Step 1: **Browse Events**
To register for an event, go to the Events page. * Select the event you are interested in from the list. * Read the event details and requirements.

### Step 2: **Registration**
Click 'Register' on the event page. * Fill in your registration details. * Pay the registration fee if required.

### Step 3: **Confirmation**
You'll receive a confirmation email with event details. * Add the event to your calendar. * Check for any pre-event information or requirements.`,

    "Can I cancel my event registration?": `**Canceling Event Registration**

### Step 1: **Access Event History**
Yes, you can cancel your event registration from your event history. * Go to the event details page in your profile.

### Step 2: **Cancellation Process**
Click "Cancel Registration" on the event page. * Confirm your cancellation. * Check the refund policy for the specific event.

### Step 3: **Refund Information**
Some events may have non-refundable registration fees. * Refunds are processed according to the event's cancellation policy. * You'll receive a confirmation email for the cancellation.`,

    "Where can I see upcoming events?": `**Finding Upcoming Events**

### Step 1: **Events Page**
Upcoming events are listed on the Events page. * You can view details and register from there. * Events are sorted by date and popularity.

### Step 2: **Filtering Options**
Filter events by date, location, or type. * Search for specific events using keywords. * Set up notifications for new events.

### Step 3: **Event Details**
Click on any event to see full details. * View participant list and capacity. * Check event rules and requirements.`,

    "How do I create a new event?": `**Creating a New Event**

### Step 1: **Access Event Creation**
If you are an admin or organizer, go to the Events page. * Click 'Create Event' to start the process. * Fill in the event details and submit.

### Step 2: **Event Information**
Provide event title, description, and date/time. * Set event capacity and registration requirements. * Upload event images or promotional materials.

### Step 3: **Publishing**
Review all event details before publishing. * Set event visibility and registration settings. * Publish the event to make it available for registration.`,

    "What are the event rules and requirements?": `**Event Rules and Requirements**

### Step 1: **General Rules**
Event rules and requirements are listed in each event's details. * Please review them before registering. * Rules may vary by event type.

### Step 2: **Common Requirements**
Age restrictions may apply to certain events. * Skill level requirements for competitive events. * Equipment requirements and dress codes.

### Step 3: **Compliance**
All participants must follow event rules. * Violations may result in disqualification. * Contact organizers for clarification on any rules.`,

    "How do I edit my profile?": `**Editing Your Profile**

### Step 1: **Access Profile Settings**
Go to your Profile page and click the 'Edit Profile' button. * Update your information and save your changes.

### Step 2: **Editable Information**
Update your personal details like name and contact information. * Change your profile picture. * Update your preferences and settings.

### Step 3: **Save Changes**
Review your changes before saving. * Click "Save Changes" to update your profile. * You'll receive a confirmation email.`,

    "How do I change my user type?": `**Changing User Type**

### Step 1: **Eligibility Check**
If you are eligible, you can request a user type change. * Go to your Profile page or contact support for assistance.

### Step 2: **Request Process**
Submit a request through your profile settings. * Provide necessary documentation if required. * Wait for approval from administrators.

### Step 3: **Approval Process**
Your request will be reviewed within 2-3 business days. * You'll receive an email notification of the decision. * Approved changes take effect immediately.`,

    "How do I update my email or password?": `**Updating Account Information**

### Step 1: **Access Account Settings**
Go to your Profile or Account Settings page. * There you can update your email and change your password.

### Step 2: **Email Update**
Enter your new email address. * Verify the new email through a confirmation link. * Your old email will be notified of the change.

### Step 3: **Password Change**
Enter your current password for security. * Create a new strong password. * Confirm the new password to complete the change.`,

    "How do I upload a profile picture?": `**Uploading Profile Picture**

### Step 1: **Access Profile**
On your Profile page, click your avatar or the 'Upload Picture' button. * Select and upload a new profile photo.

### Step 2: **Image Requirements**
Supported formats: JPG, PNG, GIF. * Maximum file size: 5MB. * Recommended dimensions: 400x400 pixels.

### Step 3: **Upload Process**
Choose your image file from your device. * Crop and adjust the image if needed. * Click "Upload" to save your new profile picture.`,

    "How do I manage my notification preferences?": `**Managing Notifications**

### Step 1: **Access Settings**
Go to Notification Preferences in your Profile or Settings. * Enable or disable different types of notifications.

### Step 2: **Notification Types**
Booking confirmations and reminders. * Event updates and announcements. * Promotional offers and deals.

### Step 3: **Customization**
Set notification frequency (immediate, daily, weekly). * Choose notification channels (email, push, SMS). * Save your preferences to apply changes.`,

    "How do I become a member?": `**Becoming a Member**

### Step 1: **Automatic Membership**
Once you successfully register an account, you automatically become a member. * Your initial membership tier is Silver.

### Step 2: **Membership Benefits**
Access to exclusive member-only features. * Discounted rates on court bookings. * Priority booking for popular time slots.

### Step 3: **Getting Started**
Complete your profile information. * Explore member benefits and features. * Start earning points to upgrade your tier.`,

    "What are the benefits of membership?": `**Membership Benefits**

### Step 1: **Silver Tier Benefits**
You can view the specific benefits for each membership tier on the Membership page. * Each tier offers different discounts, privileges, and rewards.

### Step 2: **Gold Tier Benefits**
Higher discounts on court bookings and equipment rental. * Priority customer support. * Exclusive access to premium courts.

### Step 3: **Platinum Tier Benefits**
Maximum discounts and exclusive perks. * VIP event access. * Personalized coaching sessions. * Please visit the Membership section for full details.`,

    "How do I upgrade my membership?": `**Upgrading Your Membership**

### Step 1: **Point System**
Each membership tier has a maximum point threshold. * When you reach the required points for the next tier, your membership will be automatically upgraded.

### Step 2: **Earning Points**
Earn points by booking courts and participating in events. * Complete profile and leave feedback to earn bonus points. * Refer friends to earn additional points.

### Step 3: **Tracking Progress**
You can track your points and tier status on the Membership page. * View your progress towards the next tier. * See what activities earn the most points.`,

    "What are the membership tier levels?": `**Membership Tier Levels**

### Step 1: **Silver Tier**
Our membership tiers are: Silver (default for new members), Gold, and Platinum. * Silver tier provides basic member benefits and discounts.

### Step 2: **Gold Tier**
Gold tier offers increased benefits and higher discounts. * Requires 1000 points to achieve. * Includes priority booking and enhanced support.

### Step 3: **Platinum Tier**
Platinum tier provides maximum benefits and exclusive perks. * Requires 5000 points to achieve. * You can view and upgrade your tier from your Profile or Membership page.`
  };

  const handleQuickReply = (value) => {
    setCurrentTopic(value);
    const isLoggedIn = currentUser?.username;
    const topicQuestions = TOPIC_QUESTIONS[value] || [];
    
    if (isLoggedIn) {
      const topicMessage = {
        id: Date.now(),
        sender: 'ai',
        type: 'topic_questions',
        content: `Here are some common questions about ${value.replace('_', ' ')}:`,
        options: topicQuestions,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, topicMessage]);
    } else {
      // For non-logged in users, provide immediate response
      const response = getLocalResponse(value.replace('_', ' '));
      const aiMessage = {
        id: Date.now(),
        sender: 'ai',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  const handleTopicQuestion = (question) => {
    const answer = PREDEFINED_ANSWERS[question];
    if (answer) {
      const aiMessage = {
        id: Date.now(),
        sender: 'ai',
        content: answer,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
      }}
    >
      {/* Help Window */}
      {isOpen && (
        <Paper
          elevation={12}
          sx={{
            width: 550,
            height: 500,
            overflow: 'hidden',
            borderRadius: 3,
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
            '@keyframes slideIn': {
              '0%': {
                opacity: 0,
                transform: 'translateX(20px) scale(0.9)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(0) scale(1)',
              },
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: theme.palette.primary.main,
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HeadsetMicIcon sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Help & Support
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'white' }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              background: theme.palette.background.default,
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '85%',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  {message.sender === 'ai' && (
                    <Box
                      sx={{
                        background: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        height: 32,
                      }}
                    >
                      <FaRobot size={16} style={{ color: theme.palette.primary.main }} />
                    </Box>
                  )}
                  
                                     <Paper
                     elevation={1}
                     sx={{
                       p: 1.5,
                       borderRadius: 2,
                       background: message.sender === 'user' 
                         ? theme.palette.primary.main
                         : theme.palette.background.paper,
                       color: message.sender === 'user' 
                         ? theme.palette.primary.contrastText 
                         : theme.palette.text.primary,
                       maxWidth: '100%',
                       wordBreak: 'break-word',
                     }}
                   >
                                         <Typography 
                       variant="body2" 
                       sx={{ 
                         fontSize: '0.875rem',
                         lineHeight: 1.8,
                         '& strong': {
                           fontWeight: 700,
                           color: theme.palette.text.primary,
                         },
                         '& h3': {
                           fontSize: '1rem',
                           fontWeight: 600,
                           margin: '1.5rem 0 0.75rem 0',
                           color: theme.palette.primary.main,
                           borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                           paddingBottom: '0.5rem',
                         },
                         '& p': {
                           margin: '0.75rem 0',
                         },
                         '& ul': {
                           margin: '0.75rem 0',
                           paddingLeft: '1.5rem',
                         },
                         '& li': {
                           margin: '0.5rem 0',
                           position: 'relative',
                           '&::before': {
                             content: '"•"',
                             color: theme.palette.primary.main,
                             fontWeight: 'bold',
                             position: 'absolute',
                             left: '-1rem',
                           },
                         },
                       }}
                       component="div"
                       dangerouslySetInnerHTML={{
                         __html: formatAiContent(message.content)
                       }}
                     />

                    {message.type === 'quick_replies' && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
                          What do you need help with?
                        </Typography>
                                                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                           {message.options.map(btn => (
                             <Box
                               key={btn.value}
                               onClick={() => handleQuickReply(btn.value)}
                               sx={{
                                 background: alpha(theme.palette.primary.main, 0.08),
                                 color: theme.palette.primary.main,
                                 border: `1px solid ${theme.palette.primary.main}`,
                                 borderRadius: '12px',
                                 px: 1,
                                 py: 0.5,
                                 fontSize: '0.75rem',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s',
                                 '&:hover': {
                                   background: alpha(theme.palette.primary.main, 0.15),
                                 },
                               }}
                             >
                               {btn.label}
                             </Box>
                           ))}
                         </Box>
                      </Box>
                    )}

                    {message.type === 'topic_questions' && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
                          Here are some common questions:
                        </Typography>
                                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                           {message.options.slice(0, 3).map(q => (
                             <Box
                               key={q}
                               onClick={() => handleTopicQuestion(q)}
                               sx={{
                                 background: theme.palette.background.paper,
                                 border: `1px solid ${theme.palette.divider}`,
                                 borderRadius: '8px',
                                 px: 1,
                                 py: 0.5,
                                 fontSize: '0.75rem',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s',
                                 '&:hover': {
                                   background: theme.palette.action.hover,
                                 },
                               }}
                             >
                               {q}
                             </Box>
                           ))}
                         </Box>
                      </Box>
                    )}
                  </Paper>

                  {message.sender === 'user' && (
                    <Box
                      sx={{
                        background: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        height: 32,
                      }}
                    >
                      <FaUser size={16} style={{ color: theme.palette.primary.main }} />
                    </Box>
                  )}
                </Box>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                    mt: 0.5,
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {formatTime(message.timestamp)}
                </Typography>
              </Box>
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <Box
                  sx={{
                    background: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    height: 32,
                  }}
                >
                  <FaRobot size={16} style={{ color: theme.palette.primary.main }} />
                </Box>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.background.paper,
                  }}
                >
                  <CircularProgress size={16} />
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                             <TextField
                 fullWidth
                 size="small"
                 value={inputMessage}
                 onChange={(e) => setInputMessage(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Type your question..."
                 disabled={isLoading}
                 multiline
                 maxRows={3}
                 sx={{
                   '& .MuiOutlinedInput-root': {
                     borderRadius: 2,
                     fontSize: '0.875rem',
                   },
                 }}
               />
                             <IconButton
                 onClick={() => handleSendMessage()}
                 disabled={!inputMessage.trim() || isLoading}
                 sx={{
                   background: theme.palette.primary.main,
                   color: 'white',
                   '&:hover': {
                     background: theme.palette.primary.dark,
                   },
                   '&:disabled': {
                     background: theme.palette.action.disabled,
                     color: theme.palette.text.disabled,
                   },
                 }}
               >
                 <SendIcon fontSize="small" />
               </IconButton>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Floating Button */}
      <Tooltip title="Help & Support" placement="left" arrow>
        <Fab
          color="primary"
          aria-label="help and support"
          onClick={handleClick}
          sx={{
            width: 64,
            height: 64,
            boxShadow: theme.shadows[8],
            '&:hover': {
              boxShadow: theme.shadows[12],
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          <HeadsetMicIcon sx={{ fontSize: 28 }} />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default FloatingMessageButton; 