import os
import time
from statistics import mean


def measure_single_call(n=10):
    durations = []
    for _ in range(n):
        start = time.perf_counter()
        PricingService.get_price_analysis("Maize", "Musanze", 500)
        durations.append(time.perf_counter() - start)
    return durations


def measure_concurrent_calls(n=50):
    # Simple sequential simulation for now (no threading) to measure throughput
    durations = measure_single_call(n=n)
    return durations


def main():
    # Ensure working directory is the BackEnd root so relative model paths resolve
    repo_backend_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..', '..'))
    try:
        os.chdir(repo_backend_root)
    except Exception:
        pass

    # Import the PricingService after setting cwd so model artifacts referenced
    # with relative paths like 'app/ai/price_model.pkl' are found.
    try:
        # Ensure BackEnd root is on sys.path so package imports work
        import sys
        if repo_backend_root not in sys.path:
            sys.path.insert(0, repo_backend_root)
        from app.services.pricing_service import PricingService
        # make available to measure_* functions defined at module scope
        globals()['PricingService'] = PricingService
        # Ensure the PricingService's module-level market_predictor has a
        # `predict_by_name` adapter when the real predictor implements only
        # `predict`. This lets the service calls succeed while still using
        # the real models when available.
        try:
            import sys as _sys
            pricing_mod = _sys.modules.get('app.services.pricing_service')
            if pricing_mod is not None:
                pmp = getattr(pricing_mod, 'market_predictor', None)
                if pmp is not None and not hasattr(pmp, 'predict_by_name'):
                    def _adapter(**kwargs):
                        crop_type = kwargs.get('crop_type') or kwargs.get(
                            'crop') or 'unknown'
                        region_name = kwargs.get('region_name') or kwargs.get(
                            'district') or 'unknown'
                        month = kwargs.get('month')

                        # Try to use crop_encoder if present
                        crop_id = None
                        enc = getattr(pmp, 'crop_encoder', None)
                        if enc is not None:
                            try:
                                for c in enc.classes_:
                                    if str(c).lower() == str(crop_type).lower():
                                        crop_id = c
                                        break
                            except Exception:
                                crop_id = None

                        if crop_id is None:
                            try:
                                crop_id = int(''.join(filter(str.isdigit, str(crop_type))) or 0) or (
                                    abs(hash(crop_type)) % 1000 + 1)
                            except Exception:
                                crop_id = abs(hash(crop_type)) % 1000 + 1

                        try:
                            region_id = int(''.join(filter(str.isdigit, str(region_name))) or 0) or (
                                abs(hash(region_name)) % 100 + 1)
                        except Exception:
                            region_id = abs(hash(region_name)) % 100 + 1

                        if month is None:
                            return pmp.predict(crop_id=crop_id, region_id=region_id)
                        return pmp.predict(crop_id=crop_id, region_id=region_id, month=month)

                    try:
                        setattr(pmp, 'predict_by_name', _adapter)
                        # also reflect back onto module object
                        setattr(pricing_mod, 'market_predictor', pmp)
                    except Exception:
                        pass
        except Exception:
            pass
    except Exception as e:
        # If import fails, provide a clear message and re-raise
        print('Failed to import PricingService from app.services.pricing_service:', e)
        raise

    # Monkeypatch market_predictor to avoid external model loads when needed
    # Inspect model artifact availability and whether the real market_predictor
    # has loaded model artifacts. Only monkeypatch if models/dataset are missing.
    model_report = {}
    try:
        from app.ai import predict as ai_predict
        mp = getattr(ai_predict, "market_predictor", None)
        model_report['price_model_loaded'] = bool(
            getattr(mp, 'price_model', None))
        model_report['demand_model_loaded'] = bool(
            getattr(mp, 'demand_model', None))
        model_report['encoders_loaded'] = bool(getattr(mp, 'encoders', None))
        # dataset present if DataFrame not empty
        dataset = getattr(mp, 'dataset', None)
        try:
            model_report['dataset_loaded'] = not dataset.empty
        except Exception:
            model_report['dataset_loaded'] = False
    except Exception:
        model_report = {
            'price_model_loaded': False,
            'demand_model_loaded': False,
            'encoders_loaded': False,
            'dataset_loaded': False,
        }

    # If any model artifacts are missing, monkeypatch the predictor to a fake one
    if not all(model_report.values()):
        try:
            import app.services.pricing_service as pricing_mod
            pricing_mod.market_predictor = type(
                "X", (), {"predict_by_name": staticmethod(lambda **kw: fake_market())})()
            model_report['using_mock'] = True
        except Exception:
            model_report['using_mock'] = True
    else:
        model_report['using_mock'] = False

    os.makedirs("../nonfunctional", exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__),
                            "pricing_performance.txt")

    single = measure_single_call(20)
    concurrent = measure_concurrent_calls(100)

    with open(out_path, "w") as f:
        f.write("PricingService performance run\n")
        f.write("Model artifacts report:\n")
        for k, v in model_report.items():
            f.write(f"- {k}: {v}\n")
        f.write("\n")
        f.write(f"Single-call samples: {len(single)}\n")
        f.write(f"Avg latency (s): {mean(single):.6f}\n")
        f.write(f"Min latency (s): {min(single):.6f}\n")
        f.write(f"Max latency (s): {max(single):.6f}\n")
        f.write("\nSequential throughput test (100 runs):\n")
        f.write(f"Avg latency (s): {mean(concurrent):.6f}\n")
        f.write(f"Throughput (ops/s): {100/mean(concurrent):.2f}\n")

    print("Non-functional tests completed. Results written to:", out_path)


if __name__ == "__main__":
    main()
