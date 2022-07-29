"""CRUD: Create, Read, Update, and Delete"""
import asyncio
import logging
import sys
import time
import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import models
from . import schemas

logging.basicConfig(
    level=logging.DEBUG,
    format=(
        '%(asctime)s (%(relativeCreated)d) %(levelname)s %(name)s'
        ' [%(funcName)s:%(lineno)d] %(message)s'),
    stream=sys.stdout)
LOGGER = logging.getLogger(__name__)


STATUS_SUCCESS = "success"
STATUS_FAIL = "fail"

# By creating functions that are only dedicated to interacting with the
# database (get a user or an item) independent of your path operation function,
# you can more easily reuse them in multiple parts and also add unit tests for
# them.

def get_user(db: Session, session_id: str):
    """Read a single user by ``session_id``."""
    return db.query(models.User).filter(
            models.User.session_id == session_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Read multiple users."""
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session):
    """Create user session using UUID as unique ID."""
    # It is unlikely that a UUID would be duplicated but we can do three
    # attempts in case it does happen. After the three attempts if a unique
    # UUID still has not been found then we'll return a HTTPException
    unique_session = False
    for attempt in range(0,3):
        session_uuid = uuid.uuid4()
        session_id = str(session_uuid)

        session = get_user(db, session_id)

        # If no session is found then we're duplicate safe
        if not session:
            unique_session = True
            break

    if not unique_session:
        raise HTTPException(status_code=404,
                            detail="Unique session could not be created.")

    # create SQLA model instance with your data
    db_user = models.User(session_id=session_id)
    # add instance object to your db session
    db.add(db_user)
    # commit the changes to the db (so that they are saved)
    db.commit()
    # refresh your instance (so that it contains any new data from the db,
    # like the generated ID)
    db.refresh(db_user)
    return db_user

def create_scenario(db: Session, scenario: schemas.Scenario, session_id: str):
    """Create scenario linking with ``session_id``."""
    db_scenario = models.Scenario(**scenario.dict(), owner_id=session_id)
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

def get_scenario(db: Session, scenario_id: int):
    """Read a single scenario by ID."""
    return db.query(models.Scenario).filter(
            models.Scenario.scenario_id == scenario_id).first()

def get_scenarios(db: Session, session_id: str):
    """Read all scenarios."""
    return db.query(models.Scenario).filter(
            models.Scenario.owner_id == session_id).all()

def update_scenario(db: Session, scenario: schemas.Scenario, scenario_id: int):
    """Update a scenario."""
    db_scenario = get_scenario(db, scenario_id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    scenario_data = scenario.dict(exclude_unset=True)
    for key, value in scenario_data.items():
        setattr(db_scenario, key, value)

    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return STATUS_SUCCESS

def delete_scenario(db: Session, scenario_id: int):
    """Delete a scenario."""
    db_scenario = get_scenario(db, scenario_id)

    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    db.delete(db_scenario)
    db.commit()
    return STATUS_SUCCESS

def create_parcel_stats(db: Session, parcel_stats: schemas.ParcelStats):
    """Create a stats entry in parcel stats table."""
    db_parcel_stats = models.ParcelStats(**parcel_stats.dict())
    db.add(db_parcel_stats)
    db.commit()
    db.refresh(db_parcel_stats)
    return db_parcel_stats

def get_parcel_stats(db: Session, stats_id: int):
    """Read a single stats entry by ID."""
    return db.query(models.ParcelStats).filter(
            models.ParcelStats.stats_id == stats_id).first()

def update_parcel_stats(
        db: Session, parcel_stats: schemas.ParcelStatsUpdate, stats_id: int):
    """Update a parcel stats entry."""
    db_stats = get_parcel_stats(db, stats_id)

    if not db_stats:
        raise HTTPException(status_code=404, detail="Scenario not found")
    stats_data = parcel_stats.dict(exclude_unset=True)
    for key, value in stats_data.items():
        setattr(db_stats, key, value)

    db.add(db_stats)
    db.commit()
    db.refresh(db_stats)
    return STATUS_SUCCESS

def create_job(db: Session, session_id: str, job: schemas.JobBase):
    """Create a job entry in the jobs table."""
    db_job = models.Job(**job.dict(), owner_id=session_id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_job(db: Session, job_id: int):
    """Read job by ``job_id``."""
    return db.query(models.Job).filter(models.Job.job_id == job_id).first()

def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    """Read multiple jobs from the table."""
    return db.query(models.Job).offset(skip).limit(limit).all()

def update_job(db: Session, job: schemas.Job, job_id: int):
    """Update job entry in jobs table."""
    db_job = get_job(db, job_id)

    if not db_job:
        raise HTTPException(status_code=404, detail="job not found")
    job_data = job.dict(exclude_unset=True)
    for key, value in job_data.items():
        setattr(db_job, key, value)

    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return STATUS_SUCCESS

def create_pattern(db: Session, session_id: str, pattern: schemas.Pattern):
    """Create a pattern."""
    db_pattern = models.Pattern(**pattern.dict(), owner_id=session_id)

    db.add(db_pattern)
    db.commit()
    db.refresh(db_pattern)
    return db_pattern

def get_pattern(db: Session, pattern_id: int):
    """Read pattern by ``pattern_id``."""
    return db.query(models.Pattern).filter(
            models.Pattern.pattern_id == pattern_id).first()

def get_patterns(db: Session):
    """Read all patterns."""
    return db.query(models.Pattern).all()
