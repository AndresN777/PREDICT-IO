from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.config import settings
from app.services.analytics_service import AnalyticsService
from app.services.data_service import DataService
from app.services.prediction_service import PredictionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    data_service = DataService(settings.parquet_path)
    app.state.data_service = data_service
    app.state.analytics_service = AnalyticsService(data_service)
    app.state.prediction_service = PredictionService(data_service)
    yield


app = FastAPI(title="Predict IO API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")
