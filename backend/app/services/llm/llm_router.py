from .gemini_service import GeminiService
from .groq_service import GroqService
from .openai_service import OpenAIService
from loguru import logger

class LLMRouter:
    def __init__(self):
        self.gemini = GeminiService()
        self.groq = GroqService()
        self.openai = OpenAIService()

    async def generate_response(self, prompt: str, mode: str = "chat", system_prompt: str = None) -> str:
        """
        Routes the LLM generation request with fallback logic:
        1. Gemini (Primary)
        2. Groq (Secondary Fallback)
        3. OpenAI (Final Fallback)
        """
        # Try Gemini
        try:
            logger.info(f"Routing request to Gemini (Primary). Mode: {mode}")
            return await self.gemini.generate_response(prompt, mode, system_prompt)
        except Exception as e:
            logger.warning(f"Gemini failed: {e}. Switching to Groq.")
        
        # Try Groq
        try:
            logger.info(f"Routing request to Groq (Secondary). Mode: {mode}")
            return await self.groq.generate_response(prompt, mode, system_prompt)
        except Exception as e:
            logger.warning(f"Groq failed: {e}. Switching to OpenAI.")

        # Try OpenAI
        try:
            logger.info(f"Routing request to OpenAI (Final Fallback). Mode: {mode}")
            return await self.openai.generate_response(prompt, mode, system_prompt)
        except Exception as e:
            logger.error(f"OpenAI failed: {e}. All providers exhausted.")

        # Friendly error message if all fail
        return "I'm currently experiencing high traffic and unable to connect to my AI providers. Please try again in a few moments."

# Singleton instance
llm_router = LLMRouter()
