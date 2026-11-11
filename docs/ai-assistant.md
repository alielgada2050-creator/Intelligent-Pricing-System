# AI assistant setup

The app's AI settings support an optional local model through Ollama or LM Studio. Local inference needs no provider API key and does not send prompts to a cloud AI provider. The model must already be installed and running on the same device as the browser.

## Ollama

1. Install Ollama and download a model, for example `ollama pull llama3.1`.
2. Ensure its local API is running at `http://localhost:11434`.
3. In the app, open the AI assistant settings, choose **Local free model (Ollama / LM Studio)**, and use the model's exact installed name. Save and test the connection.

The default endpoint is `http://localhost:11434/v1`. Browser access can depend on the app's origin and the local server's CORS settings. A failed connection is reported by the app; it does not fall back to a cloud provider.

## LM Studio

Start LM Studio's local server with its OpenAI-compatible API enabled, then set the endpoint to the server's base URL (including `/v1`) and the model identifier shown by LM Studio. No API key is required for local inference.

## Cloud providers and data

Cloud providers require a provider-issued API key. The current browser-only app stores that key in unencrypted `localStorage`; this is suitable only for controlled development/testing, not production credentials. Prompts and the context assembled by the app are sent directly from the browser to the configured provider. Do not send confidential project, customer, or contract data until an approved server-side integration and data policy are in place.

The shared Gemini link is an external service and follows that service's own account, privacy, and billing terms. No provider is contacted automatically just by opening the assistant page.
