import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.ws_routes import ws_router
from app.workers.manager import start_event_workers

app = FastAPI(title="Vibecheck Controller Realtime Backend")

origins_env = os.getenv("ALLOWED_ORIGINS")
origins = [origin.strip() for origin in origins_env.split(",")] if origins_env else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(ws_router)

@app.on_event("startup")
async def startup_event():
    # Keep default test-event running for local dev
    start_event_workers("test-event")
