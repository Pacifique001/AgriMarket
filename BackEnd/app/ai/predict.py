import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger("ai.predict")

# =====================================================
# CONFIGURATION
# =====================================================

DATASET_PATH = "app/ai/datasets/processed/demand_history.csv"


PRICE_MODEL_PATH = settings.PRICE_MODEL_PATH
DEMAND_MODEL_PATH = settings.DEMAND_MODEL_PATH
ENCODER_PATH = settings.ENCODER_PATH

PRICE_CHANGE_THRESHOLD = 0.03  # 3% movement threshold


# =====================================================
# UTILITY FUNCTIONS
# =====================================================

def classify_price_direction(current: float | None, previous: float | None) -> str:
    """
    Classifies price movement direction.
    """
    if current is None or previous is None or previous <= 0:
        return "STABLE"

    change = (current - previous) / previous

    if change > PRICE_CHANGE_THRESHOLD:
        return "UP"
    elif change < -PRICE_CHANGE_THRESHOLD:
        return "DOWN"

    return "STABLE"


def compute_confidence(n_samples: int, max_samples: int = 500) -> float:
    """
    Computes confidence score based on data availability.
    Range: 0.40 – 0.95
    """
    return round(
        min(0.95, 0.4 + (n_samples / max_samples) * 0.55),
        2
    )


# =====================================================
# CORE AI ENGINE
# =====================================================

class MarketPredictionEngine:
    """
    Unified AI Engine for:
    - Demand forecasting
    - Market price estimation
    - Trend classification
    """

    def __init__(self):
        self.price_model = self._load_model(
            PRICE_MODEL_PATH, "Price"
        )
        self.demand_model = self._load_model(
            DEMAND_MODEL_PATH, "Demand"
        )
        self.encoders = self._load_model(ENCODER_PATH, "Encoders")
        self.crop_encoder = self.encoders["crop"] if self.encoders and "crop" in self.encoders else None
        self.dataset = self._load_dataset()

    # -------------------------------------------------
    # MODEL LOADING
    # -------------------------------------------------
    def _load_model(self, path: str, name: str):
        if not path:
            logger.warning(f"{name} model path not configured")
            return None

        if os.path.exists(path):
            try:
                model = joblib.load(path)
                logger.info(f"{name} model loaded from {path}")
                return model
            except Exception as e:
                logger.error(f"Failed to load {name} model: {e}")
        else:
            logger.warning(f"{name} model not found at {path}")

        return None

    # -------------------------------------------------
    # DATASET LOADING
    # -------------------------------------------------
    def _load_dataset(self) -> pd.DataFrame:
        if os.path.exists(DATASET_PATH):
            try:
                df = pd.read_csv(DATASET_PATH)
                logger.info("Demand history dataset loaded")
                return df
            except Exception as e:
                logger.error(f"Failed to load dataset: {e}")

        logger.warning("Demand history dataset missing")
        return pd.DataFrame()

    # -------------------------------------------------
    # HISTORICAL PRICE PROXY
    # -------------------------------------------------
    def _historical_price_proxy(
        self,
        crop_id: int,
        region_id: int,
        month: int
    ) -> float | None:
        """
        Uses demand-weighted proxy when real prices are missing.
        """
        if self.dataset.empty:
            return None

        hist = self.dataset[
            (self.dataset["crop_id"] == crop_id) &
            (self.dataset["region_id"] == region_id) &
            (self.dataset["month"] == month)
        ]

        if hist.empty:
            return None

        if "price" in hist.columns and hist["price"].notna().any():
            return float(hist["price"].mean())

        # Proxy fallback
        hist = hist.dropna(subset=["market_signal", "quantity"])
        if hist.empty:
            return None

        return float(hist["market_signal"].sum() / max(hist["quantity"].sum(), 1))

    # -------------------------------------------------
    # MAIN PREDICTION METHOD
    # -------------------------------------------------

    def predict(
        self,
        crop_id: int,
        region_id: int,
        month: int | None = None
    ) -> dict:
        """
        Production-safe market inference.
        """
        if month is None:
            month = datetime.utcnow().month

        result = {
            "crop_id": crop_id,
            "region_id": region_id,
            "month": month,
        }

        # ---------------------------------------------
        # ENCODING
        # ---------------------------------------------
        if self.crop_encoder is None:
            logger.error(
                "Crop encoder not loaded. Returning fallback results.")
            crop_enc = crop_id
        else:
            try:
                crop_id_str = str(crop_id)
                if crop_id_str in self.crop_encoder.classes_:
                    crop_enc = self.crop_encoder.transform([crop_id_str])[0]
                else:
                    logger.error(
                        f"Crop encoding failed: crop_id {crop_id} not in encoder classes.")
                    crop_enc = crop_id  # fallback or handle as needed
            except Exception as e:
                logger.error(f"Crop encoding failed: {e}")
                crop_enc = crop_id

        # ---------------------------------------------
        # DEMAND PREDICTION (aligned with training)
        # ---------------------------------------------
        demand = None
        if self.demand_model is not None:
            try:
                X_d = pd.DataFrame(
                    [[crop_enc, month]],
                    columns=["crop_id_enc", "month"]
                )
                demand = float(self.demand_model.predict(X_d)[0])
                demand = max(0.0, demand)
            except Exception as e:
                logger.error(f"Demand inference failed: {e}")

        # ---------------------------------------------
        # PRICE ESTIMATION (ML first, fallback to proxy)
        # ---------------------------------------------
        estimated_price = None
        if self.price_model is not None and demand is not None:
            try:
                Xp = pd.DataFrame(
                    [[crop_enc, month, demand]],
                    columns=["crop_id_enc", "month", "quantity"]
                )
                estimated_price = float(self.price_model.predict(Xp)[0])
                estimated_price = max(0.0, estimated_price)
            except Exception as e:
                logger.error(f"Price inference failed: {e}")

        # Fallback to historical proxy if ML price not available
        if estimated_price is None:
            estimated_price = self._historical_price_proxy(
                crop_id, region_id, month
            )

        prev_month = 12 if month == 1 else month - 1
        previous_price = self._historical_price_proxy(
            crop_id, region_id, prev_month
        )

        price_direction = classify_price_direction(
            estimated_price, previous_price
        )

        # ---------------------------------------------
        # CONFIDENCE CALCULATION
        # ---------------------------------------------
        sample_count = 0
        if not self.dataset.empty:
            sample_count = len(
                self.dataset[
                    (self.dataset["crop_id"] == crop_id) &
                    (self.dataset["region_id"] == region_id)
                ]
            )

        confidence = compute_confidence(sample_count)

        # ---------------------------------------------
        # DEMAND PRESSURE (CONFIDENCE-GATED)
        # ---------------------------------------------
        demand_pressure = None
        if demand is not None and estimated_price is not None:
            demand_pressure = round(
                (demand / max(estimated_price, 1)) * confidence,
                2
            )

        # ---------------------------------------------
        # FINAL RESPONSE
        # ---------------------------------------------
        result.update({
            "predicted_demand_kg": demand,
            "estimated_price": estimated_price,
            "previous_price": previous_price,
            "price_direction": price_direction,
            "confidence": confidence,
            "demand_pressure": demand_pressure,
        })

        return result


# =====================================================
# GLOBAL SINGLETON (FASTAPI SAFE)
# =====================================================

market_predictor = MarketPredictionEngine()
