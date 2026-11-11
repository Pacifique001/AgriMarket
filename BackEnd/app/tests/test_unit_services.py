from app.ai.fraud_detector import FraudDetector
from app.services.matching_service import MatchingService
from app.services.pricing_service import PricingService
import app.ai.fraud_detector as fraud_module
import app.services.matching_service as matching_module
import app.services.pricing_service as pricing_module
import app.ai.predict as predict_module
from app.ai.predict import classify_price_direction, compute_confidence
import os
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import Mock, patch


os.environ.setdefault("SECRET_KEY", "unit-test-secret-key")


class FixedDatetime:
    @staticmethod
    def utcnow():
        return datetime(2026, 5, 5, 12, 0, 0)


class PredictHelpersTest(unittest.TestCase):
    def test_classify_price_direction(self):
        self.assertEqual(classify_price_direction(None, 100), "STABLE")
        self.assertEqual(classify_price_direction(105, 100), "UP")
        self.assertEqual(classify_price_direction(94, 100), "DOWN")
        self.assertEqual(classify_price_direction(101, 100), "STABLE")

    def test_compute_confidence_scales_with_samples(self):
        self.assertEqual(compute_confidence(0), 0.4)
        self.assertEqual(compute_confidence(500), 0.95)
        self.assertEqual(compute_confidence(1000), 0.95)


class PricingServiceTest(unittest.TestCase):
    def test_build_reasoning_includes_expected_phrases(self):
        reasoning = PricingService._build_reasoning("UP", 1.4, 3200, "Musanze")

        self.assertIn("Prices are rising in this market", reasoning)
        self.assertIn("Strong buyer demand", reasoning)
        self.assertIn("Bulk quantity discount applied", reasoning)
        self.assertIn("Based on recent trades in Musanze", reasoning)

    def test_get_price_analysis_applies_market_and_quantity_adjustments(self):
        market_result = {
            "estimated_price": 100.0,
            "demand_pressure": 1.3,
            "price_direction": "UP",
            "confidence": 1.0,
        }

        with patch.object(pricing_module, "datetime", FixedDatetime), patch.object(
            pricing_module.market_predictor,
            "predict_by_name",
            return_value=market_result,
            create=True,
        ):
            analysis = PricingService.get_price_analysis(
                "Maize", "Musanze", 500)

        self.assertEqual(analysis["base_price"], 100.0)
        self.assertEqual(analysis["suggested_price"], 108.0)
        self.assertEqual(analysis["price_direction"], "UP")
        self.assertEqual(analysis["confidence"], 1.0)
        self.assertIn("Prices are rising in this market",
                      analysis["reasoning"])


class MatchingServiceTest(unittest.TestCase):
    def test_calculate_match_score_rejects_below_minimum_quantity(self):
        listing = SimpleNamespace(
            farmer=SimpleNamespace(latitude=None, longitude=None),
            district="Musanze",
            quantity_kg=10,
            crop_id=1,
            region_id=2,
            harvest_date=None,
        )
        buyer = SimpleNamespace(
            base_latitude=None,
            base_longitude=None,
            base_district="Musanze",
            min_purchase_qty_kg=20,
            max_purchase_qty_kg=None,
            is_verified=False,
        )

        score, reasons = MatchingService._calculate_match_score(listing, buyer)

        self.assertEqual(score, 0.0)
        self.assertEqual(reasons, ["Below buyer minimum quantity"])

    def test_calculate_match_score_combines_matching_signals(self):
        listing = SimpleNamespace(
            farmer=SimpleNamespace(latitude=None, longitude=None),
            district="Musanze",
            quantity_kg=100,
            crop_id=1,
            region_id=2,
            harvest_date=datetime(2026, 5, 3).date(),
        )
        buyer = SimpleNamespace(
            base_latitude=None,
            base_longitude=None,
            base_district="Musanze",
            min_purchase_qty_kg=None,
            max_purchase_qty_kg=None,
            is_verified=True,
        )

        with patch.object(matching_module.market_predictor, "predict", return_value={
            "demand_pressure": 1.5,
            "confidence": 1.0,
        }):
            score, reasons = MatchingService._calculate_match_score(
                listing, buyer)

        self.assertEqual(score, 0.8)
        self.assertIn("Same district", reasons)
        self.assertIn("Good volume match", reasons)
        self.assertIn("High buyer demand", reasons)
        self.assertIn("Verified buyer", reasons)


class FraudDetectionServiceTest(unittest.TestCase):
    class _QueryStub:
        def __init__(self, count_value=0, scalar_value=0):
            self._count_value = count_value
            self._scalar_value = scalar_value

        def filter(self, *args, **kwargs):
            return self

        def count(self):
            return self._count_value

        def scalar(self):
            return self._scalar_value

    class _DbStub:
        def __init__(self, match_count, completed_count, failed_count, avg_value):
            self.match_count = match_count
            self.completed_count = completed_count
            self.failed_count = failed_count
            self.avg_value = avg_value
            self.transaction_calls = 0

        def query(self, entity):
            entity_name = getattr(entity, "__name__", None)
            if entity_name == "Match":
                return FraudDetectionServiceTest._QueryStub(
                    count_value=self.match_count
                )
            if entity_name == "Transaction":
                self.transaction_calls += 1
                if self.transaction_calls == 1:
                    return FraudDetectionServiceTest._QueryStub(
                        count_value=self.completed_count
                    )
                return FraudDetectionServiceTest._QueryStub(
                    count_value=self.failed_count
                )

            return FraudDetectionServiceTest._QueryStub(
                scalar_value=self.avg_value
            )

    def test_assess_buyer_risk_combines_behavior_signals(self):
        buyer = SimpleNamespace(
            id=7,
            max_purchase_qty_kg=10,
            created_at=datetime.now(timezone.utc) - timedelta(days=2),
            fraud_score=0.0,
            trust_score=0.0,
            last_activity_at=None,
        )

        db = self._DbStub(
            match_count=12,
            completed_count=0,
            failed_count=3,
            avg_value=20,
        )

        risk = FraudDetector.assess_buyer_risk(db=db, buyer=buyer)

        self.assertEqual(risk, 0.9)
        self.assertEqual(buyer.fraud_score, 0.0)
        self.assertEqual(buyer.trust_score, 0.0)
        self.assertIsNone(buyer.last_activity_at)

    def test_is_transaction_suspicious_checks_price_and_quantity(self):
        listing = SimpleNamespace(price_per_kg=100, quantity_kg=50)

        self.assertTrue(FraudDetector.is_transaction_suspicious(
            None, listing, 60, 50))
        self.assertTrue(FraudDetector.is_transaction_suspicious(
            None, listing, 70, 40))
        self.assertFalse(FraudDetector.is_transaction_suspicious(
            None, listing, 40, 100))


if __name__ == "__main__":
    unittest.main()
