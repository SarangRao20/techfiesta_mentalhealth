import hashlib
import json
from datetime import datetime, timedelta
from flask import session

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

def generate_analysis(assessment_type, score):
    full_data = {}
    
    if assessment_type == 'PHQ-9':
        if score <= 4:
            primary_interpretation = "minimal or no depression symptoms"
            clinical_severity = "Minimal Depression"
            urgency = "low"
            help_rec = False
        elif score <= 9:
            primary_interpretation = "mild depression symptoms"
            clinical_severity = "Mild Depression"
            urgency = "low"
            help_rec = True
        elif score <= 14:
            primary_interpretation = "moderate depression symptoms"
            clinical_severity = "Moderate Depression"
            urgency = "medium"
            help_rec = True
        elif score <= 19:
            primary_interpretation = "moderately severe depression"
            clinical_severity = "Moderately Severe Depression"
            urgency = "high"
            help_rec = True
        else:
            primary_interpretation = "severe depression"
            clinical_severity = "Severe Depression"
            urgency = "high"
            help_rec = True

        full_data = {
            "user_safe": {
                "interpretation": f"Your PHQ-9 score of {score} indicates {primary_interpretation}. It's important to keep monitoring your mood and practicing self-care.",
                "recommendations": [
                    "Maintain a consistent sleep schedule",
                    "Engage in light physical activity daily",
                    "Practice mindfulness or deep breathing"
                ],
                "coping_strategies": [
                    "Break large tasks into smaller steps",
                    "Reach out to a trusted friend or family member",
                    "Limit time spent on social media"
                ]
            },
            "counsellor_detailed": {
                "score_range": "0-27 points",
                "severity_category": clinical_severity,
                "urgency_level": urgency,
                "professional_help_recommended": help_rec,
                "key_insights": [
                    f"Structural score: {score}",
                    "Suggests potential impact on cognitive functioning" if score > 10 else "Suggests stable functioning"
                ]
            }
        }
    elif assessment_type == 'GAD-7':
        if score < 5:
            severity = "Minimal Anxiety"
            urgency = "low"
        elif score < 10:
            severity = "Mild Anxiety"
            urgency = "low"
        elif score < 15:
            severity = "Moderate Anxiety"
            urgency = "medium"
        else:
            severity = "Severe Anxiety"
            urgency = "high"
            
        full_data = {
            "user_safe": {
                "interpretation": f"Your GAD-7 score of {score} suggests {severity.lower()}.",
                "recommendations": ["Deep breathing exercises", "Routine tracking"],
                "coping_strategies": ["5-4-3-2-1 technique", "Avoid excess caffeine"]
            },
            "counsellor_detailed": {
                "severity": severity,
                "urgency_level": urgency,
                "professional_help_recommended": score >= 5
            }
        }
    elif assessment_type == 'GHQ':
        severity = "Good" if score < 4 else "Distressed" if score < 12 else "Significantly Distressed"
        full_data = {
            "user_safe": {
                "interpretation": f"Your GHQ score of {score} suggests {severity.lower()} well-being.",
                "recommendations": ["Positive affirmations", "Social interaction"],
                "coping_strategies": ["Journaling", "Nature walks"]
            },
            "counsellor_detailed": {
                "severity": severity,
                "urgency_level": "low" if score < 4 else "medium" if score < 12 else "high",
                "professional_help_recommended": score >= 4
            }
        }
    
    return full_data

