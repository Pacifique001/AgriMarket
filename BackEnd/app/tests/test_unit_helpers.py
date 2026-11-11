from jose import jwt
from app.utils.distance import calculate_haversine_distance, is_within_range
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.config import Settings
import os
import unittest


os.environ.setdefault("SECRET_KEY", "unit-test-secret-key")


class _ValidatorInfo:
    def __init__(self, data):
        self.data = data


class DistanceUtilsTest(unittest.TestCase):
    def test_calculate_haversine_distance_returns_expected_value(self):
        distance = calculate_haversine_distance(0, 0, 0, 1)

        self.assertIsNotNone(distance)
        self.assertAlmostEqual(distance, 111.19, places=1)

    def test_calculate_haversine_distance_rejects_invalid_coordinates(self):
        self.assertIsNone(calculate_haversine_distance(91, 0, 0, 0))
        self.assertFalse(is_within_range(91, 0, 0, 0, 10))


class SecurityHelpersTest(unittest.TestCase):
    def test_password_hash_round_trip(self):
        hashed_password = get_password_hash("secret-password")

        self.assertNotEqual(hashed_password, "secret-password")
        self.assertTrue(verify_password("secret-password", hashed_password))
        self.assertFalse(verify_password("wrong-password", hashed_password))

    def test_create_access_token_encodes_expected_claims(self):
        token = create_access_token("123", "farmer")
        payload = jwt.decode(
            token,
            Settings().SECRET_KEY,
            algorithms=[Settings().ALGORITHM],
        )

        self.assertEqual(payload["sub"], "123")
        self.assertEqual(payload["role"], "farmer")
        self.assertEqual(payload["type"], "access")


class SettingsValidatorTest(unittest.TestCase):
    def test_assemble_database_url_from_components(self):
        info = _ValidatorInfo(
            {
                "DB_USER": "agri_user",
                "DB_PASSWORD": "secret",
                "DB_NAME": "agromarket",
                "DB_HOST": "db.example.local",
                "DB_PORT": 5432,
            }
        )

        database_url = Settings.assemble_database_url(None, info)

        self.assertEqual(
            database_url,
            "postgresql://agri_user:secret@db.example.local:5432/agromarket",
        )

    def test_assemble_cors_origins_parses_string_values(self):
        origins = Settings.assemble_cors_origins(
            "http://localhost:3000, https://example.com"
        )

        self.assertEqual(
            origins,
            ["http://localhost:3000", "https://example.com"],
        )


if __name__ == "__main__":
    unittest.main()
