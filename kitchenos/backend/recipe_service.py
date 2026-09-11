import os
from google import genai

def generate_recipe(item: str, spices: str, cuisine: str) -> dict:
    """
    Generates a unique, tailored recipe using Gemini based on the specific product, 
    cuisine style, and spice preferences.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        
        prompt = (
            f"Create a distinct, creative, and completely tailored {cuisine} recipe "
            f"that uses '{item}' as the star ingredient, incorporating '{spices}' seasoning. "
            f"Ensure the recipe highlights the unique texture and flavor profile of {item} "
            f"rather than using a generic template. Return the output in a clean format with:\n"
            "1. Unique Recipe Title\n"
            "2. Brief Description\n"
            "3. Specific Ingredients List\n"
            "4. Detailed Step-by-Step Instructions\n"
            "Keep it practical, delicious, and easy to follow."
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        if response and response.text:
            return {
                "recipe_text": response.text.strip(),
                "expiring_item": item,
                "selected_spices": spices,
                "selected_cuisine": cuisine
            }
    except Exception as e:
        print(f"Recipe generation error: {e}")

    # Tailored fallback recipe
    return {
        "recipe_text": f"Special {cuisine} {item} Dish\n\nPrep your fresh {item} and combine with {spices} seasoning. Cook thoroughly over medium heat until tender and aromatic. Serve warm and enjoy!",
        "expiring_item": item,
        "selected_spices": spices,
        "selected_cuisine": cuisine
    }