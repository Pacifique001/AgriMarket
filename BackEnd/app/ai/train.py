import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import joblib
import os


# Get the absolute path to the directory this script is in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.join(BASE_DIR, "datasets", "processed", "demand_history.csv")
PRICE_MODEL = os.path.join(BASE_DIR, "price_model.pkl")
DEMAND_MODEL = os.path.join(BASE_DIR, "demand_model.pkl")
ENCODERS = os.path.join(BASE_DIR, "encoders.pkl")

def train_models():
    df = pd.read_csv(DATASET)

    # ========================
    # ENCODING
    # ========================
    crop_encoder = LabelEncoder()
    df["crop_id_enc"] = crop_encoder.fit_transform(df["crop_id"].astype(str))

    encoders = {
        "crop": crop_encoder
    }

    # ---------------- DEMAND MODEL ----------------
    demand_df = df.dropna(subset=["quantity"])

    X_d = demand_df[["crop_id_enc", "month"]]
    y_d = demand_df["quantity"]

    X_train, X_test, y_train, y_test = train_test_split(
        X_d, y_d, test_size=0.2, random_state=42
    )

    demand_model = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        random_state=42
    )
    demand_model.fit(X_train, y_train)

    print("📦 Demand MAE:", mean_absolute_error(
        y_test, demand_model.predict(X_test))
    )

    joblib.dump(demand_model, DEMAND_MODEL)

    # ---------------- PRICE MODEL (Nigeria only) ----------------
    price_df = df.dropna(subset=["price"])

    X_p = price_df[["crop_id_enc", "month", "quantity"]]
    y_p = price_df["price"]

    X_train, X_test, y_train, y_test = train_test_split(
        X_p, y_p, test_size=0.2, random_state=42
    )

    price_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        random_state=42
    )
    price_model.fit(X_train, y_train)

    print("💰 Price MAE:", mean_absolute_error(
        y_test, price_model.predict(X_test))
    )

    joblib.dump(price_model, PRICE_MODEL)

    # Save encoders
    joblib.dump(encoders, ENCODERS)

    print("✅ Models + encoders saved successfully")

if __name__ == "__main__":
    train_models()
