import pandas as pd
import os
from sklearn.preprocessing import LabelEncoder

RAW_DIR = "app/ai/datasets/raw"
PROCESSED_DIR = "app/ai/datasets/processed"

RWANDA_DTA = "AHS2024_Section3_4_CROP GROWN, SEEDS AND PRODUCTION & AGRICULTURAL INPUTS AND PRACTICES.dta"
NIGERIA_CSV = "nigerian_market_prices.csv"

OUT_FILE = os.path.join(PROCESSED_DIR, "unified_demand_history.csv")

def ensure_dirs():
    os.makedirs(PROCESSED_DIR, exist_ok=True)

# ------------------------------------------------------------------
# RWANDA DEMAND (Production → Demand Proxy)
# ------------------------------------------------------------------
def preprocess_rwanda():
    path = os.path.join(RAW_DIR, RWANDA_DTA)
    df = pd.read_stata(path, convert_categoricals=False)

    cols = ["district", "Season", "s3_q3", "s4_q34", "weight"]
    df = df[cols].dropna(subset=["s3_q3", "s4_q34"])

    df = df.rename(columns={
        "district": "district_id",
        "Season": "month",
        "s3_q3": "crop_id",
        "s4_q34": "quantity"
    })

    df["total_qty_demanded"] = df["quantity"] * df["weight"]
    df["country"] = "Rwanda"

    demand = (
        df.groupby(["country", "district_id", "crop_id", "month"], as_index=False)
          .agg(total_qty_demanded=("total_qty_demanded", "sum"))
    )

    return demand

# ------------------------------------------------------------------
# NIGERIA DEMAND (TRUE MARKET DEMAND)
# ------------------------------------------------------------------
def preprocess_nigeria():
    path = os.path.join(RAW_DIR, NIGERIA_CSV)
    df = pd.read_csv(path)

    df = df.dropna(subset=["commodity", "market", "date", "volume_kg"])
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month

    # Encode crop and market consistently
    crop_encoder = LabelEncoder()
    market_encoder = LabelEncoder()

    df["crop_id"] = crop_encoder.fit_transform(df["commodity"])
    df["district_id"] = market_encoder.fit_transform(df["market"])

    df["country"] = "Nigeria"
    df["total_qty_demanded"] = df["volume_kg"]

    demand = (
        df.groupby(["country", "district_id", "crop_id", "month"], as_index=False)
          .agg(total_qty_demanded=("total_qty_demanded", "sum"))
    )

    return demand

# ------------------------------------------------------------------
# MERGE BOTH COUNTRIES
# ------------------------------------------------------------------
def build_unified_dataset():
    ensure_dirs()

    rwanda = preprocess_rwanda()
    nigeria = preprocess_nigeria()

    unified = pd.concat([rwanda, nigeria], ignore_index=True)

    unified.to_csv(OUT_FILE, index=False)
    print(f"✅ Unified demand dataset saved → {OUT_FILE}")
    print(unified.head())

if __name__ == "__main__":
    build_unified_dataset()
