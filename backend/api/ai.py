import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def parse_tasks(text):
    prompt = f"""
You are a task extraction assistant. Extract all tasks, assignments, exams, and deadlines from the text below.

STRICT RULES:
1. Return ONLY a valid JSON array. No explanation. No markdown. No code blocks.
2. Each object must have exactly these fields:
   - "title": string (name of the task)
   - "deadline": string in "YYYY-MM-DD" format ONLY
   - "weight": integer between 1-10 (10=Final Exam, 7=Major Assignment, 4=Quiz, 2=Reading)
   - "course": string (subject name, or "General" if unknown)
3. If year is missing, use 2026.
4. If no date found, use "2026-12-31".

EXAMPLE OUTPUT FORMAT:
[
  {{"title": "Math Final Exam", "deadline": "2026-05-15", "weight": 10, "course": "Mathematics"}},
  {{"title": "History Essay", "deadline": "2026-04-20", "weight": 7, "course": "History"}}
]

TEXT TO EXTRACT FROM:
{text}

JSON ARRAY OUTPUT:
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a JSON-only response bot. You never explain anything. You only return valid JSON arrays."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.1  # Lower = more deterministic/strict
        )

        result = response.choices[0].message.content.strip()
        
       

        # Remove markdown code blocks if present
        if result.startswith("```"):
            lines = result.split("\n")
            # Remove first line (```json) and last line (```)
            lines = [l for l in lines if not l.startswith("```")]
            result = "\n".join(lines)

        # Find JSON array boundaries
        start = result.find('[')
        end = result.rfind(']') + 1

        if start == -1 or end == 0:
            print("NO JSON ARRAY FOUND in response")
            return []

        json_str = result[start:end]
        parsed = json.loads(json_str)
        
        print("PARSED SUCCESSFULLY:", len(parsed), "tasks")
        return parsed

    except json.JSONDecodeError as e:
        print("JSON PARSE ERROR:", e)
        print("Attempted to parse:", result)
        return []
    except Exception as e:
        print("AI ERROR:", e)
        return []