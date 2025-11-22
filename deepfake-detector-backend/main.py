"""
Main FastAPI application

This is the entry point for the Deepfake Detection API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.endpoints import router


# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler for unhandled errors
    
    Args:
        request: The request that caused the exception
        exc: The exception that was raised
        
    Returns:
        JSONResponse with error details
    """
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": f"Internal server error: {str(exc)}"
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Application startup event
    
    Performs initialization tasks when the server starts.
    """
    print("=" * 60)
    print(f"🚀 {settings.API_TITLE} v{settings.API_VERSION}")
    print("=" * 60)
    print(f"📝 Mode: {'MOCK' if settings.USE_MOCK_DETECTOR else 'PRODUCTION'}")
    print(f"🌐 CORS: {', '.join(settings.CORS_ORIGINS)}")
    print(f"📊 Max file size: {settings.MAX_FILE_SIZE / (1024 * 1024):.1f}MB")
    print(f"📁 Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}")
    print(f"🔍 Model version: {settings.MODEL_VERSION}")
    print("=" * 60)
    print(f"📖 API Documentation: http://localhost:{settings.PORT}/docs")
    print("=" * 60)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event
    
    Performs cleanup tasks when the server stops.
    """
    print("\n" + "=" * 60)
    print("👋 Shutting down Deepfake Detection API")
    print("=" * 60)


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint
    
    Returns:
        Welcome message with API information
    """
    return {
        "message": "Welcome to the Deepfake Detection API",
        "version": settings.API_VERSION,
        "status": "running",
        "documentation": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
