import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, DeadlineExceeded
from app.core.config import settings
from loguru import logger

class GeminiService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel("gemini-2.0-flash")
            logger.info("Gemini AI initialized for routing.")
        else:
            self._model = None
            logger.warning("GEMINI_API_KEY not set for GeminiService.")

    async def generate_response(self, prompt: str, mode: str = "chat", system_prompt: str = None) -> str:
        if not self._model:
            raise Exception("API key error: Gemini API key not configured")

        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            # google-generativeai generate_content is synchronous or asynchronous.
            # We'll use generate_content_async if available, else run sync
            # Note: For simple text generation, .generate_content works sync,
            # but .generate_content_async is supported.
            response = await self._model.generate_content_async(full_prompt)
            return response.text
        except ResourceExhausted as e:
            logger.warning(f"Gemini 429 Resource Exhausted: {e}")
            raise Exception("429 Too Many Requests") from e
        except ServiceUnavailable as e:
            logger.warning(f"Gemini 503 Service Unavailable: {e}")
            raise Exception("503 Service Unavailable") from e
        except DeadlineExceeded as e:
            logger.warning(f"Gemini Timeout: {e}")
            raise Exception("Timeout error") from e
        except Exception as e:
            logger.warning(f"Gemini API Error: {e}")
            raise Exception(f"API Error: {e}") from e
