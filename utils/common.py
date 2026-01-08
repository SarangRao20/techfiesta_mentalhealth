import json
import os
from datetime import datetime, timedelta
from utils.celery_app import celery
from flask import session
from groq import Groq
import hashlib

# Initialize Groq client
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def hash_student_id(student_id):
    """Hash student ID for privacy"""
    return hashlib.sha256(str(student_id).encode()).hexdigest()

def calculate_phq9_score(responses):
    """Calculate PHQ-9 depression score"""
    score = sum(responses.values())
    
    if score <= 4:
        severity = "Minimal"
    elif score <= 9:
        severity = "Mild"
    elif score <= 14:
        severity = "Moderate"
    elif score <= 19:
        severity = "Moderately Severe"
    else:
        severity = "Severe"
    
    return score, severity

def calculate_gad7_score(responses):
    """Calculate GAD-7 anxiety score"""
    score = sum(responses.values())
    
    if score <= 4:
        severity = "Minimal"
    elif score <= 9:
        severity = "Mild"
    elif score <= 14:
        severity = "Moderate"
    else:
        severity = "Severe"
    
    return score, severity

def calculate_ghq_score(responses):
    """Calculate GHQ general health score"""
    score = sum(responses.values())
    
    if score <= 12:
        severity = "Good"
    elif score <= 24:
        severity = "Fair"
    elif score <= 36:
        severity = "Poor"
    else:
        severity = "Very Poor"
    
    return score, severity

def get_assessment_questions(assessment_type):
    """Get questions for specific assessment type"""
    
    phq9_questions = [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself or that you are a failure",
        "Trouble concentrating on things",
        "Moving or speaking slowly, or being fidgety/restless",
        "Thoughts that you would be better off dead or hurting yourself"
    ]
    
    gad7_questions = [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it's hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen"
    ]
    
    ghq_questions = [
        "Been able to concentrate on what you're doing",
        "Lost much sleep over worry",
        "Felt that you were playing a useful part in things",
        "Felt capable of making decisions about things",
        "Felt constantly under strain",
        "Felt you couldn't overcome your difficulties",
        "Been able to enjoy your normal day-to-day activities",
        "Been able to face up to problems",
        "Been feeling unhappy or depressed",
        "Been losing confidence in yourself",
        "Been thinking of yourself as a worthless person",
        "Been feeling reasonably happy, all things considered"
    ]
    
    if assessment_type == "PHQ-9":
        return phq9_questions
    elif assessment_type == "GAD-7":
        return gad7_questions
    elif assessment_type == "GHQ":
        return ghq_questions
    
    return []

def get_assessment_options(assessment_type):
    """Get response options for specific assessment type"""
    
    if assessment_type in ["PHQ-9", "GAD-7"]:
        return [
            ("0", "Not at all"),
            ("1", "Several days"),
            ("2", "More than half the days"),
            ("3", "Nearly every day")
        ]
    elif assessment_type == "GHQ":
        return [
            ("0", "Better than usual"),
            ("1", "Same as usual"),
            ("2", "Less than usual"),
            ("3", "Much less than usual")
        ]
    
    return []

def format_time_ago(timestamp):
    """Format timestamp to human readable time ago"""
    now = datetime.utcnow()
    diff = now - timestamp
    
    if diff.days > 0:
        return f"{diff.days} days ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hours ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minutes ago"
    else:
        return "Just now"

def get_meditation_content():
    """Get meditation and music content"""
    return {
        "meditation": [
            {
                "title": "1/2-Minute Breathing Exercise",
                "duration": 0.5,
                "description": "Simple breathing technique to reduce stress and anxiety",
                "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
            },
            {
                "title": "Body Scan Meditation",
                "duration": 10,
                "description": "Progressive relaxation through body awareness",
                "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
            },
            {
                "title": "Mindfulness Meditation",
                "duration": 15,
                "description": "Focus on present moment awareness",
                "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
            }
        ],
        "music": [
    {
        "title": "Nature Sounds",
        "duration": 30,
        "description": "Relaxing sounds of rain and forest",
        "audio_url": "/static/audio/nature-documentary-309042.mp3"
    },
    {
        "title": "Piano Relaxation",
        "duration": 25,
        "description": "Gentle piano melodies for stress relief",
        "audio_url": "/static/audio/nostalgic-piano-396511.mp3"
    },
    {
        "title": "Ocean Waves",
        "duration": 45,
        "description": "Calming ocean sounds for deep relaxation",
        "audio_url": "/static/audio/waves-382467.mp3"
    }
]

    }

@celery.task
def generate_analysis(assessment_type, score):
    """
    Generate three-tier assessment analysis using Groq API:
    - user_safe: Uplifting, encouraging insights for the student
    - mentor_view: Moderate-level insights for teachers/mentors to guide students
    - counsellor_detailed: Full clinical truth with all professional details
    """
    
    # Determine severity and urgency based on assessment type and score
    if assessment_type == 'PHQ-9':
        max_score = 27
        if score <= 4:
            severity = "Minimal Depression"
            urgency = "low"
        elif score <= 9:
            severity = "Mild Depression"
            urgency = "low"
        elif score <= 14:
            severity = "Moderate Depression"
            urgency = "medium"
        elif score <= 19:
            severity = "Moderately Severe Depression"
            urgency = "high"
        else:
            severity = "Severe Depression"
            urgency = "critical"
    elif assessment_type == 'GAD-7':
        max_score = 21
        if score <= 4:
            severity = "Minimal Anxiety"
            urgency = "low"
        elif score <= 9:
            severity = "Mild Anxiety"
            urgency = "low"
        elif score <= 14:
            severity = "Moderate Anxiety"
            urgency = "medium"
        else:
            severity = "Severe Anxiety"
            urgency = "high"
    else:  # GHQ-12 or other
        max_score = 36
        if score <= 11:
            severity = "Low Distress"
            urgency = "low"
        elif score <= 15:
            severity = "Moderate Distress"
            urgency = "medium"
        else:
            severity = "High Distress"
            urgency = "high"
    
    help_needed = urgency in ["medium", "high", "critical"]
    
    # Use Groq API to generate personalized, three-tier analysis
    try:
        prompt = f"""You are a compassionate mental health professional creating assessment reports. Generate a JSON response with three different perspectives for a {assessment_type} assessment result.

**Assessment Details:**
- Type: {assessment_type}
- Score: {score}/{max_score}
- Severity: {severity}
- Urgency: {urgency}

**Clinical Context & Insight Metrics to Consider:**

For {assessment_type} assessments, analyze these key dimensions:

1. **Emotional Patterns:**
   - Mood stability vs. fluctuations
   - Anhedonia (loss of pleasure) indicators
   - Emotional reactivity and regulation capacity
   - Presence of hopelessness or despair

2. **Behavioral Indicators:**
   - Sleep disturbances (insomnia, hypersomnia, fragmented sleep)
   - Appetite changes (increased/decreased)
   - Social withdrawal vs. engagement
   - Energy levels and psychomotor changes
   - Self-care and daily functioning

3. **Cognitive Markers:**
   - Concentration and decision-making capacity
   - Negative self-perception and self-worth
   - Rumination patterns
   - Suicidal ideation (if score indicates)

4. **Resilience & Protective Factors:**
   - Coping mechanisms currently in use
   - Social support network strength
   - Help-seeking behavior
   - Previous treatment response (if applicable)

5. **Risk Factors:**
   - Crisis indicators (suicidal thoughts, self-harm)
   - Functional impairment level (academic, social, occupational)
   - Co-occurring symptoms (anxiety, trauma, substance use)
   - Barriers to treatment engagement

**Use these metrics to create data-driven, personalized insights in all three tiers.**

Create three distinct reports:

1. **user_safe**: For the student (warm, hopeful, non-clinical)
   - Use encouraging, uplifting language based on protective factors identified
   - Focus on strengths and growth opportunities
   - Avoid clinical jargon or alarming terms
   - Emphasize that help is available and recovery is possible
   - Include 3-4 practical self-care recommendations targeting behavioral patterns
   - Include 2-3 coping strategies addressing emotional regulation
   - Acknowledge challenges without catastrophizing

2. **mentor_view**: For teachers/mentors (balanced, actionable)
   - Clear guidance on how to support the student based on cognitive/behavioral markers
   - 3-4 specific action items for mentor (e.g., academic accommodations, check-in frequency)
   - Red flags to watch for derived from risk assessment
   - When to involve counselor (thresholds based on urgency level)
   - Practical classroom/academic support suggestions
   - Environmental modifications to support student

3. **counsellor_detailed**: For mental health professionals (clinical, comprehensive)
   - Clinical interpretation with DSM-5 context
   - Detailed risk assessment covering:
     * Suicide risk level with specific indicators from responses
     * Functional impairment across domains (academic, social, self-care)
     * Treatment urgency timeline
   - Evidence-based treatment recommendations:
     * Psychotherapy modalities (CBT, DBT, IPT as appropriate)
     * Medication consultation considerations
     * Crisis intervention needs
   - Key clinical insights integrating all metric dimensions above
   - Differential diagnosis considerations (rule-outs, comorbidities)
   - Follow-up monitoring plan with specific milestones
   - Protective factors to leverage in treatment

Return ONLY valid JSON in this exact format:
{{
  "user_safe": {{
    "title": "Your Wellness Check-In Results",
    "interpretation": "main message here",
    "positive_reinforcement": "encouraging statement",
    "recommendations": ["rec1", "rec2", "rec3"],
    "coping_strategies": ["strategy1", "strategy2"],
    "encouragement": "final uplifting message",
    "when_to_seek_help": "guidance text or null"
  }},
  "mentor_view": {{
    "student_status": "{severity}",
    "guidance": "main guidance for mentor",
    "action_items": ["action1", "action2", "action3"],
    "red_flags": ["flag1", "flag2"] or [],
    "support_suggestions": ["suggestion1", "suggestion2"],
    "severity_indicator": "{urgency}",
    "requires_counselor": {str(help_needed).lower()}
  }},
  "counsellor_detailed": {{
    "score_range": "{max_score} points ({assessment_type} Standard)",
    "raw_score": {score},
    "severity_category": "{severity}",
    "urgency_level": "{urgency}",
    "professional_help_recommended": {str(help_needed).lower()},
    "clinical_interpretation": "detailed clinical analysis",
    "risk_assessment": {{
      "suicide_risk": "assessment",
      "functional_impairment": "assessment",
      "treatment_urgency": "{urgency}"
    }},
    "key_insights": ["insight1", "insight2", "insight3"],
    "treatment_recommendations": ["rec1", "rec2", "rec3"],
    "differential_considerations": ["consideration1", "consideration2"] or []
  }}
}}"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a compassionate mental health professional creating personalized assessment reports. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        analysis_text = response.choices[0].message.content.strip()
        
        # Remove code fences if present
        if analysis_text.startswith("```json"):
            analysis_text = analysis_text[7:]
        if analysis_text.startswith("```"):
            analysis_text = analysis_text[3:]
        if analysis_text.endswith("```"):
            analysis_text = analysis_text[:-3]
        
        analysis = json.loads(analysis_text.strip())
        return analysis
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        # Fallback to basic hardcoded analysis if Groq fails
        return generate_fallback_analysis(assessment_type, score, severity, urgency, help_needed)

def generate_fallback_analysis(assessment_type, score, severity, urgency, help_needed):
    """Fallback analysis if Groq API fails"""
    
    if assessment_type == 'PHQ-9':
        if score <= 4:
            primary_interpretation = "minimal or no depression symptoms"
            clinical_severity = "Minimal Depression"
            urgency = "low"
            help_rec = False
            mentor_guidance = "Student is doing well emotionally. Continue regular check-ins."
            user_message = "You're doing great! Your responses suggest you're managing well."
        elif score <= 9:
            primary_interpretation = "mild depression symptoms"
            clinical_severity = "Mild Depression"
            urgency = "low"
            help_rec = True
            mentor_guidance = "Student showing mild stress indicators. Encourage self-care and monitor."
            user_message = "You're experiencing some stress, which is normal. Let's work on healthy coping strategies together."
        elif score <= 14:
            primary_interpretation = "moderate depression symptoms"
            clinical_severity = "Moderate Depression"
            urgency = "medium"
            help_rec = True
            mentor_guidance = "Student needs additional support. Recommend counseling and regular check-ins."
            user_message = "You're going through a challenging time. Reaching out for support is a sign of strength."
        elif score <= 19:
            primary_interpretation = "moderately severe depression"
            clinical_severity = "Moderately Severe Depression"
            urgency = "high"
            help_rec = True
            mentor_guidance = "Urgent: Student requires immediate counselor intervention. Monitor closely."
            user_message = "You're facing significant challenges right now. Professional support can make a real difference - you deserve help."
        else:
            primary_interpretation = "severe depression"
            clinical_severity = "Severe Depression"
            urgency = "critical"
            help_rec = True
            mentor_guidance = "CRITICAL: Immediate professional intervention required. Contact counselor and parents."
            user_message = "You're going through an extremely difficult time. Please know that help is available and things can get better."

        full_data = {
            "user_safe": {
                "title": "Your Wellness Check-In Results",
                "interpretation": user_message,
                "positive_reinforcement": "Remember, seeking help is a courageous step toward feeling better. You're not alone in this journey.",
                "recommendations": [
                    "Maintain a consistent sleep schedule (7-9 hours)",
                    "Try 20 minutes of physical activity daily - even a short walk helps",
                    "Practice mindfulness or meditation for 5-10 minutes",
                    "Connect with supportive friends or family members"
                ],
                "coping_strategies": [
                    "Break overwhelming tasks into smaller, manageable steps",
                    "Set one small achievable goal each day",
                    "Limit social media if it affects your mood negatively",
                    "Keep a gratitude journal - write 3 things you're grateful for daily"
                ],
                "encouragement": "Your feelings are valid, and reaching out shows strength. Small steps forward are still progress.",
                "when_to_seek_help": "If you're feeling overwhelmed or need someone to talk to, our counselors are here to support you." if score > 4 else None
            },
            "mentor_view": {
                "student_status": clinical_severity,
                "guidance": mentor_guidance,
                "action_items": [
                    "Schedule follow-up conversation in 1-2 weeks" if score <= 9 else "Recommend counseling referral",
                    "Monitor student's class participation and engagement",
                    "Check in privately about workload and stress levels",
                    "Encourage participation in wellness activities" if score <= 9 else "Alert counselor immediately"
                ],
                "red_flags": ["Signs of withdrawal", "Declining academic performance", "Mentions of hopelessness"] if score > 9 else [],
                "support_suggestions": [
                    "Offer flexible deadlines if struggling",
                    "Connect student with peer support groups",
                    "Recommend campus wellness resources"
                ],
                "severity_indicator": urgency,
                "requires_counselor": help_rec
            },
            "counsellor_detailed": {
                "score_range": "0-27 points (PHQ-9 Standard)",
                "raw_score": score,
                "severity_category": clinical_severity,
                "urgency_level": urgency,
                "professional_help_recommended": help_rec,
                "clinical_interpretation": f"Patient scored {score}/27 on PHQ-9, indicating {clinical_severity.lower()}.",
                "risk_assessment": {
                    "suicide_risk": "HIGH - Immediate intervention required" if score >= 20 else "MODERATE - Monitor closely" if score >= 15 else "LOW - Standard monitoring",
                    "functional_impairment": "Severe impact on daily functioning" if score > 19 else "Moderate impact" if score > 14 else "Mild to minimal impact",
                    "treatment_urgency": urgency
                },
                "key_insights": [
                    f"Structural PHQ-9 score: {score}/27",
                    "Indicates significant cognitive and emotional disturbance" if score > 14 else "Suggests stable to mildly impaired functioning",
                    f"Recommended intervention level: {'Crisis/Emergency' if score >= 20 else 'Individual therapy + possible medication' if score >= 15 else 'Therapy/counseling' if score >= 10 else 'Self-care + monitoring'}"
                ],
                "treatment_recommendations": [
                    "Immediate psychiatric evaluation" if score >= 20 else None,
                    "CBT or IPT therapy recommended" if score >= 10 else None,
                    "Consider medication evaluation" if score >= 15 else None,
                    "Regular follow-up assessments (bi-weekly)" if score >= 10 else "Follow-up in 4-6 weeks"
                ],
                "differential_considerations": [
                    "Rule out bipolar disorder if mood swings present",
                    "Assess for comorbid anxiety disorders",
                    "Check for substance use as contributing factor",
                    "Medical conditions (thyroid, vitamin deficiencies)"
                ] if score >= 10 else []
            }
        }
    elif assessment_type == 'GAD-7':
        if score < 5:
            severity = "Minimal Anxiety"
            urgency = "low"
            mentor_guidance = "Student managing anxiety well. Maintain supportive environment."
            user_message = "You're handling stress really well! Keep up your healthy coping habits."
        elif score < 10:
            severity = "Mild Anxiety"
            urgency = "low"
            mentor_guidance = "Mild anxiety detected. Encourage relaxation techniques and monitor."
            user_message = "You're experiencing some anxiety, which is completely normal. Let's explore some calming strategies."
        elif score < 15:
            severity = "Moderate Anxiety"
            urgency = "medium"
            mentor_guidance = "Moderate anxiety. Recommend counseling and anxiety management workshops."
            user_message = "Your anxiety is affecting you more than usual. Professional support can help you develop effective coping skills."
        else:
            severity = "Severe Anxiety"
            urgency = "high"
            mentor_guidance = "Severe anxiety. Immediate counselor referral needed."
            user_message = "You're experiencing significant anxiety. Professional help can provide relief and teach you powerful coping tools."
            
        full_data = {
            "user_safe": {
                "title": "Your Anxiety Assessment Results",
                "interpretation": user_message,
                "positive_reinforcement": "Managing anxiety is a skill that can be learned and improved. You're taking the right steps by checking in with yourself.",
                "recommendations": [
                    "Practice deep breathing: 4 counts in, hold 4, out 4",
                    "Maintain a consistent daily routine to reduce uncertainty",
                    "Limit caffeine and sugar intake",
                    "Try progressive muscle relaxation before bed"
                ],
                "coping_strategies": [
                    "Use the 5-4-3-2-1 grounding technique when anxious",
                    "Challenge anxious thoughts with evidence",
                    "Exercise for 30 minutes daily to reduce stress hormones",
                    "Practice mindfulness or meditation apps"
                ],
                "encouragement": "Anxiety doesn't define you. With the right support and tools, you can manage it effectively.",
                "when_to_seek_help": "If anxiety is interfering with your daily life, talking to a counselor can help." if score >= 5 else None
            },
            "mentor_view": {
                "student_status": severity,
                "guidance": mentor_guidance,
                "action_items": [
                    "Monitor for physical symptoms (headaches, fatigue)",
                    "Offer accommodations for test anxiety if needed",
                    "Check in about sleep quality and appetite",
                    "Recommend stress management workshops"
                ],
                "red_flags": ["Avoidance of classes", "Panic attacks", "Social withdrawal"] if score >= 10 else [],
                "support_suggestions": [
                    "Provide quiet space for exams if needed",
                    "Connect with campus wellness programs",
                    "Encourage peer support groups"
                ],
                "severity_indicator": urgency,
                "requires_counselor": score >= 5
            },
            "counsellor_detailed": {
                "score_range": "0-21 points (GAD-7 Standard)",
                "raw_score": score,
                "severity": severity,
                "urgency_level": urgency,
                "professional_help_recommended": score >= 5,
                "clinical_interpretation": f"Patient scored {score}/21 on GAD-7, indicating {severity.lower()}.",
                "risk_assessment": {
                    "panic_disorder_risk": "HIGH" if score >= 15 else "MODERATE" if score >= 10 else "LOW",
                    "functional_impairment": "Severe" if score >= 15 else "Moderate" if score >= 10 else "Mild to none",
                    "treatment_urgency": urgency
                },
                "treatment_recommendations": [
                    "CBT with exposure therapy" if score >= 10 else None,
                    "Consider anti-anxiety medication evaluation" if score >= 15 else None,
                    "Relaxation training and biofeedback",
                    "Regular monitoring (weekly sessions initially)" if score >= 10 else "Check-in in 4 weeks"
                ],
                "differential_considerations": [
                    "Rule out panic disorder",
                    "Assess for comorbid depression",
                    "Check for PTSD or trauma history",
                    "Medical causes (hyperthyroidism, cardiac issues)"
                ] if score >= 10 else []
            }
        }
    elif assessment_type == 'GHQ':
        severity = "Good" if score < 4 else "Distressed" if score < 12 else "Significantly Distressed"
        urgency = "low" if score < 4 else "medium" if score < 12 else "high"
        mentor_guidance = "Student showing good well-being." if score < 4 else "Student experiencing some distress. Monitor and support." if score < 12 else "Student significantly distressed. Counselor referral recommended."
        user_message = "Your overall well-being looks positive!" if score < 4 else "You're experiencing some challenges with well-being. This is a good time to prioritize self-care." if score < 12 else "You're going through a difficult period. Support is available and can help you feel better."
        
        full_data = {
            "user_safe": {
                "title": "Your General Health Questionnaire Results",
                "interpretation": user_message,
                "positive_reinforcement": "Taking time to check in with yourself is an important self-care practice.",
                "recommendations": [
                    "Maintain social connections - reach out to friends",
                    "Engage in activities you enjoy daily",
                    "Practice positive affirmations each morning",
                    "Establish a healthy work-life balance"
                ],
                "coping_strategies": [
                    "Keep a daily journal to process emotions",
                    "Spend time in nature - even 15 minutes helps",
                    "Practice gratitude - focus on positives",
                    "Set boundaries to protect your energy"
                ],
                "encouragement": "Your well-being matters. Small positive changes can lead to big improvements over time.",
                "when_to_seek_help": "If you're feeling persistently down, talking to someone can provide relief and clarity." if score >= 4 else None
            },
            "mentor_view": {
                "student_status": severity,
                "guidance": mentor_guidance,
                "action_items": [
                    "General check-in on academic progress",
                    "Monitor for changes in behavior or mood",
                    "Encourage wellness activities participation",
                    "Provide resources for stress management"
                ],
                "red_flags": ["Increased absences", "Declining performance", "Social isolation"] if score >= 4 else [],
                "support_suggestions": [
                    "Connect with student wellness programs",
                    "Recommend peer mentoring or buddy systems",
                    "Share campus mental health resources"
                ],
                "severity_indicator": urgency,
                "requires_counselor": score >= 4
            },
            "counsellor_detailed": {
                "score_range": "0-36 points (GHQ-12 Standard)",
                "raw_score": score,
                "severity": severity,
                "urgency_level": urgency,
                "professional_help_recommended": score >= 4,
                "clinical_interpretation": f"Patient scored {score} on GHQ, indicating {severity.lower()} psychological well-being.",
                "risk_assessment": {
                    "general_distress": "HIGH" if score >= 12 else "MODERATE" if score >= 4 else "LOW",
                    "functional_impairment": "Multiple life domains affected" if score >= 12 else "Some areas affected" if score >= 4 else "Minimal impact",
                    "treatment_urgency": urgency
                },
                "treatment_recommendations": [
                    "Comprehensive mental health evaluation" if score >= 12 else None,
                    "Individual counseling or therapy",
                    "Stress management interventions",
                    "Follow-up assessment in 2-4 weeks"
                ],
                "differential_considerations": [
                    "Screen for depression and anxiety disorders",
                    "Assess life stressors and major life events",
                    "Check for physical health issues contributing to distress"
                ] if score >= 4 else []
            }
        }
    
    return full_data

@celery.task
def sync_streak_to_db(user_id, streak_count):
    """Sync Redis streak count to database"""
    from database import db
    import app as flask_app
    from db_models import User
    with flask_app.app.app_context():
        user = User.query.get(user_id)
        if user:
            user.login_streak = streak_count
            user.last_streak_date = datetime.utcnow().date()
            db.session.commit()

def get_user_streak(r_streaks, user):
    """Get current streak count for a user (Try Redis, fallback to DB)"""
    count = r_streaks.get(f"streak_count:{user.id}")
    if count is not None:
        return int(count)
    return user.login_streak or 0

def update_user_streak(r_streaks, user):
    """Update user streak based on activity and sync to DB asynchronously"""
    user_id = user.id
    count_key = f"streak_count:{user_id}"
    last_key = f"streak_last_active:{user_id}"
    
    today = datetime.utcnow().date()
    last_active_raw = r_streaks.get(last_key)
    
    # If key doesn't exist in Redis, seed it from DB
    if not last_active_raw and user.last_streak_date:
        r_streaks.set(last_key, user.last_streak_date.strftime('%Y-%m-%d'))
        r_streaks.set(count_key, user.login_streak)
        last_active_raw = user.last_streak_date.strftime('%Y-%m-%d').encode()

    new_count = 1
    if last_active_raw:
        last_active = datetime.strptime(last_active_raw.decode(), '%Y-%m-%d').date()
        if last_active == today:
            return int(r_streaks.get(count_key) or 1)
        elif last_active == today - timedelta(days=1):
            new_count = r_streaks.incr(count_key)
        else:
            new_count = 1
            r_streaks.set(count_key, new_count)
    else:
        new_count = 1
        r_streaks.set(count_key, new_count)
        
    r_streaks.set(last_key, today.strftime('%Y-%m-%d'))
    
    # Sync to DB in background
    sync_streak_to_db.delay(user_id, new_count)
    
    return new_count

