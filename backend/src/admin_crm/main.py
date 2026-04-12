"""Admin CRM Platform - Main entry point.

Starts the async gRPC server with all services, interceptors,
and database connections.
"""

import asyncio
import signal
import sys

from admin_crm.config.database import close_db, init_db
from admin_crm.config.settings import get_settings
from admin_crm.infrastructure.grpc_server import create_server
from admin_crm.utils.logger import get_logger, setup_logging

settings = get_settings()


async def serve() -> None:
    """Start the gRPC server and handle graceful shutdown."""
    # Setup logging
    log_level = "DEBUG" if settings.app_debug else "INFO"
    setup_logging(log_level)
    logger = get_logger("main")

    logger.info(
        "starting_server",
        app=settings.app_name,
        env=settings.app_env,
        grpc_address=f"{settings.grpc_host}:{settings.grpc_port}",
    )

    # Initialize database
    if settings.is_development:
        logger.info("initializing_database")
        await init_db()

    # Create and start gRPC server
    server = await create_server()
    await server.start()

    logger.info(
        "server_started",
        message=f"🚀 gRPC server listening on {settings.grpc_host}:{settings.grpc_port}",
    )

    # Graceful shutdown handler
    shutdown_event = asyncio.Event()

    def _signal_handler(sig, frame):
        logger.info("shutdown_signal_received", signal=sig)
        shutdown_event.set()

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    try:
        await shutdown_event.wait()
    finally:
        logger.info("shutting_down")
        # Grace period for in-flight requests
        await server.stop(grace=5)
        await close_db()
        logger.info("server_stopped")


def main() -> None:
    """Entry point for the application."""
    try:
        # Use uvloop on Linux for better performance
        if sys.platform != "win32":
            import uvloop
            uvloop.install()

        asyncio.run(serve())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
