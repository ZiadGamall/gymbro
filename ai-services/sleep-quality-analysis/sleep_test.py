"""
Sleep & Recovery - Terminal Test Script
=======================================
Test the model interactively before connecting the Zepp API.
Run:   python test_predict.py
"""

from sleep_predict import SleepRecoveryPredictor, from_zepp_api

predictor = SleepRecoveryPredictor()
DIV = "─" * 55


def show_result(result):
    print(f"\n{DIV}")
    print(f"  RESULT  {result['emoji']}  {result['recommendation'].upper()}")
    print(f"{DIV}\n")


def run():
    print(f"\n{'='*55}")
    print("  😴  Sleep & Recovery Recommender — Terminal Test")
    print(f"{'='*55}")

    valid = predictor.valid_labels

    def pick(label, opts):
        print(f"\n  {label}:")
        for i, o in enumerate(opts, 1): print(f"    {i}. {o}")
        while True:
            r = input("  Pick number: ").strip()
            if r.isdigit() and 1 <= int(r) <= len(opts):
                return opts[int(r)-1]

    def num(label, lo, hi, is_float=False):
        while True:
            try:
                v = float(input(f"  {label} [{lo}-{hi}]: ").strip())
                if lo <= v <= hi:
                    return v if is_float else int(v)
            except ValueError: pass
            print(f"  Please enter a number between {lo} and {hi}.")

    gender = pick("Gender", valid.get("Gender", ["Male", "Female"]))
    age    = num("Age", 18, 80)

    print("\n  -- Zepp values (check your Zepp app for these) --")
    total  = num("Total sleep minutes (e.g. 420 = 7h)", 60, 720)
    deep   = num("Deep sleep minutes", 0, 200)
    rem    = num("REM sleep minutes",  0, 200)
    hr     = num("Avg heart rate during sleep (bpm)", 40, 110)
    sc     = num("Zepp sleep score (0-100)", 0, 100)
    stress = num("Avg stress score yesterday (0-100)", 0, 100)
    steps  = num("Steps yesterday", 0, 30000)
    active = num("Active minutes yesterday", 0, 180)

    zepp = {
        "total_sleep_min": total, "deep_sleep_min": deep,
        "rem_sleep_min": rem,     "hr_avg_bpm": hr,
        "sleep_score": sc,        "avg_stress_score": stress,
        "steps": steps,           "active_minutes": active,
    }
    model_input = from_zepp_api(zepp, {"Gender": gender, "Age": age})
    show_result(predictor.predict(model_input))
    print("Done. 👋\n")


if __name__ == "__main__":
    run()
