// OpenRouter API Configuration
const API_CONFIG = {
    // OpenRouter Endpoint
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    
    // API Key (wird vom Benutzer gesetzt)
    apiKey: localStorage.getItem('openrouter_api_key') || '',
    
    // Default Model
    defaultModel: 'openai/gpt-4o',
    
    // Alternative Models
    models: {
        'openai/gpt-4o': { name: 'OpenAI GPT-4o', cost: '~$0.01/Bild' },
        'openai/gpt-4o-mini': { name: 'OpenAI GPT-4o Mini', cost: '~$0.001/Bild' },
        'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', cost: '~$0.008/Bild' },
        'google/gemini-2.0-flash-exp': { name: 'Gemini 2.0 Flash', cost: '~$0.001/Bild' }
    },
    
    // System Prompt für Wasserzähler-Erkennung
    systemPrompt: `Du bist ein Experte für die Erkennung von Wasserzählerständen. 
Analysiere das Bild und extrahiere den Zählerstand.
Der Zählerstand besteht typischerweise aus 5 schwarzen Ziffern (Kubikmeter) und 3 roten Ziffern (Liter).
Gib NUR die Zahl zurück im Format: XXXXX.XXX (z.B. 123.456)
Wenn du den Zählerstand nicht eindeutig erkennen kannst, antworte mit "FEHLER: [Beschreibung]".`
};

// API Key setzen
function setApiKey(key) {
    localStorage.setItem('openrouter_api_key', key);
    API_CONFIG.apiKey = key;
}

// API Key auslesen
function getApiKey() {
    return API_CONFIG.apiKey;
}

// Modell setzen
function setModel(model) {
    localStorage.setItem('openrouter_model', model);
    API_CONFIG.defaultModel = model;
}

// Modell auslesen
function getModel() {
    return localStorage.getItem('openrouter_model') || API_CONFIG.defaultModel;
}
