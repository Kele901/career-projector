"""
Migration script to add new career features tables to the database.
Run this script to create: CVVersion, ProgressEntry, LearnedSkill, SharedReport tables.
"""

import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, inspect
from app.core.database import Base
from app.models.models import (
    User, CV, Skill, WorkExperience, Recommendation, CareerPathway,
    CVVersion, ProgressEntry, LearnedSkill, SharedReport
)
from app.core.config import settings


def check_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def migrate():
    """Run the migration"""
    print("=" * 60)
    print("Career Features Database Migration")
    print("=" * 60)
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Get list of existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    print(f"\nExisting tables: {', '.join(existing_tables)}")
    
    # Check which new tables need to be created
    new_tables = {
        "cv_versions": CVVersion,
        "progress_entries": ProgressEntry,
        "learned_skills": LearnedSkill,
        "shared_reports": SharedReport
    }
    
    tables_to_create = []
    for table_name, model_class in new_tables.items():
        if table_name not in existing_tables:
            tables_to_create.append(table_name)
    
    if not tables_to_create:
        print("\n✅ All tables already exist. No migration needed.")
        return
    
    print(f"\n📋 Tables to create: {', '.join(tables_to_create)}")
    print("\nCreating tables...")
    
    try:
        # Create only the new tables
        Base.metadata.create_all(bind=engine, tables=[
            model_class.__table__ for table_name, model_class in new_tables.items()
            if table_name in tables_to_create
        ])
        
        print("\n✅ Migration completed successfully!")
        print("\nNew tables created:")
        for table_name in tables_to_create:
            print(f"  - {table_name}")
        
        # Verify tables were created
        inspector = inspect(engine)
        final_tables = inspector.get_table_names()
        print(f"\n📊 Total tables in database: {len(final_tables)}")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    migrate()

