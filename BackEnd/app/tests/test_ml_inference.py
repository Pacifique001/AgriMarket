from pathlib import Path

import pytest

from app.ai.predict import MarketPredictionEngine


TEST_ROOT = Path(__file__).resolve().parents[2]
GOLDEN_DATASET_PATH = TEST_ROOT / "app" / "ai" / \
    "datasets" / "processed" / "demand_history.csv"


class DummyEncoder:
    def __init__(self, classes_):
        self.classes_ = classes_

    def transform(self, items):
        # map first class index
        return [self.classes_.index(items[0]) if items[0] in self.classes_ else 0]


class DummyModel:
    def __init__(self, value):
        self._value = value

    def predict(self, X):
        # return same value regardless of X
        return [self._value for _ in range(len(X))]


def make_engine_with_dummies(monkeypatch):
    # Patch instance methods that load models/dataset
    monkeypatch.setattr(MarketPredictionEngine,
                        '_load_model', lambda self, p, n: None)
    monkeypatch.setattr(MarketPredictionEngine,
                        '_load_dataset', lambda self: None)

    # Create engine and then inject dummy attributes
    engine = MarketPredictionEngine()
    engine.demand_model = DummyModel(100.0)
    engine.price_model = DummyModel(200.0)
    engine.encoders = {'crop': DummyEncoder(['maize', 'beans'])}
    engine.crop_encoder = engine.encoders['crop']
    # small synthetic dataset as DataFrame
    import pandas as pd
    engine.dataset = pd.read_csv(GOLDEN_DATASET_PATH)
    return engine


def test_market_prediction_engine_predict(monkeypatch):
    engine = make_engine_with_dummies(monkeypatch)

    # Call predict with numeric ids
    out = engine.predict(crop_id=1, region_id=1, month=5)

    assert isinstance(out, dict)
    assert 'estimated_price' in out
    assert out['estimated_price'] == pytest.approx(200.0, rel=1e-3)
    assert out['predicted_demand_kg'] == pytest.approx(100.0, rel=1e-3)


def test_pricing_service_integration(monkeypatch):
    # Create a fake market_predictor with predict_by_name used by PricingService
    class FakeMarketPredictor:
        @staticmethod
        def predict_by_name(**kwargs):
            return {
                'estimated_price': 150.0,
                'demand_pressure': 1.0,
                'price_direction': 'STABLE',
                'confidence': 0.5,
                'predicted_demand_kg': 120.0,
            }

    # Patch the module-level market_predictor used by PricingService
    import app.services.pricing_service as pricing_mod
    monkeypatch.setattr(pricing_mod, 'market_predictor', FakeMarketPredictor())

    # Now import PricingService and run analysis
    from app.services.pricing_service import PricingService

    res = PricingService.get_price_analysis('Maize', 'Musanze', 500)

    assert 'suggested_price' in res
    assert res['base_price'] == round(150.0, 2)
    assert res['price_direction'] == 'STABLE'
