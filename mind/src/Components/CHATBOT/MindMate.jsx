import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MindMate.css';

const MindMate = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [userName, setUserName] = useState('');
    const [language, setLanguage] = useState('ta-IN');
    const [availableVoices, setAvailableVoices] = useState([]);
    const [tamilVoice, setTamilVoice] = useState(null);
    const chatBoxRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // UI translations
    const translations = {
        'ta-IN': {
            title: 'MindMate - உங்கள் AI மனநல மருத்துவர்',
            immediateHelp: 'உடனடி உதவி:',
            suicidePrevention: 'தற்கொலை தடுப்பு: 988',
            contactPsychiatrists: 'எங்கள் வலைத்தளத்திலிருந்து மனநல மருத்துவர்களைத் தொடர்பு கொள்ளவும்',
            inputPlaceholder: 'உங்கள் செய்தியை தட்டச்சு செய்யவும் அல்லது பேசவும்...',
            send: 'அனுப்பு',
            processing: 'செயலாக்குகிறது...',
            speak: '🎤 பேசு',
            analyzing: 'பகுப்பாய்வு செய்கிறது...',
            speaking: 'பேசுகிறது...',
            note: 'குறிப்பு: மருத்துவ நோக்கத்திற்காக மருத்துவரை ஆலோசிக்க பரிந்துரைக்கப்படுகிறது*',
            psychiatristsNearYou: 'உங்களுக்கு அருகில் உள்ள மனநல மருத்துவர்கள்',
            home: '← முகப்பு',
            listening: 'கேட்கிறேன்...',
            microphoneRequired: 'மைக்ரோஃபோன் அணுகல் தேவை',
            connectionError: 'இணைப்பில் சிக்கல் ஏற்பட்டுள்ளது. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.',
            switchToEnglish: '🌐 English'
        },
        'en-US': {
            title: 'MindMate - Your AI Psychiatrist',
            immediateHelp: 'Immediate help:',
            suicidePrevention: 'Suicide Prevention: 988',
            contactPsychiatrists: 'Contact psychiatrists from our website',
            inputPlaceholder: 'Type or speak your message...',
            send: 'Send',
            processing: 'Processing...',
            speak: '🎤 Speak',
            analyzing: 'Analyzing...',
            speaking: 'Speaking...',
            note: 'Note: For Medical purpose it is recommended to counsel a Doctor*',
            psychiatristsNearYou: 'Psychiatrists near you',
            home: '← Home',
            listening: 'Listening...',
            microphoneRequired: 'Microphone access required',
            connectionError: 'I\'m having trouble connecting. Please check your internet and try again.',
            switchToTamil: '🌐 தமிழ்'
        }
    };

    // Generate a unique user ID or get from localStorage
    const [userId] = useState(() => {
        const storedId = localStorage.getItem('mindmate_user_id');
        if (storedId) return storedId;
        const newId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('mindmate_user_id', newId);
        return newId;
    });

    // Load conversation context from localStorage
    const [conversationContext, setConversationContext] = useState(() => {
        const storedContext = localStorage.getItem(`conversation_${userId}`);
        return storedContext ? JSON.parse(storedContext) : [];
    });

    // Load and display available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
            
            // Find Tamil voice
            const tamilVoice = voices.find(v => 
                v.name.includes('Valluvar') || 
                v.lang.includes('ta') || 
                v.lang.includes('tam') || 
                v.lang.includes('ta-IN')
            );
            
            if (tamilVoice) {
                console.log('Tamil voice found:', tamilVoice.name);
                setTamilVoice(tamilVoice);
            } else {
                console.warn('No Tamil voice found. Please check your Tamil voice installation.');
                setMessages(prev => [...prev, { 
                    role: "bot", 
                    text: "தமிழ் குரல் கண்டறியப்படவில்லை. தயவுசெய்து உங்கள் தமிழ் குரல் நிறுவலை சரிபார்க்கவும்." 
                }]);
            }
        };

        // Load voices when they become available
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Initial load
        loadVoices();
    }, []);

    // Speech recognition setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleSendMessage(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setMessages(prev => [
                    ...prev,
                    { role: "bot", text: translations[language].connectionError }
                ]);
            };
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, [language]);

    // Auto-scroll and save context
    useEffect(() => {
        chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
        localStorage.setItem(`conversation_${userId}`, JSON.stringify(conversationContext));
    }, [messages, conversationContext, userId]);

    const detectName = (message) => {
        const namePattern = /(?:my name is|i am|call me|என் பெயர்|நான்)\s+([A-Za-z\s\u0B80-\u0BFF]{3,30})/i;
        const match = message.match(namePattern);
        if (match && match[1]) {
            const name = match[1].trim().replace(/\s+/g, ' ');
            setUserName(name);
            return name;
        }
        return null;
    };

    const handleSendMessage = async (message = input) => {
        if (!message.trim() || isProcessing) return;

        setInput('');
        setIsProcessing(true);

        const detectedName = detectName(message);
        let updatedContext = [...conversationContext];
        
        if (detectedName) {
            updatedContext = [
                ...updatedContext,
                { role: "system", content: `User's name is ${detectedName}` }
            ];
        }

        updatedContext = [
            ...updatedContext,
            { role: "user", content: message }
        ];

        try {
            const response = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    context: updatedContext,
                    user_id: userId,
                    language: language
                })
            });

            if (!response.ok) throw new Error('Server response error');
            
            const data = await response.json();
            const botMessage = data.reply;

            const finalContext = [
                ...updatedContext,
                { role: "assistant", content: botMessage }
            ];

            setConversationContext(finalContext);
            setMessages(prev => [
                ...prev,
                { role: "user", text: message },
                { role: "bot", text: botMessage }
            ]);

            await speak(botMessage);
            
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: "bot", text: translations[language].connectionError }
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text) => {
        return new Promise((resolve) => {
            synthesisRef.current.cancel();
            setIsSpeaking(true);
            
            const utterance = new SpeechSynthesisUtterance(
                userName ? text.replace(/dear friend/gi, userName) : text
            );

            // Set voice based on language
            if (language === 'ta-IN') {
                // Try to get the Tamil voice again in case it wasn't loaded before
                const voices = window.speechSynthesis.getVoices();
                const tamilVoice = voices.find(v => v.name.includes('Valluvar'));
                
                if (tamilVoice) {
                    utterance.voice = tamilVoice;
                    console.log('Using Tamil voice:', tamilVoice.name);
                } else {
                    console.warn('Tamil voice not available at speak time');
                    setMessages(prev => [...prev, { 
                        role: "bot", 
                        text: "தமிழ் குரல் கிடைக்கவில்லை. தயவுசெய்து உங்கள் தமிழ் குரல் நிறுவலை சரிபார்க்கவும்." 
                    }]);
                }
            } else {
                // For English, use default voice
                const voices = window.speechSynthesis.getVoices();
                const englishVoice = voices.find(v => 
                    v.lang.includes('en') && 
                    !v.name.toLowerCase().includes('robot')
                );
                if (englishVoice) {
                    utterance.voice = englishVoice;
                }
            }

            // Set appropriate rate and pitch
            utterance.rate = language === 'ta-IN' ? 0.9 : 1.0;
            utterance.pitch = 1.0;
            
            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                setMessages(prev => [...prev, { 
                    role: "bot", 
                    text: language === 'ta-IN' 
                        ? "பேச்சு தொகுப்பில் பிழை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்." 
                        : "Speech synthesis error. Please try again."
                }]);
                setIsSpeaking(false);
                resolve();
            };
            
            synthesisRef.current.speak(utterance);
        });
    };

    const startListening = () => {
        if (isProcessing || isSpeaking || !recognitionRef.current) return;
        try {
            recognitionRef.current.lang = language;
            recognitionRef.current.start();
            setMessages(prev => [...prev, { role: "bot", text: translations[language].listening }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: translations[language].microphoneRequired }]);
        }
    };

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'ta-IN' ? 'en-US' : 'ta-IN');
    };

    return (
        <div className="mindmate-container">
            <div className='coco-con'>
                <h1>🧠 <span className='boyd'>{translations[language].title}</span></h1>

                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>

                

                <div className="input-container">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={translations[language].inputPlaceholder}
                        disabled={isProcessing || isSpeaking}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isProcessing || isSpeaking || !input.trim()}
                    >
                        {isProcessing ? translations[language].processing : translations[language].send}
                    </button>
                    <button
                        onClick={startListening}
                        className="voice-button"
                        disabled={isProcessing || isSpeaking}
                    >
                        {translations[language].speak}
                    </button>
                    <button
                        onClick={toggleLanguage}
                        className="language-button"
                    >
                        {language === 'ta-IN' ? translations['en-US'].switchToTamil : translations['ta-IN'].switchToEnglish}
                    </button>
                </div>

                {(isProcessing || isSpeaking) && (
                    <div className="status-indicator">
                        {isProcessing ? translations[language].analyzing : translations[language].speaking}
                    </div>
                )}
            </div>
            <div className='doraemon-div'>
                <img src="https://cdnb.artstation.com/p/assets/images/images/079/002/651/large/tunahan-kalayci-untitled.jpg?1723675882" className='imgoo' />
                <div className="emergency-section">
                    <p>{translations[language].note}</p>
                </div>
                <div className="button-groupdoe">
                    <button className="psych-button" onClick={() => navigate('/appointmentfinder')}>
                        {translations[language].psychiatristsNearYou}
                    </button>
                    <button onClick={() => navigate('/homepage')} className="homie-button">
                        {translations[language].home}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MindMate;