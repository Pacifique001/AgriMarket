import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from app.core.config import settings
from app.utils.logger import get_sms_logger

# Use the specialized SMS logger
logger = get_sms_logger()

def normalize_phone_number(phone: str) -> str:
    """
    Ensures phone numbers are in E.164 format (+250...).
    Rwandan numbers typically start with 07... or 7...
    """
    clean_phone = "".join(filter(str.isdigit, phone))
    
    # Example for Rwanda (+250)
    if clean_phone.startswith("07"):
        return f"+250{clean_phone[1:]}"
    elif clean_phone.startswith("7"):
        return f"+250{clean_phone}"
    elif clean_phone.startswith("250"):
        return f"+{clean_phone}"
    
    # If it already has a plus, return as is
    if phone.startswith("+"):
        return phone
        
    return f"+{clean_phone}"

def send_sms(to_phone: str, message: str) -> bool:
    """
    Sends an SMS using the Twilio REST API.
    
    Args:
        to_phone: Recipient phone number.
        message: Text content (Keep under 160 chars for 1 credit).
        
    Returns:
        bool: True if sent successfully, False otherwise.
    """
    # 1. Check if Twilio is configured
    if not settings.TWILIO_ACCOUNT_SID or "ACxxx" in settings.TWILIO_ACCOUNT_SID:
        logger.error("Twilio SID not configured. SMS not sent.")
        # In development, we print to console so you can still see the code
        print(f"\n[DEVELOPMENT SMS to {to_phone}]: {message}\n")
        return False

    try:
        # 2. Initialize Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # 3. Format Number
        formatted_number = normalize_phone_number(to_phone)
        
        # 4. Dispatch SMS
        response = client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM_NUMBER,
            to=formatted_number
        )
        
        logger.info(f"SMS Sent Successfully. SID: {response.sid} | To: {formatted_number}")
        return True

    except TwilioRestException as e:
        logger.error(f"Twilio Error: {e.msg} (Code: {e.code}) | To: {to_phone}")
        return False
    except Exception as e:
        logger.error(f"Unexpected SMS failure: {str(e)} | To: {to_phone}")
        return False

def send_bulk_sms(phone_numbers: list[str], message: str):
    """
    Utility for broadcasting market alerts to multiple farmers.
    """
    results = {"success": 0, "failed": 0}
    for phone in phone_numbers:
        success = send_sms(phone, message)
        if success:
            results["success"] += 1
        else:
            results["failed"] += 1
    return results