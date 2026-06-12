from groq import AsyncGroq
from app.core.config import settings
from loguru import logger

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)
            logger.info("Groq AI initialized for routing.")
        else:
            self.client = None
            logger.warning("GROQ_API_KEY not set for GroqService.")

    async def generate_response(self, prompt: str, mode: str = "chat", system_prompt: str = None) -> str:
        if not self.client:
            raise Exception("API key error: Groq API key not configured")

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str:
                logger.warning(f"Groq 429 Too Many Requests: {e}")
                raise Exception("429 Too Many Requests") from e
            elif "503" in error_str:
                logger.warning(f"Groq 503 Service Unavailable: {e}")
                raise Exception("503 Service Unavailable") from e
            elif "timeout" in error_str:
                logger.warning(f"Groq Timeout: {e}")
                raise Exception("Timeout error") from e
            else:
                logger.warning(f"Groq API Error: {e}")
                raise Exception(f"API Error: {e}") from e
