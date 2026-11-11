# Unit Test Report

Date: 2026-05-05

## Methodology
- The tests were written as unit tests, not end-to-end tests.
- Backend tests used Python's built-in `unittest` runner.
- Deterministic helpers were tested directly with real input values.
- Service-layer tests used mocked dependencies and stub objects so the logic could be exercised without a database or external API.
- Parameter changes were used to verify behavior under multiple conditions, including valid values, invalid values, boundary values, and fallback paths.

## Scope
- Backend unit tests in `BackEnd/app/tests/test_unit_helpers.py`
- Backend unit tests in `BackEnd/app/tests/test_unit_services.py`
- Frontend unit tests in `FrontEnd/tests/frontend.unit.ts`

## Result
- Backend tests run: 14
- Backend tests passed: 14
- Backend tests failed: 0
- Backend tests errors: 0
- Frontend tests run: 5
- Frontend tests passed: 5
- Frontend tests failed: 0
- Frontend tests errors: 0
- Total tests passed overall: 19

## Frontend Test Run
- `cn` was tested with conflicting Tailwind classes.
- `formatCurrency` was tested with a sample RWF value.
- `formatDate` was tested with a fixed date.
- `getNavbarSearchPlaceholder` was tested with buyer and farmer roles.
- `getCropCardPriceDiff` was tested with above-market, below-market, and missing-value inputs.

## What Was Tested
### Backend helpers
- Distance calculation was tested with a valid coordinate pair and with invalid coordinates.
- Password hashing and verification were tested with a matching password and a wrong password.
- JWT creation was tested by decoding the token and checking the expected claims.
- Settings validation was tested with different input formats for the database URL and CORS origins.

### Backend service logic
- Price direction classification was tested with increasing, decreasing, stable, and missing values.
- Confidence scoring was tested with 0, midpoint, and maximum sample counts.
- Pricing logic was tested with a mocked market result, a fixed month, and changed quantity input.
- Matching logic was tested with minimum quantity rejection and with a mixed set of matching signals.
- Fraud-risk logic was tested with a fake database returning different counts for matches and transactions.
- Transaction fraud checks were tested with different price and quantity combinations.

### Frontend helpers
- Tailwind class merging was tested with conflicting padding classes.
- Currency formatting was tested with a sample RWF amount.
- Date formatting was tested with a fixed calendar date.
- Navbar placeholder text was tested with different user roles.
- Crop card price difference calculation was tested with prices above market, below market, and missing values.

## How It Was Tested
- Direct function calls were used for pure helpers.
- Mock objects and monkeypatched methods were used for services that normally call AI models or databases.
- Fixed sample values were used to make results repeatable.
- Multiple inputs were used on the same method to verify parameter-sensitive behavior.
- Boundary values were used where the logic changes at thresholds, such as quantity limits and confidence scaling.

## Notes
- The test run completed successfully.
- The run showed non-failing deprecation warnings about `datetime.utcnow()` in:
  - `BackEnd/app/core/security.py`
  - `BackEnd/app/services/matching_service.py`

## Non-Functional Test Results
The following non-functional checks were executed on the `PricingService.get_price_analysis` path with a mocked market predictor to avoid external ML model loading.

PricingService performance run (file: `BackEnd/test-results/nonfunctional/pricing_performance.txt`)

```
PricingService performance run
Single-call samples: 20
Avg latency (s): 0.000026
Min latency (s): 0.000005
Max latency (s): 0.000170

Sequential throughput test (100 runs):
Avg latency (s): 0.000006
Throughput (ops/s): 17418567.79
```

Interpretation:
- The pricing path is effectively instantaneous in this environment because the market predictor was replaced with a tiny deterministic stub. The measured average latency for single calls was ~0.00003s.
- Sequential throughput indicates the code path itself is fast; real-world performance will depend on loaded ML models, I/O, and concurrency.
- Recommendation: run a staging load test with the real model and realistic data to measure true latency under production conditions.
