import pandas as pd
import os
from sklearn.preprocessing import LabelEncoder

RAW_PATH = "app/ai/datasets/raw/nigerian_market_prices.csv"
OUT_PATH = "app/ai/datasets/processed/demand_history.csv"

def preprocess_nigerian_demand():
    df = pd.read_csv(RAW_PATH)

    # --- Basic cleaning ---
    df = df.dropna(subset=["commodity", "market", "date", "volume_kg"])

    # Convert date → month
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month

    # Encode categorical variables
    crop_encoder = LabelEncoder()
    market_encoder = LabelEncoder()

    df["crop_id"] = crop_encoder.fit_transform(df["commodity"])
    df["district_id"] = market_encoder.fit_transform(df["market"])

    # Aggregate monthly demand per crop & market
    demand = (
        df.groupby(["crop_id", "district_id", "month"], as_index=False)
          .agg(total_qty_demanded=("volume_kg", "sum"))
    )

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    demand.to_csv(OUT_PATH, index=False)

    print("✅ Nigerian demand dataset created")
    print(demand.head())

if __name__ == "__main__":
    preprocess_nigerian_demand()
