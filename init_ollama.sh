#!/bin/bash
set -e

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
until curl -s http://ollama:11434/api/tags >/dev/null; do
  echo "Ollama not ready yet, waiting..."
  sleep 5
done

echo "Pulling Mistral model..."
curl -X POST http://ollama:11434/api/pull -d '{"name": "mistral:7b-instruct"}'

echo "Ollama setup complete!"
