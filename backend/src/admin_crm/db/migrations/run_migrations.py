import asyncio
from admin_crm.db.repositories.base import Base
from admin_crm.config.database import engine

# Import all models to register with Base.metadata
import admin_crm.db.models.user
import admin_crm.db.models.role
import admin_crm.db.models.team
import admin_crm.db.models.sale
import admin_crm.db.models.campaign
import admin_crm.db.models.activity_log

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(init_db())
    print("Database tables created successfully!")
