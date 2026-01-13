import joblib
import os
import numpy as np
import logging
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger("demand_forecast")

class DemandForecastEngine:
    """
    AI Engine for predicting future market demand.
    Loads a pre-trained Regression model to forecast the total quantity 
    (KG) of a crop expected to be purchased in a given area.
    """
    def __init__(self):
        self.model = self._load_model()
        # Fallback demand levels if model is unavailable
        self.default_demand = {
            "high": 5000.0,
            "medium": 2000.0,
            "low": 500.0
        }

    def _load_model(self):
        """
        Loads the pickled model from the path defined in settings.
        """
        if os.path.exists(settings.DEMAND_MODEL_PATH):
            try:
                # We use joblib for efficient loading of scikit-learn models
                return joblib.load(settings.DEMAND_MODEL_PATH)
            except Exception as e:
                logger.error(f"Error loading AI Demand Model: {e}")
                return None
        logger.warning("Demand model file not found. System will use heuristic fallbacks.")
        return None

    def predict(self, crop_id: int, district_id: int, month: int = None) -> float:
        """
        Predicts the expected volume of demand in KG.
        
        Args:
            crop_id: The encoded ID of the crop (e.g., 0 for Maize)
            district_id: The encoded ID of the district (e.g., 10 for Musanze)
            month: Optional month (1-12). Defaults to the current month.
            
        Returns:
            Expected demand in KG (float).
        """
        if month is None:
            month = datetime.now().month

        if self.model is None:
            # Logic fallback: Seasonality-based heuristics for Rwanda
            # e.g., Maize demand is higher in harvest months (July/August)
            if crop_id == 0:  # Maize
                return self.default_demand["high"] if month in [7, 8] else self.default_demand["medium"]
            return self.default_demand["medium"]

        # Features used for training: [crop_id, district_id, month]
        features = np.array([[crop_id, district_id, month]])
        
        try:
            prediction = self.model.predict(features)
            # Ensure we don't return negative demand
            return max(0.0, float(prediction[0]))
        except Exception as e:
            logger.error(f"Prediction error in DemandForecastEngine: {e}")
            return self.default_demand["medium"]

# Global instance for the DemandService to import
demand_predictor = DemandForecastEngine()