"""LLM service for AI model integration."""

import asyncio
import logging
import time
from typing import List, Dict, Any, Optional, AsyncGenerator
import json

import httpx
import openai
from openai import AsyncOpenAI

from app.core.config import settings
from app.models.chat import ChatMessage, MessageRole
from app.models.document import DocumentSource

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM integration and response generation."""
    
    def __init__(self):
        self.client = None
        self.model_name = settings.llm_model
        self.base_url = settings.llm_base_url
        self.api_key = settings.llm_api_key
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature
        self.is_mock_mode = (
            "mock" in self.api_key.lower() or
            self.api_key == "test" or
            self.api_key == "local" or
            settings.llm_provider == "ollama"
        )
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize LLM client based on provider."""
        try:
            if settings.llm_provider == "openai":
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            elif settings.llm_provider == "ollama":
                # For Ollama local development
                self.client = AsyncOpenAI(
                    api_key="local",  # Ollama doesn't need real API key
                    base_url=self.base_url
                )
            else:
                # For CoreWeave or other OpenAI-compatible providers
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            
            logger.info(f"LLM client initialized: {settings.llm_provider} - {self.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM client: {e}")
            raise
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        document_context: Optional[List[DocumentSource]] = None
    ) -> Dict[str, Any]:
        """Generate AI response for given messages."""
        try:
            start_time = time.time()
            
            # Prepare messages for the API
            api_messages = self._prepare_messages(messages, system_prompt, document_context)
            
            # Use provided parameters or defaults
            response_temperature = temperature or self.temperature
            response_max_tokens = max_tokens or self.max_tokens
            
            # Make API call
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=api_messages,
                temperature=response_temperature,
                max_tokens=response_max_tokens,
                top_p=0.9,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            # Calculate response time
            response_time_ms = int((time.time() - start_time) * 1000)
            
            # Extract response content
            content = response.choices[0].message.content
            finish_reason = response.choices[0].finish_reason
            
            # Extract usage information
            usage = response.usage
            tokens_used = usage.total_tokens if usage else 0
            
            # Calculate confidence score based on response quality
            confidence_score = self._calculate_confidence_score(content, finish_reason)
            
            # Extract sources if document context was provided
            sources = document_context or []
            
            return {
                "content": content,
                "tokens_used": tokens_used,
                "response_time_ms": response_time_ms,
                "confidence_score": confidence_score,
                "sources": [source.dict() for source in sources],
                "model_name": self.model_name,
                "finish_reason": finish_reason,
                "is_complete": finish_reason == "stop"
            }
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            return {
                "content": "I apologize, but I'm experiencing technical difficulties. Please try again later.",
                "tokens_used": 0,
                "response_time_ms": 0,
                "confidence_score": 0.0,
                "sources": [],
                "model_name": self.model_name,
                "finish_reason": "error",
                "is_complete": False,
                "error": str(e)
            }
    
    async def generate_streaming_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        document_context: Optional[List[DocumentSource]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming AI response."""

        # Handle mock mode for development
        if self.is_mock_mode:
            async for response_chunk in self._generate_mock_streaming_response(messages):
                yield response_chunk
            return

        try:
            start_time = time.time()

            # Prepare messages for the API
            api_messages = self._prepare_messages(messages, system_prompt, document_context)

            # Use provided parameters or defaults
            response_temperature = temperature or self.temperature
            response_max_tokens = max_tokens or self.max_tokens

            # Make streaming API call
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=api_messages,
                temperature=response_temperature,
                max_tokens=response_max_tokens,
                top_p=0.9,
                frequency_penalty=0.0,
                presence_penalty=0.0,
                stream=True
            )
            
            full_content = ""
            tokens_used = 0
            finish_reason = None
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content_delta = chunk.choices[0].delta.content
                    full_content += content_delta
                    
                    yield {
                        "content_delta": content_delta,
                        "full_content": full_content,
                        "is_complete": False,
                        "sources": [source.dict() for source in (document_context or [])],
                        "model_name": self.model_name
                    }
                
                if chunk.choices[0].finish_reason:
                    finish_reason = chunk.choices[0].finish_reason
                    break
            
            # Final response with complete information
            response_time_ms = int((time.time() - start_time) * 1000)
            confidence_score = self._calculate_confidence_score(full_content, finish_reason)
            
            yield {
                "content_delta": "",
                "full_content": full_content,
                "is_complete": True,
                "tokens_used": tokens_used,
                "response_time_ms": response_time_ms,
                "confidence_score": confidence_score,
                "sources": [source.dict() for source in (document_context or [])],
                "model_name": self.model_name,
                "finish_reason": finish_reason
            }
            
        except Exception as e:
            logger.error(f"Error generating streaming LLM response: {e}")
            yield {
                "content_delta": "",
                "full_content": "I apologize, but I'm experiencing technical difficulties. Please try again later.",
                "is_complete": False,
                "error": str(e),
                "sources": [],
                "model_name": self.model_name
            }
    
    def _prepare_messages(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        document_context: Optional[List[DocumentSource]] = None
    ) -> List[Dict[str, str]]:
        """Prepare messages for LLM API."""
        api_messages = []
        
        # Add system prompt
        system_content = self._build_system_prompt(system_prompt, document_context)
        if system_content:
            api_messages.append({
                "role": "system",
                "content": system_content
            })
        
        # Add conversation messages
        for message in messages:
            api_messages.append({
                "role": message["role"],
                "content": message["content"]
            })
        
        # Ensure we don't exceed context window
        api_messages = self._truncate_messages_to_context_window(api_messages)
        
        return api_messages
    
    def _build_system_prompt(
        self,
        custom_prompt: Optional[str] = None,
        document_context: Optional[List[DocumentSource]] = None
    ) -> str:
        """Build comprehensive system prompt."""
        base_prompt = """You are a specialized AI assistant for legal professionals. Your role is to provide accurate, helpful, and contextually relevant responses about legal documents and general legal questions.

Key guidelines:
- Always prioritize accuracy and cite sources when referencing specific documents
- If you're uncertain about legal advice, clearly state the limitations
- Use professional, clear language appropriate for legal professionals
- When analyzing documents, provide specific page references and excerpts
- Maintain confidentiality and handle all information with appropriate legal discretion

Important: You should not provide specific legal advice that could be construed as practicing law. Always recommend consulting with qualified legal counsel for specific legal decisions."""
        
        # Add custom prompt if provided
        if custom_prompt:
            base_prompt += f"\n\nAdditional instructions: {custom_prompt}"
        
        # Add document context if available
        if document_context:
            base_prompt += "\n\nDocument Context:\n"
            for i, source in enumerate(document_context[:5], 1):  # Limit to 5 sources
                base_prompt += f"\n{i}. Document: {source.document_title}"
                if source.page_number:
                    base_prompt += f" (Page {source.page_number})"
                base_prompt += f"\nExcerpt: {source.excerpt}\n"
        
        return base_prompt
    
    def _truncate_messages_to_context_window(
        self,
        messages: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """Truncate messages to fit within context window."""
        # Simple token estimation (1 token ≈ 4 characters)
        max_chars = self.max_tokens * 4
        
        total_chars = sum(len(msg["content"]) for msg in messages)
        
        if total_chars <= max_chars:
            return messages
        
        # Keep system message and truncate from oldest conversation messages
        system_messages = [msg for msg in messages if msg["role"] == "system"]
        conversation_messages = [msg for msg in messages if msg["role"] != "system"]
        
        # Calculate available space for conversation
        system_chars = sum(len(msg["content"]) for msg in system_messages)
        available_chars = max_chars - system_chars
        
        # Keep messages from newest to oldest that fit in available space
        truncated_conversation = []
        current_chars = 0
        
        for message in reversed(conversation_messages):
            message_chars = len(message["content"])
            if current_chars + message_chars <= available_chars:
                truncated_conversation.insert(0, message)
                current_chars += message_chars
            else:
                break
        
        return system_messages + truncated_conversation
    
    def _calculate_confidence_score(
        self,
        content: str,
        finish_reason: Optional[str]
    ) -> float:
        """Calculate confidence score for the response."""
        if not content:
            return 0.0
        
        base_score = 0.7
        
        # Adjust based on finish reason
        if finish_reason == "stop":
            base_score += 0.2
        elif finish_reason == "length":
            base_score += 0.1
        elif finish_reason == "content_filter":
            base_score -= 0.3
        
        # Adjust based on content quality indicators
        if len(content) < 10:
            base_score -= 0.2
        elif len(content) > 100:
            base_score += 0.1
        
        # Check for uncertainty indicators
        uncertainty_phrases = [
            "i'm not sure",
            "i don't know",
            "unclear",
            "might be",
            "possibly",
            "perhaps"
        ]
        
        content_lower = content.lower()
        uncertainty_count = sum(1 for phrase in uncertainty_phrases if phrase in content_lower)
        base_score -= uncertainty_count * 0.1
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, base_score))
    
    async def summarize_document(
        self,
        document_text: str,
        max_length: int = 500
    ) -> Dict[str, Any]:
        """Generate a summary of document text."""
        try:
            # Prepare summarization prompt
            messages = [
                {
                    "role": "system",
                    "content": f"You are a legal document summarizer. Provide a clear, concise summary of the following document in approximately {max_length} characters. Focus on key legal points, parties involved, and main provisions."
                },
                {
                    "role": "user",
                    "content": f"Please summarize this document:\n\n{document_text[:8000]}"  # Limit input text
                }
            ]
            
            response = await self.generate_response(
                messages=messages,
                temperature=0.1,
                max_tokens=max_length // 3  # Rough token estimation
            )
            
            return {
                "summary": response["content"],
                "tokens_used": response["tokens_used"],
                "confidence_score": response["confidence_score"]
            }
            
        except Exception as e:
            logger.error(f"Error summarizing document: {e}")
            return {
                "summary": "Unable to generate summary at this time.",
                "tokens_used": 0,
                "confidence_score": 0.0,
                "error": str(e)
            }
    
    async def extract_key_information(
        self,
        document_text: str,
        information_type: str = "general"
    ) -> Dict[str, Any]:
        """Extract key information from document text."""
        try:
            # Define extraction prompts based on information type
            extraction_prompts = {
                "general": "Extract the main parties, key dates, important provisions, and legal obligations from this document.",
                "contract": "Extract the contracting parties, contract terms, payment obligations, termination clauses, and key dates from this contract.",
                "litigation": "Extract the parties involved, claims made, legal issues, important dates, and court information from this legal document.",
                "compliance": "Extract compliance requirements, regulatory obligations, deadlines, and responsible parties from this document."
            }
            
            prompt = extraction_prompts.get(information_type, extraction_prompts["general"])
            
            messages = [
                {
                    "role": "system",
                    "content": f"You are a legal document analyzer. {prompt} Present the information in a structured format with clear categories."
                },
                {
                    "role": "user",
                    "content": f"Please analyze this document:\n\n{document_text[:8000]}"
                }
            ]
            
            response = await self.generate_response(
                messages=messages,
                temperature=0.1
            )
            
            return {
                "extracted_info": response["content"],
                "tokens_used": response["tokens_used"],
                "confidence_score": response["confidence_score"],
                "information_type": information_type
            }
            
        except Exception as e:
            logger.error(f"Error extracting key information: {e}")
            return {
                "extracted_info": "Unable to extract information at this time.",
                "tokens_used": 0,
                "confidence_score": 0.0,
                "error": str(e)
            }
    
    async def _generate_mock_streaming_response(
        self,
        messages: List[Dict[str, str]]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate mock streaming response for development."""
        try:
            # Get the user's last message
            user_message = ""
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    user_message = msg.get("content", "").lower()
                    break

            # Generate contextual response based on user input
            if "hello" in user_message or "hi" in user_message:
                mock_response = "Hello! I'm your Legal AI assistant. I can help you analyze legal documents, answer legal questions, and provide guidance on various legal matters. How can I assist you today?"
            elif "document" in user_message:
                mock_response = "I can help you analyze legal documents. Please upload a document and I'll review it for key provisions, potential issues, and important clauses. What type of document would you like me to examine?"
            elif "contract" in user_message:
                mock_response = "I can assist with contract analysis, including reviewing terms and conditions, identifying potential risks, and suggesting improvements. Would you like me to examine a specific contract?"
            elif "legal" in user_message:
                mock_response = "I'm here to help with various legal matters. I can analyze documents, explain legal concepts, and provide guidance on legal procedures. What specific legal question do you have?"
            elif any(op in user_message for op in ['+', '-', '*', '/', 'plus', 'minus', 'times', 'divided']):
                # Handle basic math questions
                try:
                    import re
                    # Simple math parser for basic operations
                    if '+' in user_message or 'plus' in user_message:
                        numbers = re.findall(r'\d+', user_message)
                        if len(numbers) >= 2:
                            result = sum(int(n) for n in numbers)
                            mock_response = f"The answer is {result}. While I can handle basic calculations, I'm primarily designed to assist with legal matters. Is there a legal question I can help you with?"
                        else:
                            mock_response = "I can help with basic math, but I'm primarily a Legal AI assistant. Could you clarify your calculation or ask me about a legal matter?"
                    elif '-' in user_message or 'minus' in user_message:
                        numbers = re.findall(r'\d+', user_message)
                        if len(numbers) >= 2:
                            result = int(numbers[0]) - int(numbers[1])
                            mock_response = f"The answer is {result}. While I can handle basic calculations, I'm primarily designed to assist with legal matters. Is there a legal question I can help you with?"
                        else:
                            mock_response = "I can help with basic math, but I'm primarily a Legal AI assistant. Could you clarify your calculation or ask me about a legal matter?"
                    else:
                        mock_response = "I can help with basic math calculations. While I'm primarily a Legal AI assistant, feel free to ask me simple math questions or legal matters."
                except:
                    mock_response = "I can help with basic calculations, but I'm primarily designed for legal assistance. Could you rephrase your math question or ask me about a legal matter?"
            elif any(word in user_message for word in ['what', 'how', 'why', 'when', 'where', 'who']):
                # Handle general questions more intelligently
                if any(topic in user_message for topic in ['weather', 'time', 'date']):
                    mock_response = "I'm a Legal AI assistant, so I don't have access to current weather or time information. However, I can help you with legal documents, contract analysis, or legal research. What legal question can I assist you with?"
                elif any(topic in user_message for topic in ['law', 'legal', 'court', 'judge', 'lawyer', 'attorney']):
                    mock_response = "I'm here to help with legal matters! I can assist with document analysis, legal research, contract reviews, and general legal guidance. What specific legal topic would you like to explore?"
                else:
                    mock_response = f"I understand you're asking about '{user_message}'. While I can provide general assistance, I'm specifically designed to help with legal matters. I can analyze legal documents, review contracts, and provide legal guidance. Is there a legal question I can help you with?"
            else:
                mock_response = f"I understand you're asking about '{user_message}'. As your Legal AI assistant, I'm designed to help with legal document analysis, contract reviews, and legal research. Could you provide more specific details about your legal question or upload a document for analysis?"

            # Stream the response word by word to simulate real streaming
            words = mock_response.split()
            full_content = ""

            for i, word in enumerate(words):
                if i > 0:
                    full_content += " "
                full_content += word

                yield {
                    "content_delta": " " + word if i > 0 else word,
                    "full_content": full_content,
                    "is_complete": False,
                    "sources": [],
                    "model_name": f"{self.model_name} (Mock Mode)"
                }

                # Simulate typing delay
                await asyncio.sleep(0.05)

            # Send completion indicator
            yield {
                "content_delta": "",
                "full_content": full_content,
                "is_complete": True,
                "sources": [],
                "model_name": f"{self.model_name} (Mock Mode)"
            }

        except Exception as e:
            logger.error(f"Mock streaming response error: {e}")
            yield {
                "content_delta": "",
                "full_content": "I apologize, but I'm experiencing technical difficulties. Please try again.",
                "is_complete": True,
                "sources": [],
                "model_name": f"{self.model_name} (Mock Mode)",
                "error": str(e)
            }

    async def health_check(self) -> bool:
        """Check if LLM service is healthy."""
        if self.is_mock_mode:
            return True

        try:
            # Simple test request
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10,
                temperature=0.1
            )

            return bool(response.choices[0].message.content)

        except Exception as e:
            logger.error(f"LLM health check failed: {e}")
            return False


# Global LLM service instance
llm_service = LLMService()