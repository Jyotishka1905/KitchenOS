import os
from google import genai

def generate_upcycle_remedy(item: str, category: str) -> dict:
    """
    Generates a unique, specific, and creative upcycling or composting guide using Gemini 
    tailored precisely to the given ingredient and category.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        
        prompt = (
            f"Provide a completely unique, specific, and creative upcycling, composting, "
            f"skincare, or household reuse guide specifically for the exact kitchen item: '{item}' "
            f"belonging to the category '{category}'. Do NOT give a generic template. "
            "Return the output in a clean format with:\n"
            "1. Specific Guide Title\n"
            "2. Brief Description of why this works for this specific item\n"
            "3. Step-by-Step Instructions (numbered)\n"
            "Keep it concise, practical, and safe for home use."
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        if response and response.text:
            return {
                "title": f"Upcycle Guide for {item}",
                "guide_text": response.text.strip(),
                "item": item,
                "category": category,
                "icon": "♻️"
            }
    except Exception as e:
        print(f"Upcycle generation error: {e}")

    # Tailored fallback if generation fails
    return {
        "title": f"Eco-Reuse Guide for {item}",
        "guide_text": f"1. Inspect your {item} ({category}).\n2. Prepare it by washing or chopping depending on use.\n3. Utilize in DIY plant fertilizer infusion or standard garden composting.",
        "item": item,
        "category": category,
        "icon": "♻️"
    }