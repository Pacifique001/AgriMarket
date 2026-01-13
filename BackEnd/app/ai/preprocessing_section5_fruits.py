import pandas as pd
import os

RAW_DIR = "app/ai/datasets/raw"
PROCESSED_DIR = "app/ai/datasets/processed"

FRUIT_DEMAND_OUT = os.path.join(PROCESSED_DIR, "fruit_demand_history.csv")

def ensure_dirs():
    os.makedirs(PROCESSED_DIR, exist_ok=True)

def load_fruit_production():
    path = os.path.join(
        RAW_DIR,
        "AHS2024_Section5_FRUITS PRODUCTION.dta"
    )
    return pd.read_stata(path, convert_categoricals=False)

def build_fruit_demand_dataset():
    df = load_fruit_production()

    # --- Select relevant columns ---
    cols = [
        "district",
        "Season",
        "s5_q1",   # fruit code
        "s5_q8",   # harvested / sold quantity
        "s6_q9",   # alternative quantity
        "weight"
    ]
    df = df[cols]

    # Combine quantity columns (use s5_q8 first, fallback to s6_q9)
    df["quantity"] = df["s5_q8"].fillna(df["s6_q9"])

    # Drop rows without fruit or quantity
    df = df.dropna(subset=["s5_q1", "quantity"])

    # Rename to ML-friendly names
    df = df.rename(columns={
        "district": "district_id",
        "Season": "month",
        "s5_q1": "crop_id"
    })

    # Apply survey weights
    df["weighted_qty"] = df["quantity"] * df["weight"]

    # Aggregate demand
    demand = (
        df.groupby(["district_id", "crop_id", "month"], as_index=False)
          .agg(total_qty_demanded=("weighted_qty", "sum"))
    )

    demand.to_csv(FRUIT_DEMAND_OUT, index=False)
    print(f"Fruit demand dataset saved → {FRUIT_DEMAND_OUT}")

if __name__ == "__main__":
    ensure_dirs()
    build_fruit_demand_dataset()
