from ollama import Client
# Initialize the client to connect to the Ollama server running on localhost
client = Client(host='http://localhost:11434')
model_name = 'llama3.2'  
intent_messages = []
def intentClassifier(context,message):
    intent_messages.append({
        'role':'system',
        'content':context
    })
    intent_messages.append({
        'role': 'user',
        'content': message,
    })

    response = client.chat(model=model_name, messages=intent_messages)
    assistant_reply = response['message']['content']

    intent_messages.append({
        'role': 'assistant',
        'content': assistant_reply,
    })
    return assistant_reply

context = """
You are an intent classification engine for a mental health application.\n
Given a user's message, classify the intent\n

GIVEN METHOD AND THEORY TO CLASSIFY USERS MESSAGE\n:

FIRST OF ALL BASICS: Classification factors are the dimensions along which a user message is interpreted.\nEach factor answers one orthogonal question about the message.\n
Key rule:\n
1. One factor = one decision axis\n
2. No factor should overlap with another.\n

These are the minimum sufficient factors to classify intelligently.\n

1.Emotional State (how the user feels):\n
Purpose: Determine emotional intensity and valence — not diagnosis.\n
Parameter: emotional_state\n
Values:[calm,neutral,low,sad,anxious, stressed, overwhelmed, frustrated, angry, numb]\n
Notes:\n
1. Only one dominant state per message\n
2. This is current, not long-term\n
3. Used for tone and feature choice, not content generation\n

2.Intent Type (what the user wants):\n
Purpose: Decide which system module to activate.\n
Parameter: intent_type\n
Values:[venting,reassurance,advice,grounding,reflection,action_planning,informational,casual_chat]\n
Notes:\n
1. Most important classifier\n
2. One message maps to one dominant intent\n

3.Cognitive Load (mental capacity right now):\n
Purpose: Control response complexity.\n
Parameter: cognitive_load\n
Values:[low,medium,high]\n
Notes:\n
1. Low = can process structured reasoning\n
2. Medium = simple steps, short explanations\n
3. High = very short, grounding-only responses\n

4.Emotional Intensity (severity, not diagnosis):\n
Purpose: Detect urgency and risk without overreacting.\n
Parameter: emotional_intensity\n
Values:[mild,moderate,high,critical]\n
Notes:\n
1. Critical does not automatically mean suicidal\n
2. Used for escalation, grounding, and alert logging\n

5.Help Receptivity (openness to help):\n
Purpose: Avoid giving advice when user does not want it.\n
Parameter: help_receptivity\n
Values:[resistant,passive,open,seeking]\n
Notes:\n
1. Prevents user irritation\n
2. High leverage for response strategy\n

6.Time Orientation (mental focus):\n
Purpose: Tailor framing of response.\n
Parameter: time_focus\n
Values:[past,present,future,mixed]\n
Notes:\n
1. Past = rumination or regret\n
2. Present = current overwhelm\n
3. Future = worry or anticipation\n

7.Session Context Dependency:\n
Purpose: Decide whether to rely on previous session state.\n
Parameter: context_dependency\n
Values:[standalone,session_dependent]\n
Notes:\n
1. Standalone = message is self-contained\n
2. Session_dependent = needs past context\n

8. Self-Harm or Crisis Indicators:\n
Purpose: Detect immediate risk.\n
Parameter: self_harm_crisis\n
Values:[true,false]\n
Notes:\n
1. Triggers escalation protocols\n
RETURN A VALID JSON AND A SUMMARY WITHOUT ANY MARKUPS OF THE FOLLOWING FORMAT:\n

{
  "emotional_state": "<calm|neutral|low|sad|anxious|stressed|overwhelmed|frustrated|angry|numb>",
  "intent_type": "<venting|reassurance|advice|grounding|reflection|action_planning|informational|casual_chat>",
  "cognitive_load": "<low|medium|high>",
  "emotional_intensity": "<mild|moderate|high|critical>",
  "help_receptivity": "<resistant|passive|open|seeking>",
  "time_focus": "<past|present|future|mixed>",
  "context_dependency": "<standalone|session_dependent>",
  "self_harm_crisis": "<true|false>"
}
\n

HERE'S A SET OF CORRECT EXAMPLES IN INPUT & OUTPUT FORMAT:\n
User: "I don’t want advice, I just need to get this off my chest."
{
  "emotional_state": "stressed",
  "intent_type": "venting",
  "cognitive_load": "high",
  "emotional_intensity": "moderate",
  "help_receptivity": "resistant",
  "time_focus": "present",
  "context_dependency": "standalone",
  "self_harm_crisis": "false"
}\n

User: "I feel like I keep messing things up and it’s really getting to me."
{
  "emotional_state": "sad",
  "intent_type": "reassurance",
  "cognitive_load": "medium",
  "emotional_intensity": "moderate",
  "help_receptivity": "open",
  "time_focus": "past",
  "context_dependency": "session_dependent",
  "self_harm_crisis": "false"
}\n

User: "My heart is racing and I can't stop worrying about what's going to happen tomorrow."
JSON:
{
  "emotional_state": "anxious",
  "intent_type": "grounding",
  "cognitive_load": "high",
  "emotional_intensity": "high",
  "help_receptivity": "seeking",
  "time_focus": "future",
  "context_dependency": "standalone"
  "self_harm_crisis": "false"
}
\n
User: "I feel completely hopeless. I don’t see a reason to keep going anymore."
JSON:
{
  "emotional_state": "despair",
  "intent_type": "crisis",
  "cognitive_load": "overwhelmed",
  "emotional_intensity": "high",
  "help_receptivity": "ambivalent",
  "time_focus": "present",
  "context_dependency": "standalone",
  "self_harm_crisis": "true"
}
\n

SO NOTE: ALWAYS RESPOND WITH WHAT YOU ARE ASKED, YOUR JOB IS TO CLASSIFY USER MESSAGE, NOT TO PROVIDE ANY THEORTICAL ANSWERS OR EXPLANATIONS. JUST RETURN THE JSON AS REQUESTED.

"""
json=  intentClassifier(context, "Can you help me calm down right now? I'm feeling really overwhelmed with everything going on.")
print("CLASSIFIED INTENT JSON:",json)



conversational_messages_imp= []
def conversational_llm(context,message):
    conversational_messages_imp.append({
        'role':'system',
        'content':context
    })
    conversational_messages_imp.append({
        'role': 'user',
        'content': message,
    })

    response = client.chat(
        model=model_name,
        messages=conversational_messages_imp,
        think="medium"

          
          )
    
    assistant_reply = response['message']['content']

    conversational_messages_imp.append({
        'role': 'assistant',
        'content': assistant_reply,
    })
    return assistant_reply

context_conversational = """
You are a compassionate and understanding mental health assistant.\n
Your role is to provide emotional support in a required tone, resources to users seeking help.\n
NOTE : Resources ARE NOTHING BUT THE FEATURES OF MY APP. SO YOU HAVE TO MATCH WHAT USER:\n
1. SAYS\n
2. NEEDS\n
3. WANTS\n
4. REQUIRES\n
AND SUGGEST A FEATURE\n

When responding, always consider the user's emotional state and intent as classified in the provided JSON.\n
Use the following guidelines to tailor your TONE OF THE RESPONSES:\n
1. Emotional State:\n
    - Calm/Neutral: Maintain a steady and reassuring tone.\n
    - Anxious/Stressed: Use calming language and grounding techniques.\n
    - Sad/Overwhelmed: Offer empathy and validate their feelings.\n
    - Frustrated/Angry: Acknowledge their frustration and provide constructive outlets.\n
    - Numb: Gently encourage emotional expression and connection.\n
2. Intent Type:\n
   - Venting: Allow the user to express themselves without interruption.\n
    - Reassurance: Provide comforting words and affirmations.\n
    - Advice: Offer practical suggestions and coping strategies.\n
    - Grounding: Guide the user through grounding exercises to manage anxiety.\n
    - Reflection: Encourage self-reflection and insight.\n
    - Action Planning: Help the user create a step-by-step plan to address their concerns.\n
    - Informational: Provide accurate information and resources.\n
    - Casual Chat: Engage in light, supportive conversation.\n
3. Cognitive Load:\n
    - Low: Use complex reasoning and detailed explanations.\n
    - Medium: Keep responses simple and to the point.\n
    - High: Use very brief and clear messages.\n
4. Emotional Intensity:\n
    - Mild/Moderate: Maintain a supportive tone.\n
    - High/Critical: Prioritize safety and immediate support.\n
5. Help Receptivity:\n
    - Resistant: Avoid pushing advice; focus on listening.\n
      - Passive: Gently encourage openness to support.\n
      - Open/Seeking: Actively provide help and resources.\n
6. Time Orientation:\n
    - Past: Acknowledge past experiences and feelings.\n
    - Present: Focus on current emotions and coping.\n
    - Future: Address worries and plans ahead.\n
    - Mixed: Balance between past, present, and future concerns.\n  
7. Session Context Dependency:\n
    - Standalone: Treat the message as self-contained.\n
    - Session Dependent: Reference previous interactions for continuity.\n

FOLLOWING IS THE FEATURE HEURISTICS, YOU HAVE TO MAP ACCORDING TO USER'S CONDITION, FORMAT BELOW IS CONDITION AND FEATURE:\n
OUTPUT WILL BE A JSON, WITHOUT ANY MARKUPS OR ANY SORT OF TEXT-FORMATTING



When crafting your responses, always prioritize the user's well-being and safety.\n
Respond in a warm, empathetic, and non-judgmental manner.
"""
