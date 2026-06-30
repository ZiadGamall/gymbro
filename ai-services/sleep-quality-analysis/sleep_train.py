"""
Sleep & Recovery Recommendation - Training Script
==================================================
Dataset  : Sleep Health and Lifestyle Dataset
           Kaggle: uom190346a/sleep-health-and-lifestyle-dataset

Features : Only columns that EXIST in the dataset AND can be
           provided by the Amazfit Bip 6 via the Zepp API.
           No invented columns. No fake data.

Run once:
    python train_model.py
"""

import os, sys, zipfile, subprocess
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

DATA_DIR  = "data"
CSV_FILE  = os.path.join(DATA_DIR, "Sleep_health_and_lifestyle_dataset.csv")
MODEL_DIR = "models"
os.makedirs(DATA_DIR,  exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


# ── 1. DOWNLOAD ───────────────────────────────────────────────
if not os.path.exists(CSV_FILE):
    print("[1/5] Downloading dataset from Kaggle...")
    result = subprocess.run(
        ["python", "-m", "kaggle", "datasets", "download",
         "-d", "uom190346a/sleep-health-and-lifestyle-dataset",
         "-p", DATA_DIR],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("ERROR - Kaggle download failed:\n", result.stderr)
        sys.exit(1)
    zip_path = os.path.join(DATA_DIR, "sleep-health-and-lifestyle-dataset.zip")
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(DATA_DIR)
    print("    Done.")
else:
    print("[1/5] Dataset already present, skipping download.")


# ── 2. LOAD ───────────────────────────────────────────────────
print("\n[2/5] Loading data...")
df = pd.read_csv(CSV_FILE)
print(f"    Shape   : {df.shape}")
print(f"    Columns : {list(df.columns)}")

# NaN in Sleep Disorder means no disorder
df["Sleep Disorder"] = df["Sleep Disorder"].fillna("None")


# ── 3. CHOOSE FEATURES ────────────────────────────────────────
#
# Rule: only use columns that (a) exist in the CSV and
#       (b) the Bip 6 / Zepp API can supply at prediction time.
#
# KEPT:
#   Gender               → one-time user profile
#   Age                  → one-time user profile
#   Sleep Duration       → Zepp: total_sleep_min / 60
#   Quality of Sleep     → Zepp: sleep_score / 10
#   Physical Activity    → Zepp: active_minutes yesterday
#   Stress Level         → Zepp: avg_stress_score / 10
#   Heart Rate           → Zepp: hr_avg_bpm during sleep
#   Daily Steps          → Zepp: steps yesterday
#
# DROPPED (Bip 6 cannot measure these):
#   Occupation      - irrelevant for daily recommendation anyway
#   BMI Category    - no scale sensor on watch
#   Blood Pressure  - Bip 6 has no BP sensor

FEATURE_COLS = [
    "Gender",
    "Age",
    "Sleep Duration",
    "Quality of Sleep",
    "Physical Activity Level",
    "Stress Level",
    "Heart Rate",
    "Daily Steps",
]

print(f"\n[3/5] Features selected  : {FEATURE_COLS}")
print(f"      Features dropped   : Occupation, BMI Category, Blood Pressure")


# ── 4. DERIVE LABEL ───────────────────────────────────────────
#
# The dataset has no training-recommendation column, so we create one
# using clear, tunable rules applied to the existing columns.
# Sleep Disorder is used here only during label creation — it is NOT
# a feature the model receives. It helps us set sensible thresholds.
#
# Tune these numbers to match your own recovery philosophy.

def derive_recommendation(row):
    disorder = row["Sleep Disorder"]       # None / Insomnia / Sleep Apnea
    sq       = row["Quality of Sleep"]     # 1–10
    dur      = row["Sleep Duration"]       # hours
    stress   = row["Stress Level"]         # 1–10
    activity = row["Physical Activity Level"]  # min / day

    # REST — clear signals of poor recovery
    if (disorder == "Sleep Apnea"
            or sq     <= 5
            or dur    <  6.0
            or stress >= 8):
        return "Rest"

    # TRAIN HARD — strong recovery signals across all dimensions
    if (disorder == "None"
            and sq     >= 8
            and dur    >= 7.0
            and stress <= 4
            and activity >= 60):
        return "Train Hard"

    # Everything else — moderate recovery
    return "Train Light"


df["Recommendation"] = df.apply(derive_recommendation, axis=1)

print("\n      Recommendation distribution:")
counts = df["Recommendation"].value_counts()
total  = len(df)
for label, cnt in counts.items():
    pct = cnt / total * 100
    bar = "█" * int(pct / 2)
    print(f"        {label:<14} {cnt:>3}  ({pct:4.1f}%)  {bar}")


# ── 5. ENCODE ─────────────────────────────────────────────────
print("\n[4/5] Encoding and splitting...")

# Gender is the only text column in our feature set
encoders = {}
le_gender = LabelEncoder()
df["Gender"] = le_gender.fit_transform(df["Gender"].astype(str))
encoders["Gender"] = le_gender

target_encoder = LabelEncoder()
df["Recommendation_enc"] = target_encoder.fit_transform(df["Recommendation"])
print(f"      Target classes : {list(target_encoder.classes_)}")

X = df[FEATURE_COLS].values
y = df["Recommendation_enc"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"      Train rows : {len(X_train)}   Test rows : {len(X_test)}")


# ── 6. TRAIN ──────────────────────────────────────────────────
clf = RandomForestClassifier(
    n_estimators  = 300,
    max_depth     = None,
    min_samples_leaf = 2,
    class_weight  = "balanced",   # handles class imbalance
    random_state  = 42,
    n_jobs        = -1
)
clf.fit(X_train, y_train)


# ── 7. EVALUATE ───────────────────────────────────────────────
y_pred = clf.predict(X_test)
acc    = accuracy_score(y_test, y_pred)

print(f"\n{'='*60}")
print(f"  HOLD-OUT ACCURACY : {acc:.3f}  ({acc*100:.1f}%)")
print(f"{'='*60}")

print("\n  Per-class report (precision / recall / f1):")
print(classification_report(y_test, y_pred,
                             target_names=target_encoder.classes_))

print("  Confusion matrix  (rows = actual, cols = predicted):")
cm = pd.DataFrame(
    confusion_matrix(y_test, y_pred),
    index  =[f"Actual: {c}"    for c in target_encoder.classes_],
    columns=[f"Predicted: {c}" for c in target_encoder.classes_]
)
print(cm.to_string())

cv = cross_val_score(
    clf, X, y,
    cv=StratifiedKFold(5, shuffle=True, random_state=42),
    scoring="accuracy"
)
print(f"\n  5-Fold CV : {cv.mean():.3f} ± {cv.std():.3f}")
print(f"  Per-fold  : {[round(s, 3) for s in cv]}")

print("\n  Feature importances:")
imp = pd.Series(clf.feature_importances_,
                index=FEATURE_COLS).sort_values(ascending=False)
for feat, val in imp.items():
    bar = "█" * int(val * 60)
    print(f"    {feat:<28} {val:.3f}  {bar}")


# ── 8. SAVE ───────────────────────────────────────────────────
print("\n[5/5] Saving model artefacts to models/ ...")
joblib.dump(clf,            os.path.join(MODEL_DIR, "sleep_rf_model.pkl"))
joblib.dump(encoders,       os.path.join(MODEL_DIR, "sleep_feature_encoders.pkl"))
joblib.dump(target_encoder, os.path.join(MODEL_DIR, "sleep_target_encoder.pkl"))
joblib.dump(FEATURE_COLS,   os.path.join(MODEL_DIR, "sleep_feature_cols.pkl"))

print("      sleep_rf_model.pkl          ← the trained model")
print("      sleep_feature_encoders.pkl  ← Gender label encoder")
print("      sleep_target_encoder.pkl    ← Rest/Train Light/Train Hard encoder")
print("      sleep_feature_cols.pkl      ← ordered feature list")

print(f"""
{'='*60}
  DONE
  Dataset rows : {total}  (synthetic Kaggle data)
  Features     : {len(FEATURE_COLS)}  (all real dataset columns,
                  all mappable to Bip 6 / Zepp API output)
  Label note   : target was derived from the same columns used
                 as features, so accuracy looks high. The real
                 validation is: does the recommendation feel
                 correct when you feed in YOUR Zepp data?
{'='*60}
""")
