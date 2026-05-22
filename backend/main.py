import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

# Import our custom components
from backend.agents.analyst_agent import SupplyChainAnalystAgent

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Supply Chain Multimodal Analyst Agent API",
    description="Backend API for sandboxed AI data analysis on supply chain inventories and screenshots",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "data", "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "data", "outputs")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Mount outputs folder to serve generated charts directly
app.mount("/api/charts", StaticFiles(directory=OUTPUTS_DIR), name="charts")

@app.get("/api/health")
async def health_check():
    """
    Checks the status of the backend API and Gemini configuration.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "healthy",
        "gemini_api_configured": bool(gemini_key),
        "workspace_directories": {
            "uploads": os.path.exists(UPLOADS_DIR),
            "outputs": os.path.exists(OUTPUTS_DIR)
        }
    }

@app.post("/api/analyze")
async def analyze_supply_chain(
    file: Optional[UploadFile] = File(None),
    query: Optional[str] = Form("Clean and analyze this supply chain dataset, resolve any data formatting/unit anomalies, estimate holding costs or reorder levels, and output a premium dashboard visualization.")
):
    """
    Uploads a CSV dataset or dashboard screenshot and executes the AI agent.
    If no file is provided, falls back to the default sample dataset (messy_inventory.csv).
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(
            status_code=500, 
            detail="GEMINI_API_KEY is not configured in backend environment. Please create a .env file with GEMINI_API_KEY."
        )

    # Instantiate Agent
    try:
        agent = SupplyChainAnalystAgent(api_key=gemini_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize analyst agent: {str(e)}")

    csv_path = None
    image_path = None

    # Handle file upload if provided
    if file:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [".csv", ".png", ".jpg", ".jpeg", ".webp"]:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Please upload a .csv file or a screenshot (.png, .jpg, .jpeg)."
            )

        # Save the uploaded file locally
        target_path = os.path.join(UPLOADS_DIR, file.filename)
        try:
            with open(target_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

        if file_ext == ".csv":
            csv_path = target_path
        else:
            image_path = target_path
    else:
        # Fallback to messy_inventory.csv if no file is provided
        default_csv = os.path.join(BASE_DIR, "data", "messy_inventory.csv")
        if os.path.exists(default_csv):
            csv_path = default_csv
        else:
            raise HTTPException(
                status_code=400, 
                detail="No file uploaded and default messy_inventory.csv is missing. Please upload a file."
            )

    # Run agent analysis
    try:
        results = agent.analyze_data(
            csv_path=csv_path,
            image_path=image_path,
            user_query=query
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failed: {str(e)}")

@app.get("/api/sample-csv")
async def get_sample_csv():
    """
    Returns the content or verification status of the sample messy dataset.
    """
    default_csv = os.path.join(BASE_DIR, "data", "messy_inventory.csv")
    if not os.path.exists(default_csv):
        raise HTTPException(status_code=404, detail="Sample CSV not found.")
    
    try:
        with open(default_csv, "r") as f:
            content = f.read()
        return {"filename": "messy_inventory.csv", "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
