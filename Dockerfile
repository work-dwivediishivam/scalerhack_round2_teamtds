FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml README.md openenv.yaml ./
COPY src ./src
COPY scripts ./scripts
COPY results ./results
COPY web/out ./web/out

RUN pip install --no-cache-dir -e .

EXPOSE 7860

CMD ["uvicorn", "runway_zero.server:app", "--host", "0.0.0.0", "--port", "7860"]
