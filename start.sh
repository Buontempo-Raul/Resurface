#!/bin/bash
# Quick start script for Resurface

echo "🚀 Starting Resurface..."
docker-compose up -d --build --progress=plain

echo ""
echo "✅ Done! Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
