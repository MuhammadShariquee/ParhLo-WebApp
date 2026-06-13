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
        last_error = ""
        try:
            logger.info(f"Routing request to OpenAI (Final Fallback). Mode: {mode}")
            return await self.openai.generate_response(prompt, mode, system_prompt)
        except Exception as e:
            last_error = str(e).lower()
            logger.error(f"OpenAI failed: {e}. All providers exhausted.")

        # Friendly error message if all fail
        if "413" in last_error or "token" in last_error or "too large" in last_error or "maximum context" in last_error:
            return "ERROR_LIMIT:This document/request is quite large for our free AI tier. Try asking a more specific question, or generating notes for a smaller section."
        
        return "ERROR_QUOTA:We've reached our free AI usage limit for now. This typically resets within a few minutes to an hour. Please try again shortly!"

# Singleton instance
llm_router = LLMRouter()
