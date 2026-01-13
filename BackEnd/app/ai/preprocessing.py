
import pandas as pd
import os

# Get the absolute path to the directory this script is in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, "datasets", "raw")
OUT_DIR = os.path.join(BASE_DIR, "datasets", "processed")

RW_STAPLES = "AHS2024_Section3_4_CROP.dta"
RW_FRUITS = "AHS2024_Section5_FRUITS.dta"
NG_MARKET = "nigerian_agriculture_commodity_market_prices.csv"

def ensure_dirs():
    os.makedirs(OUT_DIR, exist_ok=True)

# =========================
# RWANDA – STAPLE CROPS
# =========================
def process_rwanda_staples():
    df = pd.read_stata(os.path.join(RAW_DIR, RW_STAPLES), convert_categoricals=False)

    df = df[[
        "district",
        "Season",
        "s3_q3",     # crop code
        "s4_q34",    # harvested quantity
        "weight"
    ]].dropna()

    df.columns = ["region_id", "month", "crop_id", "quantity", "weight"]
    df["quantity"] = df["quantity"] * df["weight"]

    df["country"] = "Rwanda"
    df["price"] = None
    df["market_signal"] = None

    return df[[
        "country", "region_id", "crop_id", "month",
        "quantity", "price", "market_signal"
    ]]

# =========================
# RWANDA – FRUITS
# =========================
def process_rwanda_fruits():
    df = pd.read_stata(os.path.join(RAW_DIR, RW_FRUITS), convert_categoricals=False)

    df = df[[
        "district",
        "Season",
        "s5_q2",   # fruit type
        "s5_q8",   # quantity harvested
        "weight"
    ]].dropna()

    df.columns = ["region_id", "month", "crop_id", "quantity", "weight"]
    df["quantity"] = df["quantity"] * df["weight"]

    df["country"] = "Rwanda"
    df["price"] = None
    df["market_signal"] = None

    return df[[
        "country", "region_id", "crop_id", "month",
        "quantity", "price", "market_signal"
    ]]

# =========================
# NIGERIA – MARKET DATA
# =========================
def process_nigeria():
    df = pd.read_csv(os.path.join(RAW_DIR, NG_MARKET))
    df["date"] = pd.to_datetime(df["date"])

    df["month"] = df["date"].dt.month
    df["market_signal"] = df["price_ngn_kg"] * df["volume_kg"]

    df = df.rename(columns={
        "commodity": "crop_id",
        "price_ngn_kg": "price",
        "volume_kg": "quantity",
        "market": "region_id"
    })

    df["country"] = "Nigeria"

    return df[[
        "country", "region_id", "crop_id", "month",
        "quantity", "price", "market_signal"
    ]]

# =========================
# UNIFIED DATASET
# =========================
def build_unified_demand():
    rw_staples = process_rwanda_staples()
    rw_fruits  = process_rwanda_fruits()
    ng         = process_nigeria()

    unified = pd.concat(
        [rw_staples, rw_fruits, ng],
        ignore_index=True
    )

    out_path = os.path.join(OUT_DIR, "demand_history.csv")
    unified.to_csv(out_path, index=False)

    print(f"✅ Unified demand_history.csv created ({len(unified)} rows)")

if __name__ == "__main__":
    ensure_dirs()
    build_unified_demand()
