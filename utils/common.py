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
    if assessment_type == 'PHQ-9':
        if score <= 4:
            return {
                "interpretation": "Your PHQ-9 score of {} indicates minimal or no depression symptoms, which is excellent news! This suggests you're currently managing your mental health well and experiencing few or no significant depressive symptoms. This low score reflects good emotional regulation and psychological well-being.".format(score),
                "recommendations": [
                    "Continue maintaining your current healthy lifestyle and mental health practices",
                    "Keep up with regular self-care activities that bring you joy and relaxation",
                    "Maintain strong social connections and support networks",
                    "Practice preventive mental health care through regular check-ins with yourself",
                    "Consider sharing your successful coping strategies with others who might benefit",
                    "Stay aware of any changes in your mood or stress levels for early intervention"
                ],
                "coping_strategies": [
                    "Continue regular physical exercise - aim for at least 30 minutes of activity most days",
                    "Maintain a consistent sleep schedule with 7-9 hours of quality sleep nightly",
                    "Practice daily mindfulness, meditation, or deep breathing exercises",
                    "Engage in hobbies and activities that bring you fulfillment and purpose",
                    "Keep a gratitude journal to reinforce positive thinking patterns",
                    "Stay connected with friends and family through regular communication",
                    "Practice stress management techniques before challenging situations arise",
                    "Maintain a balanced diet rich in nutrients that support brain health"
                ],
                "detailed_breakdown": {
                    "score_range": "0-4 points",
                    "severity_category": "Minimal Depression",
                    "key_insights": [
                        "You demonstrate strong emotional resilience and coping abilities",
                        "Your current mental health practices are serving you well",
                        "You're likely experiencing good quality of life and functioning",
                        "This score suggests protective factors are working effectively"
                    ],
                    "warning_signs": [
                        "Sudden changes in sleep patterns or appetite",
                        "Increased irritability or mood swings",
                        "Loss of interest in previously enjoyable activities",
                        "Persistent feelings of sadness lasting more than two weeks"
                    ]
                },
                "professional_help_recommended": False,
                "urgency_level": "low"
            }
        elif score <= 9:
            return {
                "interpretation": "Your PHQ-9 score of {} indicates mild depression symptoms. While this suggests some challenges with mood, it's encouraging that you're seeking support and taking steps to understand your mental health. Mild depression is very treatable, and with the right strategies and support, you can feel significantly better.".format(score),
                "recommendations": [
                    "Track your mood daily using a journal or mood tracking app to identify patterns",
                    "Consider scheduling a consultation with a licensed mental health counselor or therapist",
                    "Engage in regular physical activity - even 20-30 minutes of walking can make a difference",
                    "Establish a consistent daily routine to provide structure and stability",
                    "Prioritize activities that previously brought you joy, even if they don't feel appealing right now",
                    "Practice good sleep hygiene and aim for consistent sleep/wake times",
                    "Consider joining a support group or online community for peer support",
                    "Limit alcohol consumption and avoid substances that can worsen depression"
                ],
                "coping_strategies": [
                    "Practice progressive muscle relaxation and deep breathing exercises for stress reduction",
                    "Maintain regular social activities, even when you don't feel like socializing",
                    "Focus on nutrient-rich foods including omega-3 fatty acids, complex carbs, and lean proteins",
                    "Try the '5-4-3-2-1' grounding technique when feeling overwhelmed",
                    "Engage in creative activities like art, music, or writing for emotional expression",
                    "Set small, achievable daily goals to build momentum and sense of accomplishment",
                    "Practice mindful movement like yoga or tai chi",
                    "Spend time in nature when possible, as outdoor exposure can boost mood"
                ],
                "detailed_breakdown": {
                    "score_range": "5-9 points",
                    "severity_category": "Mild Depression",
                    "key_insights": [
                        "You may experience low mood, reduced energy, or changes in sleep/appetite",
                        "Symptoms are noticeable but don't severely impair daily functioning",
                        "Early intervention can prevent progression to more severe depression",
                        "Many people with mild depression respond well to lifestyle changes and therapy"
                    ],
                    "warning_signs": [
                        "Symptoms persisting for more than 2 weeks without improvement",
                        "Increasing difficulty with work, school, or relationship responsibilities",
                        "Thoughts of self-harm or worthlessness",
                        "Complete loss of interest in all previously enjoyable activities"
                    ]
                },
                "professional_help_recommended": True,
                "urgency_level": "low"
            }
        elif score <= 14:
            return {
                "interpretation": "Your PHQ-9 score of {} indicates moderate depression symptoms. This level suggests that depression is having a noticeable impact on your daily life and functioning. The good news is that moderate depression is highly treatable with professional support, and many people see significant improvement with the right treatment approach.".format(score),
                "recommendations": [
                    "Schedule an appointment with a licensed mental health professional within the next 1-2 weeks",
                    "Consider cognitive-behavioral therapy (CBT) or other evidence-based therapeutic approaches",
                    "Discuss your symptoms with your primary healthcare provider to rule out medical causes",
                    "Create a structured daily routine with regular sleep, meals, and activities",
                    "Ask trusted friends or family members for additional support during this time",
                    "Consider joining a depression support group or online community",
                    "Keep a mood diary to track symptoms and identify triggers",
                    "Discuss medication options with a psychiatrist if therapy alone isn't sufficient"
                ],
                "coping_strategies": [
                    "Develop and maintain a consistent daily routine, even when motivation is low",
                    "Practice progressive muscle relaxation and guided meditation for 10-20 minutes daily",
                    "Stay connected with your support system - reach out even when you don't feel like it",
                    "Break large tasks into smaller, manageable steps to avoid feeling overwhelmed",
                    "Engage in 'behavioral activation' - do activities that used to bring joy, even if they don't feel appealing",
                    "Practice the 'STOP' technique: Stop, Take a breath, Observe your thoughts, Proceed mindfully",
                    "Use the '3-3-3 rule' when anxious: name 3 things you see, 3 sounds you hear, move 3 parts of your body",
                    "Focus on basic self-care: regular showers, nutritious meals, and adequate sleep",
                    "Limit news consumption and social media if they increase negative feelings",
                    "Try light therapy, especially during winter months or if you spend lots of time indoors"
                ],
                "detailed_breakdown": {
                    "score_range": "10-14 points",
                    "severity_category": "Moderate Depression",
                    "key_insights": [
                        "Depression symptoms are significantly impacting your daily functioning and quality of life",
                        "You may experience persistent low mood, fatigue, difficulty concentrating, or changes in sleep/appetite",
                        "This level typically requires professional intervention for optimal recovery",
                        "With proper treatment, most people with moderate depression see substantial improvement within 6-12 weeks",
                        "Combination therapy (counseling + lifestyle changes) often shows the best outcomes"
                    ],
                    "warning_signs": [
                        "Symptoms worsening rapidly or lasting more than 2 weeks without any improvement",
                        "Increasing thoughts of self-harm, suicide, or feeling that life isn't worth living",
                        "Complete inability to function at work, school, or in relationships",
                        "Significant changes in eating patterns (eating much more or much less than usual)",
                        "Sleeping much more or much less than normal for extended periods",
                        "Increased use of alcohol or drugs to cope with feelings"
                    ]
                },
                "professional_help_recommended": True,
                "urgency_level": "medium"
            }
        elif score <= 19:
            return {
                "interpretation": "Your PHQ-9 score suggests moderately severe depression. We recommend seeking professional help.",
                "recommendations": [
                    "Seek immediate professional help",
                    "Consider medication evaluation",
                    "Regular therapy sessions recommended"
                ],
                "coping_strategies": [
                    "Focus on basic self-care",
                    "Reach out to trusted friends/family",
                    "Practice grounding techniques"
                ],
                "professional_help_recommended": True,
                "urgency_level": "high"
            }
        else:
            return {
                "interpretation": "Your PHQ-9 score suggests severe depression. We strongly recommend seeking professional help as soon as possible.",
                "recommendations": [
                    "Seek immediate professional help",
                    "Contact crisis helpline if needed",
                    "Consider emergency support"
                ],
                "coping_strategies": [
                    "Prioritize safety and basic needs",
                    "Stay with trusted support person",
                    "Use crisis resources when needed"
                ],
                "professional_help_recommended": True,
                "urgency_level": "high"
            }
    elif assessment_type == 'GAD-7':
        if score < 5:
            return {
                "interpretation": "Your GAD-7 score suggests minimal anxiety. This is great news!",
                "recommendations": [
                    "Continue current coping strategies",
                    "Maintain healthy stress management",
                    "Practice preventive self-care"
                ],
                "coping_strategies": [
                    "Regular relaxation exercises",
                    "Maintain work-life balance",
                    "Practice deep breathing"
                ],
                "professional_help_recommended": False,
                "urgency_level": "low"
            }
        elif score < 10:
            return {
                "interpretation": "Your GAD-7 score suggests mild anxiety. Consider monitoring your anxiety levels.",
                "recommendations": [
                    "Track anxiety triggers",
                    "Learn stress management techniques",
                    "Consider counseling if persistent"
                ],
                "coping_strategies": [
                    "Practice mindfulness meditation",
                    "Regular physical exercise",
                    "Limit caffeine intake"
                ],
                "professional_help_recommended": True,
                "urgency_level": "low"
            }
        elif score < 15:
            return {
                "interpretation": "Your GAD-7 score suggests moderate anxiety. You may benefit from professional support.",
                "recommendations": [
                    "Seek professional counseling",
                    "Consider anxiety management therapy",
                    "Discuss with healthcare provider"
                ],
                "coping_strategies": [
                    "Practice progressive muscle relaxation",
                    "Use grounding techniques",
                    "Maintain regular sleep schedule"
                ],
                "professional_help_recommended": True,
                "urgency_level": "medium"
            }
        else:
            return {
                "interpretation": "Your GAD-7 score suggests severe anxiety. We recommend seeking professional help.",
                "recommendations": [
                    "Seek immediate professional help",
                    "Consider medication evaluation",
                    "Regular therapy sessions"
                ],
                "coping_strategies": [
                    "Focus on breathing exercises",
                    "Use crisis coping techniques",
                    "Stay connected with support system"
                ],
                "professional_help_recommended": True,
                "urgency_level": "high"
            }
    elif assessment_type == 'GHQ':
        if score < 4:
            return {
                "interpretation": "Your GHQ score suggests good psychological well-being.",
                "recommendations": [
                    "Continue healthy lifestyle",
                    "Maintain current wellness practices",
                    "Regular self-assessment"
                ],
                "coping_strategies": [
                    "Keep balanced lifestyle",
                    "Regular social activities",
                    "Stress prevention techniques"
                ],
                "professional_help_recommended": False,
                "urgency_level": "low"
            }
        elif score < 12:
            return {
                "interpretation": "Your GHQ score suggests some psychological distress. Consider monitoring your well-being.",
                "recommendations": [
                    "Monitor stress levels",
                    "Consider counseling support",
                    "Practice self-care activities"
                ],
                "coping_strategies": [
                    "Regular exercise routine",
                    "Mindfulness practices",
                    "Social support engagement"
                ],
                "professional_help_recommended": True,
                "urgency_level": "medium"
            }
        else:
            return {
                "interpretation": "Your GHQ score suggests significant psychological distress. We recommend seeking professional support.",
                "recommendations": [
                    "Seek professional counseling",
                    "Consider comprehensive assessment",
                    "Regular mental health check-ins"
                ],
                "coping_strategies": [
                    "Focus on stress reduction",
                    "Practice relaxation techniques",
                    "Build strong support network"
                ],
                "professional_help_recommended": True,
                "urgency_level": "high"
            }
