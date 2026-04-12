"""Async gRPC server factory with interceptor chain."""

import grpc.aio

from admin_crm.config.settings import get_settings
from admin_crm.infrastructure.interceptors import (
    AuthInterceptor,
    LoggingInterceptor,
    RBACInterceptor,
)
from admin_crm.utils.logger import get_logger

logger = get_logger("grpc_server")
settings = get_settings()


async def create_server() -> grpc.aio.Server:
    """Create and configure the async gRPC server with all services and interceptors.

    Interceptor execution order (first to last):
    1. LoggingInterceptor - logs all requests
    2. AuthInterceptor - validates JWT tokens
    3. RBACInterceptor - checks permissions

    Returns:
        Configured gRPC server ready to start.
    """
    # Interceptors are applied in reverse order (last in list = first executed)
    interceptors = [
        RBACInterceptor(),
        AuthInterceptor(),
        LoggingInterceptor(),
    ]

    server = grpc.aio.server(
        interceptors=interceptors,
        options=[
            ("grpc.max_send_message_length", 50 * 1024 * 1024),  # 50MB
            ("grpc.max_receive_message_length", 50 * 1024 * 1024),
            ("grpc.keepalive_time_ms", 30000),
            ("grpc.keepalive_timeout_ms", 10000),
        ],
    )

    # Register services
    # NOTE: These will use the generated proto code once protos are compiled.
    # For now, we register them as a demonstration of the server setup.
    # In production, you would do:
    #
    # from generated import user_pb2_grpc, role_pb2_grpc, sale_pb2_grpc, ...
    # from admin_crm.application.services.user_service import UserServiceImpl
    #
    # user_pb2_grpc.add_UserServiceServicer_to_server(UserServiceImpl(), server)
    # role_pb2_grpc.add_RoleServiceServicer_to_server(RoleServiceImpl(), server)
    # ...

    _register_services(server)

    # Enable reflection for development (grpcurl, Postman, etc.)
    if settings.is_development:
        try:
            from grpc_reflection.v1alpha import reflection
            service_names = [
                "admin_crm.UserService",
                "admin_crm.RoleService",
                "admin_crm.TelesaleService",
                "admin_crm.CampaignService",
                "admin_crm.TeamService",
                reflection.SERVICE_NAME,
            ]
            reflection.enable_server_reflection(service_names, server)
            logger.info("grpc_reflection_enabled")
        except ImportError:
            logger.warning("grpc_reflection_not_available")

    # Bind to port
    listen_addr = f"{settings.grpc_host}:{settings.grpc_port}"
    server.add_insecure_port(listen_addr)

    logger.info("grpc_server_configured", address=listen_addr)
    return server


def _register_services(server: grpc.aio.Server) -> None:
    """Register all gRPC service implementations.

    This function will be updated once proto files are compiled.
    For now it serves as a placeholder showing the registration pattern.
    """
    logger.info("services_registered", note="Awaiting proto compilation")

    # TODO: After running `make proto`, uncomment and use:
    # -----------------------------------------------
    # import sys
    # sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "generated"))
    #
    # from generated import user_pb2_grpc
    # from generated import role_pb2_grpc
    # from generated import sale_pb2_grpc
    # from generated import campaign_pb2_grpc
    # from generated import team_pb2_grpc
    #
    # from admin_crm.application.services.user_service import UserServiceImpl
    # from admin_crm.application.services.role_service import RoleServiceImpl
    # from admin_crm.application.services.sale_service import TelesaleServiceImpl
    # from admin_crm.application.services.campaign_service import CampaignServiceImpl
    # from admin_crm.application.services.team_service import TeamServiceImpl
    #
    # user_pb2_grpc.add_UserServiceServicer_to_server(UserServiceImpl(), server)
    # role_pb2_grpc.add_RoleServiceServicer_to_server(RoleServiceImpl(), server)
    # sale_pb2_grpc.add_TelesaleServiceServicer_to_server(TelesaleServiceImpl(), server)
    # campaign_pb2_grpc.add_CampaignServiceServicer_to_server(CampaignServiceImpl(), server)
    # team_pb2_grpc.add_TeamServiceServicer_to_server(TeamServiceImpl(), server)
    pass
