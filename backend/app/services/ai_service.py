"""
AIService — Unified AI wrapper.
Supports Gemini (primary) with easy switch to OpenAI.
All AI calls go through this service.
"""
from app.services.llm.llm_router import llm_router
from app.core.config import settings
from loguru import logger
from typing import List, Dict, Optional
import json
import re


class AIService:
    """Unified AI service powered by a multi-LLM fallback router."""

    def __init__(self):
        # We no longer need to initialize specific providers here,
        # as the llm_router handles everything.
        pass

    async def generate(self, prompt: str, system_prompt: str = None) -> str:
        """Generate text from a prompt, routed through the fallback system."""
        return await llm_router.generate_response(prompt, mode="chat", system_prompt=system_prompt)

    def _build_rag_system_prompt(self) -> str:
        return """You are ParhLo, an AI study assistant for Pakistani students.

CRITICAL RULES:
1. ONLY answer from the provided context chunks. Do NOT use external knowledge.
2. If the answer is not in the context, respond EXACTLY: "Yeh information aapki uploaded material mein available nahi hai."
3. Always cite the page number(s) where you found the answer.
4. Be helpful, clear, and student-friendly.
5. Support English, Urdu, and Roman Urdu naturally.

You help students understand their study material better."""

    async def answer_question(
        self,
        question: str,
        context_chunks: List[Dict],
        detail_level: str = "medium",
        language: str = "english"
    ) -> Dict:
        """
        Answer a question using RAG context.
        Returns: {"answer": str, "source_pages": List[int], "used_context": bool}
        """
        if not context_chunks:
            return {
                "answer": "Yeh information aapki uploaded material mein available nahi hai.",
                "source_pages": [],
                "used_context": False
            }

        # Build context string
        context_parts = []
        for chunk in context_chunks:
            context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
        context_str = "\n\n".join(context_parts)

        # Detail level instruction
        detail_instructions = {
            "simple": "Give a very simple, easy-to-understand answer in 2-3 sentences. Use simple words.",
            "medium": "Give a clear, moderate-length answer with key points explained.",
            "detailed": "Give a comprehensive, detailed answer covering all aspects found in the context."
        }
        detail_instr = detail_instructions.get(detail_level, detail_instructions["medium"])

        # Language instruction
        lang_instructions = {
            "english": "Respond in English.",
            "urdu": "Urdu mein jawab dein (Roman Urdu ya Urdu script).",
            "roman_urdu": "Roman Urdu mein jawab dein (English letters mein Urdu)."
        }
        lang_instr = lang_instructions.get(language, lang_instructions["english"])

        system_prompt = self._build_rag_system_prompt()

        prompt = f"""CONTEXT FROM UPLOADED PDF:
{context_str}

STUDENT QUESTION: {question}

INSTRUCTIONS:
- {detail_instr}
- {lang_instr}
- At the end, mention which page(s) the answer was found on.
- Format: Answer first, then "Source: Page X" or "Source: Pages X, Y"
- Only use information from the context above."""

        try:
            raw_answer = await self.generate(prompt, system_prompt)
            source_pages = self._extract_source_pages(context_chunks)
            return {
                "answer": raw_answer,
                "source_pages": source_pages,
                "used_context": True
            }
        except Exception as e:
            logger.error(f"answer_question error: {e}")
            raise

    def _extract_source_pages(self, chunks: List[Dict]) -> List[int]:
        pages = list(set([c["page"] for c in chunks if c.get("page")]))
        return sorted(pages)

    async def generate_notes(self, context_chunks: List[Dict], language: str = "english") -> str:
        """Generate structured bullet-point notes from context."""
        if not context_chunks:
            return "No content available to generate notes."

        context_parts = []
        for chunk in context_chunks:
            context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
        context_str = "\n\n".join(context_parts)

        lang_instructions = {
            "english": "Write notes in English.",
            "urdu": "Notes Roman Urdu ya Urdu mein likhein.",
            "roman_urdu": "Notes Roman Urdu mein likhein."
        }
        lang_instr = lang_instructions.get(language, lang_instructions["english"])

        prompt = f"""Based on the following content from a student's study material, generate structured study notes.

CONTENT:
{context_str}

INSTRUCTIONS:
- {lang_instr}
- Format as structured bullet points
- Include: Key Concepts, Important Points, Summary
- Use • for main points and  - for sub-points
- Keep it exam-focused
- Only use information from the provided content

Generate comprehensive study notes:"""

        system_prompt = self._build_rag_system_prompt()
        return await self.generate(prompt, system_prompt)

    async def generate_mcqs(self, context_chunks: List[Dict], count: int = 5) -> List[Dict]:
        """Generate MCQs from context. Returns structured list."""
        if not context_chunks:
            return []

        context_parts = []
        for chunk in context_chunks:
            context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
        context_str = "\n\n".join(context_parts)

        prompt = f"""Generate {count} multiple choice questions (MCQs) from this study material.

CONTENT:
{context_str}

STRICT FORMAT — Return ONLY valid JSON array, nothing else:
[
  {{
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A",
    "explanation": "Brief explanation why this is correct.",
    "page": 1
  }}
]

Rules:
- Generate exactly {count} questions
- Questions must be from the provided content ONLY
- Each question must have exactly 4 options (A, B, C, D)
- correct field should be just the letter: A, B, C, or D
- Make questions exam-style, relevant to Pakistani curriculum
- Return ONLY the JSON array, no other text"""

        system_prompt = "You are a quiz generator. Return ONLY valid JSON, nothing else."
        raw = await self.generate(prompt, system_prompt)

        # Parse JSON
        try:
            # Extract JSON from response
            json_match = re.search(r'\[.*\]', raw, re.DOTALL)
            if json_match:
                mcqs = json.loads(json_match.group())
                return mcqs[:count]
        except Exception as e:
            logger.error(f"MCQ parsing error: {e}, raw: {raw[:200]}")

        return []

    async def generate_exam_questions(
        self,
        context_chunks: List[Dict],
        question_type: str = "important",
        language: str = "english"
    ) -> str:
        """
        Generate exam-style questions.
        question_type: 'important', 'short', 'long'
        """
        if not context_chunks:
            return "No content available."

        context_parts = []
        for chunk in context_chunks:
            context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
        context_str = "\n\n".join(context_parts)

        type_instructions = {
            "important": "Generate 10 most important/likely exam questions from this material. These should be the questions most likely to appear in a Pakistani university/college exam.",
            "short": "Generate 8-10 short answer questions (2-3 marks each) in Pakistani exam style. Each question should be answerable in 2-3 sentences.",
            "long": "Generate 5-7 long answer questions (5-10 marks each) in Pakistani exam style. These should require detailed paragraph answers."
        }
        type_instr = type_instructions.get(question_type, type_instructions["important"])

        lang_instructions = {
            "english": "Write in English.",
            "urdu": "Urdu mein likhein.",
            "roman_urdu": "Roman Urdu mein likhein."
        }
        lang_instr = lang_instructions.get(language, lang_instructions["english"])

        prompt = f"""Based on this study material, generate exam questions for Pakistani students.

CONTENT:
{context_str}

INSTRUCTIONS:
- {type_instr}
- {lang_instr}
- Based ONLY on the provided content
- Number each question
- Match Pakistani university/college exam patterns
- Include marks in brackets e.g. [3 Marks] or [5 Marks]

Generate questions:"""

        system_prompt = self._build_rag_system_prompt()
        return await self.generate(prompt, system_prompt)

    async def apply_quick_action(
        self,
        action: str,
        original_question: str,
        answer: str,
        context_chunks: List[Dict]
    ) -> str:
        """Apply quick actions: explain_simply, make_shorter, generate_mcqs."""
        if action == "explain_simply":
            prompt = f"Explain this more simply for a student:\n\n{answer}\n\nUse very simple words, short sentences. Maximum 3 sentences."
            return await self.generate(prompt)
        elif action == "make_shorter":
            prompt = f"Make this answer shorter and more concise. Keep only the most important points:\n\n{answer}"
            return await self.generate(prompt)
        elif action == "generate_mcqs":
            mcqs = await self.generate_mcqs(context_chunks, count=3)
            if mcqs:
                result = "Here are 3 MCQs based on this topic:\n\n"
                for i, mcq in enumerate(mcqs, 1):
                    result += f"**Q{i}.** {mcq['question']}\n"
                    for opt in mcq['options']:
                        result += f"   {opt}\n"
                    result += f"   ✅ Answer: {mcq['correct']}\n\n"
                return result
            return "Could not generate MCQs from available content."
        else:
            return answer


# Singleton
ai_service = AIService()
