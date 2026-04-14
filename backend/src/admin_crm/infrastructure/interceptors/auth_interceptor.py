"""gRPC Authentication Interceptor - validates JWT tokens on incoming requests."""

from typing import Any, Callable

import grpc
import grpc.aio

from admin_crm.utils.jwt import TokenError, decode_token
from admin_crm.utils.logger import get_logger

logger = get_logger("auth_interceptor")

# Methods that don't require authentication
PUBLIC_METHODS = frozenset({
    "/admin_crm.UserService/Login",
    "/admin_crm.UserService/RefreshToken",
    "/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo",
    "/grpc.health.v1.Health/Check",
})

# Context key for the authenticated user info
USER_CONTEXT_KEY = "user_context"


class AuthInterceptor(grpc.aio.ServerInterceptor):
    """Intercepts all gRPC calls to validate JWT bearer tokens.

    Extracts the token from the 'authorization' metadata header,
    validates it, and injects user context into the call.
    """

    async def intercept_service(
        self,
        continuation: Callable,
        handler_call_details: grpc.HandlerCallDetails,
    ) -> Any:
        """Intercept and authenticate incoming gRPC calls."""
        method = handler_call_details.method

        # Skip authentication for public methods
        if method in PUBLIC_METHODS:
            return await continuation(handler_call_details)

        # Extract token from metadata
        metadata = dict(handler_call_details.invocation_metadata or [])
        auth_header = metadata.get("authorization", "")
        
        logger.debug(f"Auth interceptor received auth_header: {auth_header}")

        if not auth_header.startswith("Bearer "):
            logger.warning("missing_or_invalid_auth_header", method=method)
            return self._abort_unauthenticated("Missing or invalid authorization header")

        token = auth_header[7:]  # Remove "Bearer " prefix

        try:
            payload = decode_token(token)

            # Validate token type
            if payload.get("type") != "access":
                return self._abort_unauthenticated("Invalid token type")

            # Inject user context into metadata for downstream services
            # gRPC doesn't allow modifying metadata after creation,
            # so we store in a module-level context (thread-safe via asyncio)
            _set_user_context(
                user_id=int(payload["sub"]),
                email=payload.get("email", ""),
                roles=payload.get("roles", []),
            )

            logger.debug(
                "authenticated",
                user_id=payload["sub"],
                method=method,
            )
            return await continuation(handler_call_details)

        except TokenError as e:
            logger.warning("auth_failed", method=method, error=str(e))
            return self._abort_unauthenticated(str(e))

    def _abort_unauthenticated(self, message: str) -> grpc.aio.ServicerContext:
        """Create an UNAUTHENTICATED abort handler."""

        async def abort_handler(request, context):
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, message)

        return grpc.unary_unary_rpc_method_handler(abort_handler)


# =============================================
# User Context (async-safe via contextvars)
# =============================================

import contextvars

_current_user: contextvars.ContextVar[dict | None] = contextvars.ContextVar(
    "current_user", default=None
)


def _set_user_context(user_id: int, email: str, roles: list[str]) -> None:
    """Set the current authenticated user context."""
    _current_user.set({
        "user_id": user_id,
        "email": email,
        "roles": roles,
    })


def get_current_user() -> dict | None:
    """Get the current authenticated user context."""
    return _current_user.get()


def get_current_user_id() -> int | None:
    """Get the current authenticated user's ID."""
    ctx = _current_user.get()
    return ctx["user_id"] if ctx else None
