# Project Prompt & AI Logic - Nivana

This document outlines the operational logic and specialized system prompts that drive the AI capabilities of Nivana.

## 1. Core AI System Prompt

The primary conversational logic is governed by a strict system prompt designed to maintain clinical boundaries while providing high-quality support.

### System Prompt Template

```text
You are a compassionate mental health support chatbot. Your role is to:
1. Provide emotional support and active listening.
2. Suggest coping strategies and relaxation techniques.
3. Recommend mental health assessments when appropriate (PHQ-9, GAD-7, GHQ).
4. Encourage professional help when needed.
5. NEVER provide medical diagnoses or treatment advice.
6. If someone expresses suicidal thoughts, provide crisis resources and encourage immediate professional help.

Be empathetic, supportive, and non-judgmental. Keep responses conversational and helpful.
```

## 2. Crisis Detection Logic

Nivana uses a dual-layer approach for safety:

### Layer 1: Literal Keyword Matching

The system checks for a set of high-risk keywords in every user message:

- **English**: `suicide`, `kill myself`, `end my life`, `self harm`, `hopeless`, `worthless`.
- **Hindi (Romanized)**: `marna hai`, `jaan deni hai`, `maut`.

### Layer 2: AI Contextual Detection

If keywords are detected, the system prompt is dynamically updated:
`"IMPORTANT: The user has expressed concerning thoughts. Prioritize their safety and provide crisis resources."`

## 3. Assessment Analysis Workflow

When a user completes an assessment (e.g., PHQ-9), the following specialized prompt is sent to `gemini-1.5-pro`:

### Analysis Prompt

```text
Analyze the following mental health assessment results and provide personalized recommendations:

Assessment Type: {assessment_type}
Score: {score}
Responses: {responses_json}

Please provide:
1. An interpretation of the score.
2. Specific, actionable recommendations.
3. Suggested coping strategies.
4. Whether professional consultation is recommended.

Respond in JSON format with fields: interpretation, recommendations, coping_strategies, professional_help_recommended, urgency_level.
```

## 4. Voice Enhancement Logic

For voice output, Nivana uses a "Voice Refinement" prompt to ensure the text sounds natural when spoken by an Indian accent via Sarvam AI.

- **Objective**: Remove markdown formatting (bolding, lists) that sounds jarring when read aloud.
- **Tone**: Warm and steady, specifically tuned for Indian English/Hindi audiences.

---

## 5. Fallback Mechanisms

In cases of API latency or failure, Nivana triggers a `get_fallback_response()` logic based on local rule-matching:

- **Anxiety/Panic**: Triggers grounding exercises (e.g., 4-7-8 breathing).
- **Depression**: Triggers behavioral activation suggestions (e.g., "Small steps matter").
- **Greetings**: Standard warm introduction.
