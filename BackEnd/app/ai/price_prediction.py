import joblib
import os
import numpy as np
import logging
from datetime import datetime
from app.core.config import settings

# Setup logger for AI monitoring
logger = logging.getLogger("price_prediction")

class PricePredictionEngine:
    """
    PricePredictionEngine handles the loading of the trained scikit-learn model
    and performs real-time price inference for the marketplace.
    """
    def __init__(self):
        self.model = self._load_model()
        # Fallback price if the model is not found or fails
        self.default_price = 250.0

    def _load_model(self):
        """
        Loads the pickled model from the filesystem using the path 
        defined in the central config.
        """
        model_path = settings.PRICE_MODEL_PATH
        if os.path.exists(model_path):
            try:
                # joblib is used for efficiency with large numpy arrays/models
                model = joblib.load(model_path)
                logger.info(f"AI Model loaded successfully from {model_path}")
                return model
            except Exception as e:
                logger.error(f"Failed to load AI model: {e}")
                return None
        else:
            logger.warning(
                f"AI model file not found at {model_path}. "
                "The system will operate using heuristic fallbacks."
            )
            return None

    def predict(self, crop_id: int, district_id: int) -> float:
        """
        Performs real-time inference using the loaded model.

        Parameters:
            crop_id (int): The encoded ID representing the crop type.
            district_id (int): The encoded ID representing the district.

        Returns:
            float: The predicted market price per Kilogram (RWF).
        """
        # Feature extraction: The model was trained on [crop_id, district_id, month]
        current_month = datetime.now().month

        if self.model is None:
            # SAFETY FALLBACK: If the model hasn't been trained or failed to load,
            # we provide a baseline price to ensure the user experience isn't broken.
            return self.default_price

        # Prepare the feature vector for scikit-learn (expects a 2D array)
        features = np.array([[crop_id, district_id, current_month]])

        try:
            # Perform prediction
            prediction = self.model.predict(features)
            
            # Extract the float value from the numpy array result
            result = float(prediction[0])
            
            # Post-processing: Prices cannot be negative
            return max(0.0, result)

        except Exception as e:
            logger.error(f"Inference Error: {e}")
            # Final fallback in case of prediction failure
            return self.default_price

# Global Singleton Instance
# By instantiating here, the model is loaded into RAM once upon server startup.
# This prevents expensive disk I/O operations during every API request.
predictor = PricePredictionEngine()