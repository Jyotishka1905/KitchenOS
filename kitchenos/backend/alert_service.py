import os
import requests
from google import genai

def generate_alert_message(expiring_items: list[dict]) -> str:
    """
    Generates a natural, friendly, and urgent push notification message 
    using the modern Google GenAI SDK based on the user's expiring pantry inventory.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("No GEMINI_API_KEY environment variable set.")

        client = genai.Client(api_key=api_key)

        # Format the items with their remaining days for context
        item_list = "\n".join(
            f"- {item['name']} ({item['quantity']} {item['unit']}), expires in {item['days_left']} day(s)"
            if 'days_left' in item else f"- {item['name']}"
            for item in expiring_items
        )

        prompt = (
            "You are a friendly kitchen assistant. Write ONE short push notification "
            "(under 35 words, no more than one emoji) telling the user these pantry "
            "items are expiring soon, highlighting the most urgent ones, and nudging them "
            "to use them up:\n\n"
            f"{item_list}"
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"Gemini alert generation error: {e}")

    # Fallback message if generation fails or API key is missing
    names = ", ".join(item['name'] for item in expiring_items)
    return f"🚨 KitchenOS Alarm: Items expiring soon: {names}. Check your pantry!"

def send_push_alert(topic: str, message: str):
    """
    Dispatches the notification via ntfy.sh to trigger an instant push notification with sound.
    """
    try:
        url = f"https://ntfy.sh/{topic}"
        requests.post(
            url,
            data=message.encode("utf-8"),
            headers={
                "Title": "🚨 KitchenOS Expiry Alarm",
                "Priority": "high",
                "Tags": "warning,alarm"
            }
        )
    except Exception as e:
        print(f"Push alert dispatch error: {e}")

def dispatch_expiry_alert(expiring_items: list[dict]):
    """
    Orchestrates Gemini generation and push notification dispatch.
    """
    if not expiring_items:
        return

    # Generate smart alert text
    alert_message = generate_alert_message(expiring_items)
    print(alert_message)

    # Use a default topic from environment variables, or fallback to a shared demo topic
    topic = os.getenv("NTFY_TOPIC", "kitchenos-default-alerts")
    send_push_alert(topic, alert_message)