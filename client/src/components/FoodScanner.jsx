import { useState, useRef } from "react";
import { Upload, Camera, Loader2, Sparkles, Plus, AlertCircle } from "lucide-react";
import { analyzeFoodImageApi, addCustomNutritionEntryApi } from "../lib/healthApi";

const FoodScanner = ({ onEntryAdded, mealType = "snack" }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    foodName: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    weight: 0,
  });

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
    setScanResult(null);
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    
    try {
      const result = await analyzeFoodImageApi(file);
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setScanResult(result);
      
      const combinedName = Array.isArray(result.food_items) 
        ? result.food_items.join(", ") 
        : "AI Scanned Meal";
        
      setForm({
        foodName: combinedName,
        calories: result.total_calories || 0,
        protein: result.protein_g || 0,
        carbs: result.carbs_g || 0,
        fat: result.fat_g || 0,
        weight: result.estimated_weight_g || 0,
      });
      
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.foodName || !form.calories) return;
    
    setSaving(true);
    setError("");
    
    try {
      await addCustomNutritionEntryApi({
        isCustom: true,
        foodName: form.foodName,
        calories: form.calories,
        protein: form.protein,
        carbs: form.carbs,
        fat: form.fat,
        mealType: mealType,
        date: new Date().toISOString().slice(0, 10),
      });
      
      // Reset after save
      setFile(null);
      setPreview(null);
      setScanResult(null);
      setForm({ foodName: "", calories: 0, protein: 0, carbs: 0, fat: 0, weight: 0 });
      
      if (onEntryAdded) onEntryAdded();
      
    } catch (err) {
      setError("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-surface space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--neon-blue)]" />
        <h2 className="font-semibold text-[var(--text-primary)]">AI Meal Scanner</h2>
      </div>
      
      {error && (
        <div className="alert-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload State */}
      {!scanResult && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden transition-all relative ${
              !preview ? "p-12 hover:border-[var(--neon-blue)]/50 cursor-pointer hover:bg-[var(--bg-tertiary)]" : "h-64"
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Meal preview" className="w-full h-full object-cover" />
                {!loading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-medium">Change Photo</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-[var(--text-secondary)]" />
                </div>
                <p className="font-medium text-[var(--text-primary)]">Tap to snap or upload meal</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Supports JPEG, PNG</p>
              </>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-[var(--bg-secondary)]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--neon-blue)] animate-spin mb-4" />
                <p className="font-medium text-[var(--text-primary)]">Analyzing Macros...</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1 animate-pulse">Running AI Vision Models</p>
              </div>
            )}
          </div>

          {preview && !loading && (
            <button 
              onClick={handleScan}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Meal
            </button>
          )}
        </div>
      )}

      {/* Results & Edit State */}
      {scanResult && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-4 items-start bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border)]">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <img src={preview} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] italic break-words line-clamp-3">
                "{scanResult.reasoning}"
              </p>
              <button 
                onClick={() => { setScanResult(null); setFile(null); setPreview(null); }}
                className="text-xs text-[var(--neon-blue)] hover:underline mt-2"
              >
                Scan different photo
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Meal Description
              </label>
              <input
                type="text"
                value={form.foodName}
                onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-1">
                  Calories
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                    className="input-field w-full pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">
                    kcal
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--success)] uppercase tracking-wider mb-1">
                  Protein
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.protein}
                    onChange={(e) => setForm({ ...form, protein: e.target.value })}
                    className="input-field w-full pr-6"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">
                    g
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--warning)] uppercase tracking-wider mb-1">
                  Carbs
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.carbs}
                    onChange={(e) => setForm({ ...form, carbs: e.target.value })}
                    className="input-field w-full pr-6"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">
                    g
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--danger)] uppercase tracking-wider mb-1">
                  Fat
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.fat}
                    onChange={(e) => setForm({ ...form, fat: e.target.value })}
                    className="input-field w-full pr-6"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">
                    g
                  </span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Log to Diary
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FoodScanner;
