"""gRPC Logging Interceptor - logs all requests with timing and audit trail."""

import time
from typing import Any, Callable

import grpc
import grpc.aio

from admin_crm.infrastructure.interceptors.auth_interceptor import get_current_user
from admin_crm.utils.logger import get_logger

logger = get_logger("grpc_logging")


class LoggingInterceptor(grpc.aio.ServerInterceptor):
    """Logs all incoming gRPC requests with timing information."""

    async def intercept_service(
        self,
        continuation: Callable,
        handler_call_details: grpc.HandlerCallDetails,
    ) -> Any:
        method = handler_call_details.method
        start_time = time.perf_counter()

        # Get user context if available
        user_ctx = get_current_user()
        user_id = user_ctx["user_id"] if user_ctx else "anonymous"

        logger.info(
            "grpc_request_start",
            method=method,
            user_id=user_id,
        )

        try:
            response = await continuation(handler_call_details)
            duration_ms = (time.perf_counter() - start_time) * 1000

            logger.info(
                "grpc_request_end",
                method=method,
                user_id=user_id,
                duration_ms=round(duration_ms, 2),
                status="OK",
            )
            return response

        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "grpc_request_error",
                method=method,
                user_id=user_id,
                duration_ms=round(duration_ms, 2),
                error=str(e),
            )
            raise
