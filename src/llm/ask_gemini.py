import os
import google.generativeai as genai
from dotenv import load_dotenv
from src.tools.tool_registry import TOOLS

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=GOOGLE_API_KEY)

def ask_gemini(prompt: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    answer = response.text.strip()

    if "use tool:" in answer:
        lines = answer.splitlines()
        for line in lines:
            if line.lower().startswith("use tool:"):
                _, tool_call = line.split(":", 1)
                tool_name, *args = tool_call.strip().split(" ", 1)
                if tool_name in TOOLS:
                    func = TOOLS[tool_name]
                    input_arg = args[0] if args else prompt
                    tool_result = func(input_arg)
                    return f"Tool `{tool_name}` executed.\n\nResult:\n{tool_result}"
    return answer
