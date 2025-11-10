"""
Migration script to add enhanced fields to work_experiences table.
Run this after updating the WorkExperience model.
"""
import sqlite3
from pathlib import Path

def migrate_database():
    """Add new columns to work_experiences table if they don't exist"""
    
    # Get database path
    db_path = Path(__file__).parent / "career_projector.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        print("Database will be created with new schema when the application starts.")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(work_experiences);")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    # Add new columns if they don't exist
    columns_to_add = [
        ("seniority_level", "VARCHAR"),
        ("company_size", "VARCHAR"),
        ("company_industry", "VARCHAR")
    ]
    
    for column_name, column_type in columns_to_add:
        if column_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE work_experiences ADD COLUMN {column_name} {column_type};")
                print(f"✓ Added column: {column_name}")
            except sqlite3.OperationalError as e:
                print(f"✗ Failed to add column {column_name}: {e}")
        else:
            print(f"- Column {column_name} already exists")
    
    conn.commit()
    conn.close()
    print("\nMigration completed successfully!")


if __name__ == "__main__":
    print("Starting database migration...")
    print("-" * 50)
    migrate_database()

