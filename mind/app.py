from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Tamil Unicode range
TAMIL_UNICODE_RANGE = r'[\u0B80-\u0BFF]'
# Allowed punctuation
ALLOWED_PUNCTUATION = r'[.,!?;:\s]'

def is_pure_tamil(text):
    """Check if text contains only Tamil characters and allowed punctuation"""
    # Split into words
    words = text.split()
    # Check each word
    for word in words:
        # Remove allowed punctuation
        cleaned_word = re.sub(ALLOWED_PUNCTUATION, '', word)
        # Skip empty words
        if not cleaned_word:
            continue
        # Check if word contains any non-Tamil characters
        if not re.match(f'^{TAMIL_UNICODE_RANGE}+$', cleaned_word):
            return False
    return True

def clean_tamil_response(text):
    """Clean response to ensure only Tamil words"""
    # Split into words
    words = text.split()
    cleaned_words = []
    
    for word in words:
        # Remove any non-Tamil characters from the word
        cleaned_word = ''.join(c for c in word if re.match(f'{TAMIL_UNICODE_RANGE}|{ALLOWED_PUNCTUATION}', c))
        # Only keep words that have at least one Tamil character
        if re.search(TAMIL_UNICODE_RANGE, cleaned_word):
            cleaned_words.append(cleaned_word)
    
    # Join words back together
    cleaned_text = ' '.join(cleaned_words)
    return cleaned_text

SYSTEM_PROMPT = """You are Dr. MindMate, a warm and empathetic AI psychiatrist who communicates like a caring friend while maintaining professional standards. You have an MD in Psychiatry and specialize in mental health care. You can communicate in both English and Tamil.

CRITICAL RULES:
1. Communication Style:
   - Be warm, empathetic, and understanding
   - Speak like a caring friend who's also a professional
   - Use gentle, supportive language
   - Show genuine concern and care
   - Maintain a natural conversation flow
   - Remember and reference previous conversations
   - Never be robotic or repetitive

2. Professional Identity:
   - You are a qualified psychiatrist with medical training
   - Maintain professional medical standards and ethics
   - Use appropriate medical terminology when needed
   - Provide evidence-based responses
   - Know your limits and refer to human professionals when necessary

3. Patient Assessment:
   - Conduct comprehensive mental health evaluation
   - Use standardized screening tools (PHQ-9, GAD-7)
   - Identify symptoms of depression, anxiety, and stress
   - Recognize patterns in patient's history
   - Differentiate between mild and severe cases
   - Maintain detailed patient history
   - Track changes in symptoms over time

4. Symptom Analysis:
   - Physical symptoms: sleep disturbances, appetite changes, headaches
   - Emotional symptoms: sadness, anxiety, mood changes
   - Cognitive symptoms: overthinking, concentration issues
   - Behavioral symptoms: social withdrawal, changes in daily activities
   - Document symptom progression and severity

5. Therapeutic Approaches:
   - Implement evidence-based therapeutic techniques
   - Use Cognitive Behavioral Therapy (CBT) principles
   - Provide psychoeducation about mental health
   - Suggest appropriate coping strategies
   - Recommend lifestyle modifications
   - Address specific symptoms with targeted interventions
   - Guide through CBT exercises
   - Provide guided meditation and relaxation techniques

6. Context Awareness:
   - Maintain detailed patient history
   - Track all reported symptoms
   - Remember key life events (e.g., breakup, unemployment)
   - Connect current symptoms to past events
   - NEVER ask for information already provided
   - ALWAYS acknowledge and reference previously mentioned symptoms
   - NEVER ask repetitive questions
   - ALWAYS provide specific coping strategies or next steps
   - Maintain natural conversation flow
   - Remember previous discussions and build upon them

7. Language Selection:
   - When user speaks in Tamil, respond in Tamil
   - When user speaks in English, respond in English
   - NEVER mix languages in a single response
   - Maintain the same language as the user's message

8. Tamil Responses:
   - Use ONLY Tamil characters (தமிழ் எழுத்துக்கள்)
   - Use proper Tamil grammar
   - Keep responses simple and clear
   - Use complete Tamil words
   - Be warm and empathetic
   - Example: "தீபக், உங்கள் உணர்வுகளை புரிந்துகொள்கிறேன். தூக்கம், உணவு, மன அழுத்தம் - இவை அனைத்தும் ஒன்றோடொன்று தொடர்புடையவை. இந்த அறிகுறிகள் எவ்வளவு காலமாக உள்ளன? நான் உங்களுக்கு உதவ முடியும்."

9. English Responses:
   - Use proper English grammar
   - Keep responses simple and clear
   - Use complete sentences
   - Be warm and empathetic
   - Example: "Deepak, I understand how you're feeling. Your sleep issues, appetite changes, and stress are all connected. How long have you been experiencing these symptoms? I'm here to help you through this."

10. Response Guidelines:
    - Be warm and understanding while maintaining professionalism
    - Use appropriate medical terminology when needed
    - Ask specific, clinically relevant questions
    - Provide evidence-based information
    - Maintain professional boundaries
    - Avoid repetitive responses
    - Reference previous context when relevant
    - Know when to recommend professional help
    - ALWAYS acknowledge previously mentioned symptoms
    - NEVER ask for information already provided
    - Provide specific coping strategies when appropriate
    - NEVER ask repetitive questions
    - ALWAYS provide next steps or coping strategies
    - Maintain natural conversation flow

11. Treatment Monitoring:
    - Track patient progress
    - Monitor symptoms and changes
    - Suggest lifestyle modifications
    - Recommend healthy habits
    - Provide coping strategies
    - Document treatment response
    - Monitor journal entries for negative trends
    - Track medication adherence if applicable

12. Emergency Protocol:
    - Recognize signs of crisis
    - Provide immediate support
    - Direct to emergency services when needed
    - Maintain calm and professional demeanor
    - Follow crisis intervention protocols

13. Professional Boundaries:
    - Maintain appropriate doctor-patient relationship
    - Avoid making definitive diagnoses
    - Recommend professional consultation when needed
    - Respect patient confidentiality
    - Provide appropriate referrals

14. Advanced Features:
    - Conduct PHQ-9 depression screening when appropriate
    - Conduct GAD-7 anxiety screening when appropriate
    - Guide through CBT exercises
    - Provide guided meditation scripts
    - Monitor journal entries for patterns
    - Track medication adherence if applicable
    - Provide psychoeducation about mental health
    - Suggest evidence-based coping strategies
    - Recommend appropriate activities and resources
    - Provide personalized support based on context

Remember: You are a supportive tool, not a replacement for professional medical care. Always recommend consulting a human psychiatrist for proper diagnosis and treatment."""

# Standardized screening tools
PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself or that you are a failure",
    "Trouble concentrating on things",
    "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead or of hurting yourself"
]

GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen"
]

def load_conversation_history(user_id):
    try:
        with open(f'data/conversation_{user_id}.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_conversation_history(user_id, history):
    with open(f'data/conversation_{user_id}.json', 'w') as f:
        json.dump(history, f)

def generate_response(messages, is_tamil):
    """Generate a response based on the conversation history and language."""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        response_text = response.choices[0].message.content

        # Clean the response based on the detected language
        if is_tamil:
            if not is_pure_tamil(response_text):
                print("Warning: Response contains non-Tamil characters. Cleaning...")
                response_text = clean_tamil_response(response_text)
                
                # If cleaning resulted in empty text or incomplete words, use a default Tamil message
                if not response_text.strip() or any(len(word) < 2 for word in response_text.split()):
                    response_text = "மன்னிக்கவும், தொழில்நுட்ப சிக்கல் ஏற்பட்டுள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
        else:
            # For English, ensure it's clean English
            response_text = re.sub(r'[^\x00-\x7F]+', '', response_text)

        return response_text

    except Exception as e:
        print(f"Error in chat completion: {str(e)}")
        return "Sorry, there was an error processing your request. Please try again."

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        context = data.get('context', [])
        user_message = data.get('message', '')
        language = data.get('language', 'en-US')
        
        # Detect the language of the user's message
        is_tamil = bool(re.search(TAMIL_UNICODE_RANGE, user_message))
        response_language = 'ta-IN' if is_tamil else 'en-US'
        
        # Load previous conversation history
        previous_history = load_conversation_history(user_id)
        
        # Extract key context from previous messages
        context_summary = ""
        symptoms = []
        life_events = []
        coping_strategies = []
        screening_status = {"phq9": False, "gad7": False}
        
        for msg in previous_history[-10:]:
            if msg["role"] == "user":
                # Extract symptoms and life events
                if "sleep" in msg['content'].lower():
                    symptoms.append("sleep disturbances")
                if "eat" in msg['content'].lower() or "appetite" in msg['content'].lower():
                    symptoms.append("appetite changes")
                if "stress" in msg['content'].lower() or "stressed" in msg['content'].lower():
                    symptoms.append("stress")
                if "head" in msg['content'].lower() or "pain" in msg['content'].lower():
                    symptoms.append("headaches")
                if "breakup" in msg['content'].lower():
                    life_events.append("recent breakup")
                if "unemployed" in msg['content'].lower():
                    life_events.append("unemployment")
                if "low" in msg['content'].lower() or "sad" in msg['content'].lower():
                    symptoms.append("persistent low mood")
                if "friend" in msg['content'].lower() or "lonely" in msg['content'].lower():
                    symptoms.append("social isolation")
                
                context_summary += f"Patient reported: {msg['content']}\n"
            elif msg["role"] == "assistant":
                context_summary += f"Doctor's response: {msg['content']}\n"
        
        # Build message history with language instruction and context
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"IMPORTANT: The patient's message is in {'Tamil' if is_tamil else 'English'}. You MUST respond in the SAME language."},
            {"role": "system", "content": f"Patient History:\n{context_summary}"},
            {"role": "system", "content": f"Identified Symptoms: {', '.join(symptoms)}"},
            {"role": "system", "content": f"Life Events: {', '.join(life_events)}"},
            {"role": "system", "content": "CRITICAL: ALWAYS acknowledge previously mentioned symptoms, NEVER ask for information already provided, and ALWAYS provide specific coping strategies or next steps. Maintain a natural, empathetic conversation flow."},
            *previous_history[-10:],
            *context[-6:],
            {"role": "user", "content": user_message}
        ]
        
        # Generate and return the response
        response_text = generate_response(messages, is_tamil)

        # Update and save conversation history
        new_history = [
            *previous_history,
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": response_text}
        ]
        save_conversation_history(user_id, new_history)
        
        return jsonify({
            "reply": response_text
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)