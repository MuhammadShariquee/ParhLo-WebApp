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
        response = await llm_router.generate_response(prompt, mode="chat", system_prompt=system_prompt)
        if response.startswith("ERROR_LIMIT:") or response.startswith("ERROR_QUOTA:"):
            raise ValueError(response)
        return response

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

        BATCH_SIZE = 15
        batches = [context_chunks[i:i + BATCH_SIZE] for i in range(0, len(context_chunks), BATCH_SIZE)]
        all_notes = []

        lang_instructions = {
            "english": "Write notes in English.",
            "urdu": "Notes Roman Urdu ya Urdu mein likhein.",
            "roman_urdu": "Notes Roman Urdu mein likhein."
        }
        lang_instr = lang_instructions.get(language, lang_instructions["english"])
        system_prompt = self._build_rag_system_prompt()

        for idx, batch in enumerate(batches):
            context_parts = []
            for chunk in batch:
                context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
            context_str = "\n\n".join(context_parts)

            part_instruction = f"This is Part {idx + 1} of {len(batches)} of the document. " if len(batches) > 1 else ""

            prompt = f"""Based on the following content from a student's study material, generate structured study notes.

CONTENT ({part_instruction}):
{context_str}

INSTRUCTIONS:
- {lang_instr}
- Format as structured bullet points
- Include: Key Concepts, Important Points, Summary
- Use • for main points and  - for sub-points
- Keep it exam-focused
- Only use information from the provided content

Generate comprehensive study notes:"""

            batch_notes = await self.generate(prompt, system_prompt)
            if len(batches) > 1:
                all_notes.append(f"## Part {idx + 1}\n{batch_notes}")
            else:
                all_notes.append(batch_notes)

        return "\n\n".join(all_notes)

    async def generate_mcqs(self, context_chunks: List[Dict], count: int = 5) -> List[Dict]:
        """Generate MCQs from context. Returns structured list."""
        if not context_chunks:
            return []

        BATCH_SIZE = 15
        batches = [context_chunks[i:i + BATCH_SIZE] for i in range(0, len(context_chunks), BATCH_SIZE)]
        
        questions_per_batch = max(1, count // len(batches))
        remainder = count % len(batches)
        
        all_mcqs = []
        system_prompt = "You are a quiz generator. Return ONLY valid JSON, nothing else."

        for idx, batch in enumerate(batches):
            if len(all_mcqs) >= count:
                break
                
            batch_count = questions_per_batch + (1 if idx < remainder else 0)
            if batch_count == 0:
                continue

            context_parts = []
            for chunk in batch:
                context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
            context_str = "\n\n".join(context_parts)

            prompt = f"""Generate {batch_count} multiple choice questions (MCQs) from this study material.

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
- Generate exactly {batch_count} questions
- Questions must be from the provided content ONLY
- Each question must have exactly 4 options (A, B, C, D)
- correct field should be just the letter: A, B, C, or D
- Make questions exam-style, relevant to Pakistani curriculum
- Return ONLY the JSON array, no other text"""

            raw = await self.generate(prompt, system_prompt)

            try:
                json_match = re.search(r'\[.*\]', raw, re.DOTALL)
                if json_match:
                    mcqs = json.loads(json_match.group())
                    all_mcqs.extend(mcqs)
            except Exception as e:
                logger.error(f"MCQ parsing error in batch {idx}: {e}, raw: {raw[:200]}")

        return all_mcqs[:count]

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

        BATCH_SIZE = 15
        batches = [context_chunks[i:i + BATCH_SIZE] for i in range(0, len(context_chunks), BATCH_SIZE)]
        
        all_questions = []

        total_counts = { "important": 10, "short": 10, "long": 6 }
        total_count = total_counts.get(question_type, 10)
        qs_per_batch = max(1, total_count // len(batches))
        remainder = total_count % len(batches)

        lang_instructions = {
            "english": "Write in English.",
            "urdu": "Urdu mein likhein.",
            "roman_urdu": "Roman Urdu mein likhein."
        }
        lang_instr = lang_instructions.get(language, lang_instructions["english"])
        system_prompt = self._build_rag_system_prompt()

        for idx, batch in enumerate(batches):
            batch_count = qs_per_batch + (1 if idx < remainder else 0)
            if batch_count == 0:
                continue

            type_instructions = {
                "important": f"Generate {batch_count} most important/likely exam questions from this section.",
                "short": f"Generate {batch_count} short answer questions (2-3 marks each) from this section. Each question should be answerable in 2-3 sentences.",
                "long": f"Generate {batch_count} long answer questions (5-10 marks each) from this section. These should require detailed paragraph answers."
            }
            type_instr = type_instructions.get(question_type, type_instructions["important"])

            context_parts = []
            for chunk in batch:
                context_parts.append(f"[Page {chunk['page']}]: {chunk['text']}")
            context_str = "\n\n".join(context_parts)
            
            part_instruction = f"This is Part {idx + 1} of {len(batches)}. " if len(batches) > 1 else ""

            prompt = f"""Based on this study material, generate exam questions for Pakistani students.

CONTENT ({part_instruction}):
{context_str}

INSTRUCTIONS:
- {type_instr}
- {lang_instr}
- Based ONLY on the provided content
- Number each question
- Match Pakistani university/college exam patterns
- Include marks in brackets e.g. [3 Marks] or [5 Marks]

Generate questions:"""

            batch_qs = await self.generate(prompt, system_prompt)
            if len(batches) > 1:
                all_questions.append(f"### Questions from Part {idx + 1}\n{batch_qs}")
            else:
                all_questions.append(batch_qs)

        return "\n\n".join(all_questions)

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
