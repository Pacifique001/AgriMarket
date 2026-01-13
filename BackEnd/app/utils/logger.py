import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime

# 1. Define Log Directory
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# 2. Define Log Formatting
# Includes timestamp, logger name, log level, and the specific line of code
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logging():
    """
    Initializes the global logging configuration for the FastAPI application.
    Configures both Console output and Rotating File storage.
    """
    
    # Base configuration for the root logger
    logging.basicConfig(
        level=logging.INFO,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
        handlers=[
            # A. Console Handler: Shows logs in terminal/docker logs
            logging.StreamHandler(sys.stdout),
            
            # B. File Handler: Saves all logs to a file (Max 5MB per file, keeps 5 backups)
            RotatingFileHandler(
                os.path.join(LOG_DIR, "app.log"),
                maxBytes=5*1024*1024, 
                backupCount=5
            )
        ]
    )

    # 3. Create Specialized Loggers for specific system modules
    
    # AI Logger: Tracks model loading, inference times, and predictions
    ai_logger = logging.getLogger("ai_engine")
    ai_logger.addHandler(RotatingFileHandler(
        os.path.join(LOG_DIR, "ai.log"), maxBytes=2*1024*1024, backupCount=3
    ))

    # Security Logger: Tracks failed logins and unauthorized API attempts
    security_logger = logging.getLogger("security")
    security_logger.addHandler(RotatingFileHandler(
        os.path.join(LOG_DIR, "security.log"), maxBytes=2*1024*1024, backupCount=10
    ))

    # SMS Logger: Tracks outgoing messages and gateway responses
    sms_logger = logging.getLogger("sms")
    sms_logger.addHandler(RotatingFileHandler(
        os.path.join(LOG_DIR, "sms.log"), maxBytes=1*1024*1024, backupCount=2
    ))

    logging.info("--- Logging System Initialized ---")

# --- Specialized Logger Instances for easy import ---

def get_ai_logger():
    """Returns the logger dedicated to AI and Machine Learning events."""
    return logging.getLogger("ai_engine")

def get_security_logger():
    """Returns the logger dedicated to Authentication and Security events."""
    return logging.getLogger("security")

def get_sms_logger():
    """Returns the logger dedicated to SMS Gateway and Notifications."""
    return logging.getLogger("sms")