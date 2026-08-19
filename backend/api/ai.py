# backend/api/ai.py - Updated with better prompt & error handling

import os
from groq import Groq
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import re

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def parse_tasks(text):
    """
    Extract tasks from syllabus text using Groq AI.
    Returns list of task dictionaries.
    """
    if not text or len(text.strip()) < 10:
        print("⚠️ Text too short for parsing")
        return []

    print(f"📝 Parsing text ({len(text)} characters)...")

    # Get current year for fallback
    current_year = datetime.now().year
    
    prompt = f"""
You are an expert academic task extractor. Extract ALL tasks, assignments, exams, quizzes, labs, and deadlines from the text below.

CURRENT YEAR: {current_year}

TEXT TO ANALYZE:
{text}

EXTRACTION RULES:
1. Find ANY mention of: exam, test, quiz, assignment, lab, report, project, submission, due, deadline, presentation
2. Look for date patterns:
   - "20 August", "August 20", "Aug 20", "20 Aug"
   - "20/08/{current_year}", "08/20/{current_year}", "20-08-{current_year}"
   - "next Friday", "in 3 days", "by end of week"
   - "Week 5", "Module 3" (use date + 7 days from today)
3. Extract task names even if dates are approximate
4. If no year mentioned, assume {current_year}
5. If no date found, use 7 days from today

WEIGHT GUIDELINES:
- 10: Final Exam, Capstone Project
- 8-9: Major Exam, Midterm
- 6-7: Major Assignment, Lab Report, Project Submission
- 4-5: Quiz, Presentation, Minor Assignment
- 2-3: Reading, Homework, Discussion Post

RETURN ONLY VALID JSON in this exact format:
[
  {{
    "title": "Clear task name",
    "deadline": "YYYY-MM-DD",
    "weight": 7,
    "course": "Subject name"
  }}
]

EXAMPLES FROM TEXT:
- "MATH FINAL EXAM DAY 20 AUGUST" → {{"title": "Math Final Exam", "deadline": "{current_year}-08-20", "weight": 10, "course": "Mathematics"}}
- "Physics Lab Report due next Friday" → {{"title": "Physics Lab Report", "deadline": "{(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')}", "weight": 6, "course": "Physics"}}
- "CS Assignment 3 - Week 5" → {{"title": "CS Assignment 3", "deadline": "{(datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')}", "weight": 7, "course": "Computer Science"}}

If you find NO tasks, return empty array: []

NOW EXTRACT FROM THE TEXT ABOVE. RETURN ONLY JSON ARRAY:
"""

    try:
        print("🤖 Sending request to Groq API...")
        
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a JSON-only task extractor. Return ONLY valid JSON array. No explanation. No markdown. No code blocks."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.1,  # Lower = more deterministic/strict
            max_tokens=2000,
        )

        result = response.choices[0].message.content.strip()
        print(f"🤖 AI Response (first 200 chars): {result[:200]}...")

        # Remove markdown code blocks if present
        if result.startswith("```"):
            lines = result.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            result = "\n".join(lines).strip()
            print("🧹 Removed markdown code blocks")

        # Find JSON array boundaries
        start = result.find('[')
        end = result.rfind(']') + 1

        if start == -1 or end == 0:
            print("⚠️ NO JSON ARRAY FOUND in response")
            print("Full response:", result)
            return []

        json_str = result[start:end]
        parsed = json.loads(json_str)
        
        if not isinstance(parsed, list):
            print("⚠️ Response is not a list:", type(parsed))
            return []
        
        print(f"✅ PARSED SUCCESSFULLY: {len(parsed)} tasks")
        
        # Validate and clean each task
        cleaned_tasks = []
        for i, task in enumerate(parsed):
            if not isinstance(task, dict):
                print(f"⚠️ Task {i} is not a dict, skipping")
                continue
            
            try:
                cleaned_task = {
                    "title": str(task.get("title", "Untitled Task")).strip(),
                    "deadline": fix_year(task.get("deadline", ""), current_year),
                    "weight": int(task.get("weight", 5)),
                    "course": str(task.get("course", "General")).strip().title()
                }
                
                # Validate weight
                cleaned_task["weight"] = max(1, min(10, cleaned_task["weight"]))
                
                cleaned_tasks.append(cleaned_task)
                print(f"  ✓ Task {i+1}: {cleaned_task['title']} | {cleaned_task['deadline']} | Weight: {cleaned_task['weight']}")
                
            except Exception as e:
                print(f"⚠️ Error cleaning task {i}: {e}")
                continue
        
        print(f"✅ Returning {len(cleaned_tasks)} cleaned tasks")
        return cleaned_tasks

    except json.JSONDecodeError as e:
        print("❌ JSON PARSE ERROR:", e)
        print("Attempted to parse:", result[:500])
        return []
    except Exception as e:
        print("❌ AI ERROR:", e)
        import traceback
        traceback.print_exc()
        return []


def fix_year(date_str, current_year=None):
    """
    Ensure date has correct year and is in YYYY-MM-DD format.
    """
    if not date_str:
        return (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    
    date_str = str(date_str).strip()
    
    # If already YYYY-MM-DD format
    if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            if dt.year < current_year or dt.year > current_year + 2:
                dt = dt.replace(year=current_year)
            return dt.strftime('%Y-%m-%d')
        except:
            pass
    
    # Try parsing various formats
    current_year = current_year or datetime.now().year
    
    date_formats = [
        '%Y-%m-%d',      # 2025-08-20
        '%d-%m-%Y',      # 20-08-2025
        '%m-%d-%Y',      # 08-20-2025
        '%d/%m/%Y',      # 20/08/2025
        '%m/%d/%Y',      # 08/20/2025
        '%d %B %Y',      # 20 August 2025
        '%B %d %Y',      # August 20 2025
        '%d %b %Y',      # 20 Aug 2025
        '%b %d %Y',      # Aug 20 2025
        '%d %B',         # 20 August (no year)
        '%B %d',         # August 20 (no year)
        '%d %b',         # 20 Aug (no year)
        '%b %d',         # Aug 20 (no year)
    ]
    
    for fmt in date_formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.year == 1900:  # No year in format
                dt = dt.replace(year=current_year)
            elif dt.year < current_year:
                dt = dt.replace(year=current_year)
            return dt.strftime('%Y-%m-%d')
        except:
            continue
    
    # Default to 7 days from now
    default_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    print(f"⚠️ Could not parse date '{date_str}', using default: {default_date}")
    return default_date


def weight_to_priority(weight):
    """Convert 1-10 weight to priority label"""
    try:
        w = int(weight)
        if w >= 8:
            return "high"
        elif w >= 5:
            return "medium"
        else:
            return "low"
    except:
        return "medium"