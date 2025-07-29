# MindMate AI

A bilingual (Tamil/English) AI-powered mental health platform providing emotional support, therapy guidance, and wellness resources.

## Overview

MindMate AI combines conversational AI with mental health services to create a comprehensive support system. The platform features a voice-enabled chatbot, psychiatrist locator, mood tracking, and a wellness store for psychological support tools.

## Features

### AI Chatbot
- Bilingual conversation support (Tamil and English)
- Voice recognition and speech synthesis
- OpenAI GPT-powered responses with psychiatric expertise
- Conversation memory and context retention
- Professional medical disclaimers and crisis detection

### Mental Health Services
- Nearby psychiatrist and therapist locator
- Appointment booking system
- Mood journaling and progress tracking
- AI-powered symptom assessment

### Wellness Store
- Psychological wellness products (aroma candles, stress-relief tools)
- Vendor inventory management
- Secure checkout and order tracking
- User purchase history

### User Management
- Secure authentication system
- Role-based access (citizens and vendors)
- Profile management
- Data privacy protection

## Technology Stack

**Frontend:**
- React 19.0.0
- Vite
- React Router DOM
- Bootstrap 5.3.3
- React Speech Recognition
- React Type Animation

**Backend:**
- Flask
- OpenAI API
- SQLite
- Flask-CORS
- Python-dotenv

## Installation

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- OpenAI API key

### Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd mind
   ```

2. Install dependencies
   ```bash
   # Frontend
   npm install
   
   # Backend
   pip install -r requirements.txt
   ```

3. Configure environment
   Copy the example file and add your API key:
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your actual OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_openai_api_key_here
   FLASK_ENV=development
   ```
   
   **Important**: Never commit your `.env` file to Git. It's already in `.gitignore`.

4. Start servers
   ```bash
   # Frontend (http://localhost:5173)
   npm run dev
   
   # Backend (http://localhost:5000)
   python app.py
   ```

## Usage

### For Users
1. Register/login to access the platform
2. Use the AI chatbot for emotional support
3. Find and book appointments with mental health professionals
4. Purchase wellness products from the store
5. Track mood and mental health progress

### For Vendors
1. Access vendor dashboard
2. Manage product inventory
3. Process customer orders
4. Monitor sales and analytics

## Project Structure

```
mind/
├── src/Components/
│   ├── APPOINTMENT/          # Booking system
│   ├── BOOKINGANDVENDORSTUFF/ # Order management
│   ├── CHATBOT/             # AI interface
│   ├── FRONTLOGINSIGNUP/    # Authentication
│   ├── HOMEPAGE/            # Dashboard
│   ├── ORDERSANDSTUFF/      # Order tracking
│   └── RATIONITEMS/         # Store
├── backend/
│   └── mindmate.db          # Database
├── data/                    # Conversation storage
├── app.py                   # Flask server
└── requirements.txt         # Dependencies
```

## API Endpoints

- `POST /api/chat` - Process chat messages
- `GET /api/conversation/<user_id>` - Get conversation history
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/products` - Get store products
- `POST /api/orders` - Create orders

## Security

- JWT-based authentication
- Input validation and sanitization
- CORS protection
- Secure data storage
- Privacy-compliant conversation handling

## Development

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

---

Built for accessible mental health support
