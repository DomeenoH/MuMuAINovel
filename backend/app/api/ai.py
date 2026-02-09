"""通用 AI API 端点"""
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
import json

from app.database import get_db
from app.services.ai_service import AIService
from app.api.settings import get_user_ai_service
from app.logger import get_logger

router = APIRouter(prefix="/ai", tags=["ai"])
logger = get_logger(__name__)


class ChatMessage(BaseModel):
    role: str  # system, user, assistant
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    stream: bool = True
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


@router.post("/chat", summary="通用 AI 对话（流式）")
async def chat(
    data: ChatRequest,
    ai_service: AIService = Depends(get_user_ai_service)
):
    """
    通用 AI 对话接口，支持流式输出
    使用用户配置的 AI 服务进行对话
    """
    try:
        # 获取第一条 system 消息
        system_prompt = None
        user_messages = []
        for m in data.messages:
            if m.role == 'system':
                system_prompt = m.content
            else:
                user_messages.append(m)
        
        # 获取用户消息
        user_prompt = '\n\n'.join(m.content for m in user_messages if m.role == 'user')
        
        if data.stream:
            # 流式响应
            async def generate():
                try:
                    async for chunk in ai_service.generate_text_stream(
                        prompt=user_prompt,
                        system_prompt=system_prompt,
                        temperature=data.temperature,
                        max_tokens=data.max_tokens,
                        auto_mcp=False  # 禁用 MCP 避免复杂性
                    ):
                        if chunk.get("content"):
                            yield f"data: {json.dumps({'content': chunk['content']})}\n\n"
                        if chunk.get("done"):
                            yield "data: [DONE]\n\n"
                            break
                except GeneratorExit:
                    logger.debug("流式响应生成器被关闭")
                    raise
                except Exception as e:
                    logger.error(f"流式生成错误: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        else:
            # 非流式响应
            result = await ai_service.generate_text(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=data.temperature,
                max_tokens=data.max_tokens,
                auto_mcp=False
            )
            return {"content": result if isinstance(result, str) else result.get("content", "")}
            
    except Exception as e:
        logger.error(f"AI 对话错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))
