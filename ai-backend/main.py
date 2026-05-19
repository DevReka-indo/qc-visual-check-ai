from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from pathlib import Path
import shutil
import uuid
from datetime import datetime

app = FastAPI(title="REKA AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path("models/best.pt")
UPLOAD_DIR = Path("uploads/predictions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model tidak ditemukan di {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "AI Backend Running",
    }


@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "backend": "running",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "upload_dir": str(UPLOAD_DIR),
    }


@app.get("/api/model-info")
def model_info():
    return {
        "success": True,
        "classes": model.names,
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    saved_path = None

    try:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            ext = ".jpg"

        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex}{ext}"
        saved_path = UPLOAD_DIR / filename

        with saved_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model(str(saved_path), conf=0.05)
        r = results[0]

        detections = []

        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = r.names[cls_id]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "label": label,
                "confidence": confidence,
                "box": [x1, y1, x2, y2],
            })

        image_url = f"/uploads/predictions/{filename}"

        if not detections:
            return {
                "success": True,
                "data": {
                    "label": "normal",
                    "confidence": 0.0,
                    "box": None,
                    "all_detections": [],
                    "image_path": str(saved_path),
                    "image_url": image_url,
                },
            }

        best = max(detections, key=lambda x: x["confidence"])

        return {
            "success": True,
            "data": {
                "label": best["label"],
                "confidence": best["confidence"],
                "box": best["box"],
                "all_detections": detections,
                "image_path": str(saved_path),
                "image_url": image_url,
            },
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "image_path": str(saved_path) if saved_path else None,
        }