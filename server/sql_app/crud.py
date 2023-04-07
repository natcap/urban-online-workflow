"""CRUD: Create, Read, Update, and Delete"""
import asyncio
import json
import logging
import sys
import time
import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exc

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

def get_session(db: Session, session_id: str):
    """Read a single session by ``session_id``."""
    return db.query(models.Session).filter(
            models.Session.session_id == session_id).first()

def create_session(db: Session):
    """Create session using UUID as unique ID."""
    # It is unlikely that a UUID would be duplicated but we can do three
    # attempts in case it does happen. After the three attempts if a unique
    # UUID still has not been found then we'll return a HTTPException
    unique_session = False
    for attempt in range(0,3):
        session_uuid = uuid.uuid4()
        session_id = str(session_uuid)

        session = get_session(db, session_id)

        # If no session is found then we're duplicate safe
        if not session:
            unique_session = True
            break

    if not unique_session:
        raise HTTPException(status_code=404,
                            detail="Unique session could not be created.")

    # create SQLA model instance with your data
    db_session = models.Session(session_id=session_id)
    # add instance object to your db session
    db.add(db_session)
    # commit the changes to the db (so that they are saved)
    db.commit()
    # refresh your instance (so that it contains any new data from the db,
    # like the generated ID)
    db.refresh(db_session)
    return db_session


def create_study_area(
        db: Session, session_id: str, name: str):
    """Create a study area entry."""
    LOGGER.debug("Create study area")
    db_study_area = models.StudyArea(owner_id=session_id, name=name)
    db.add(db_study_area)
    db.commit()
    db.refresh(db_study_area)
    return db_study_area


def update_study_area(db: Session, study_area: schemas.StudyArea):
    """Update a study area entry."""
    db_study_area = get_study_area(db, study_area.id)
    if not db_study_area:
        raise HTTPException(status_code=404, detail="Study area not found")
    data = study_area.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_study_area, key, value)

    db.add(db_study_area)
    db.commit()
    db.refresh(db_study_area)
    return db_study_area


def get_study_area(db: Session, study_area_id: int):
    """Read study area from id."""
    return db.query(models.StudyArea).filter(
            models.StudyArea.id == study_area_id).first()


def get_study_areas(db: Session, session_id: str):
    """Read all study areas for session id."""
    return db.query(models.StudyArea).filter(
            models.StudyArea.owner_id == session_id).all()


def create_scenario(db: Session, scenario: schemas.Scenario, study_area_id: int):
    """Create scenario linking with ``study_area_id``."""
    db_scenario = models.Scenario(**scenario.dict(), study_area_id=study_area_id)
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario


def get_scenario(db: Session, scenario_id: int):
    """Read a single scenario by ID."""
    return db.query(models.Scenario).filter(
            models.Scenario.scenario_id == scenario_id).first()


def get_scenarios(db: Session, study_area_id: int):
    """Read all scenarios."""
    return db.query(models.Scenario).filter(
            models.Scenario.study_area_id == study_area_id).all()


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


def create_parcel_stats(db: Session, parcel_id: int, parcel_wkt: str, job_id: int):
    """Create a stats entry in parcel stats table."""
    db_parcel_stats = models.ParcelStats(
        parcel_id=parcel_id, target_parcel_wkt=parcel_wkt, job_id=job_id)
    db.add(db_parcel_stats)
    db.commit()
    db.refresh(db_parcel_stats)
    return db_parcel_stats


def create_parcel(db: Session, study_area_id: int,
                  parcel_id: int, parcel_wkt: str):
    """Create an entry in parcel table."""
    db_parcel = models.Parcel(
        study_area_id=study_area_id, parcel_id=parcel_id, wkt=parcel_wkt)
    try:
        db.add(db_parcel)
        db.commit()
        db.refresh(db_parcel)
        return STATUS_SUCCESS
    except exc.IntegrityError:
        db.rollback()
        return STATUS_FAIL


def delete_parcel(db: Session, parcel_id: int, study_area_id: int):
    """Delete an entry in parcel table."""
    row = db.query(models.Parcel).filter(
            models.Parcel.parcel_id == parcel_id,
            models.Parcel.study_area_id == study_area_id).first()

    if not row:
        raise HTTPException(status_code=404, detail="Parcel not found")

    db.delete(row)
    db.commit()
    return STATUS_SUCCESS


def get_parcel_stats(db: Session, stats_id: int):
    """Read a single stats entry by ID."""
    return db.query(models.ParcelStats).filter(
            models.ParcelStats.stats_id == stats_id).first()


def get_parcel_stats_by_id(db: Session, id: int):
    """Read a single stats entry by wkt."""
    return db.query(models.ParcelStats).filter(
            models.ParcelStats.parcel_id == id).first()


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
    """Read all patterns that have a thumbnail."""
    # This currently is NOT filtering out entries where thumbnail path is NULL
    # and I'm not quite sure why.
    return db.query(models.Pattern).filter(
            models.Pattern.pattern_thumbnail_path.is_not(None)).all()

def update_pattern(
        db: Session, pattern: schemas.PatternUpdate, pattern_id: int):
    """Update a patterns entry."""
    db_pattern = get_pattern(db, pattern_id)

    if not db_pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    pattern_data = pattern.dict(exclude_unset=True)
    for key, value in pattern_data.items():
        setattr(db_pattern, key, value)

    db.add(db_pattern)
    db.commit()
    db.refresh(db_pattern)
    return STATUS_SUCCESS

