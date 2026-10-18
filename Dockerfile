# PIGHACK — Atelier IA (service FastAPI des défis 7.1 → 7.8)
# Contexte de build : racine du dépôt.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY lab/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY lab/app ./app

ENV PORT=8090
EXPOSE 8090

# Écoute sur 0.0.0.0 et sur le port fourni par la plateforme ($PORT).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8090}"]
