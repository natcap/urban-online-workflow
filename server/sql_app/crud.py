"""CRUD: Create, Read, Update, and Delete"""
import asyncio
import logging
import sys
import time

from fastapi import HTTPException
from sqlalchemy.orm import Session
import uuid

from . import models, schemas


logging.basicConfig(
    level=logging.DEBUG,
    format=(
        '%(asctime)s (%(relativeCreated)d) %(levelname)s %(name)s'
        ' [%(funcName)s:%(lineno)d] %(message)s'),
    stream=sys.stdout)
LOGGER = logging.getLogger(__name__)

# By creating functions that are only dedicated to interacting with the
# database (get a user or an item) independent of your path operation function,
# you can more easily reuse them in multiple parts and also add unit tests for
# them.

# read a single user by ID
def get_user(db: Session, session_id: str):
    return db.query(models.User).filter(models.User.session_id == session_id).first()


# read multiple users
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


# create user session
def create_user(db: Session):

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
        raise HTTPException(status_code=404, detail="Unique session could not be created.")

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


# read multiple scenarios
def get_scenarios(db: Session, session_id: str):
    return db.query(models.Scenario).filter(models.Scenario.owner_id == session_id).all()


def create_scenario(db: Session, scenario: schemas.Scenario, session_id: str):
    db_scenario = models.Scenario(**scenario.dict(), owner_id=session_id)
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario


def update_scenario(db: Session, scenario: schemas.Scenario, scenario_id: int):
    db_scenario = db.query(models.Scenario).filter(models.Scenario.scenario_id == scenario_id).first()

    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    scenario_data = scenario.dict(exclude_unset=True)
    for key, value in scenario_data.items():
        setattr(db_scenario, key, value)

    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    #return db_scenario
    return "success"


def delete_scenario(db: Session, scenario_id: int):
    db_scenario = db.query(models.Scenario).filter(models.Scenario.scenario_id == scenario_id).first()

    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    db.delete(db_scenario)
    db.commit()
    #return db_scenario
    return "success"


# read a single scenario by ID
def get_scenario(db: Session, scenario_id: int):
    return db.query(models.Scenario).filter(models.Scenario.scenario_id == scenario_id).first()


# read multiple jobs
def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Job).offset(skip).limit(limit).all()


# read job by ID
def get_job(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.job_id == job_id).first()


def create_job(db: Session, job: schemas.JobBase):
    db_job = models.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job(db: Session, job: schemas.Job, job_id: int):
    LOGGER.debug("CRUD: update_job")
    LOGGER.debug(f'job id: {job_id}')
    db_job = db.query(models.Job).filter(models.Job.job_id == job_id).first()

    if not db_job:
        raise HTTPException(status_code=404, detail="job not found")
    job_data = job.dict(exclude_unset=True)
    for key, value in job_data.items():
        setattr(db_job, key, value)

    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    #return db_job
    return "success"

# Normally blocking call (InVEST model, PGP call, wallpapering, ...)
def test_job_task(job_param):
    LOGGER.debug('Running job operation')

    sleep_time = job_param
    # Sleep for the "sleep_time" seconds.
    time.sleep(sleep_time)
    LOGGER.debug(f'Done sleeping for {sleep_time} seconds')

def create_pattern(db: Session, session_id: str, pattern: schemas.Pattern):
    #TODO: Implement
    #job_db = models.Job(name=f"create-pattern-job", status="running")
    #create_job(db, job_db)

    #db_pattern = models.Pattern(**pattern.dict(), url="temp-pattern-url.tif")

    #db.add(db_pattern)
    #db.commit()
    #db.refresh(db_pattern)
    #return db_pattern
    pass


def lulc_under_parcel_summary(session_id: str, wkt_parcel: str, db: Session):
    #TODO: Implement
    #job_db = models.Job(name=f"lulc-summary-job", status="running")
    #create_job(db, job_db)

    #summary = {'4': 20, '1': 11, '3': 17}
    #return summary
    pass


def wallpaper(session_id: str, scenario_id: int, db: Session):
    #TODO: Implement run wallpapering
    pass


def get_wallpaper_results(job_id: int, db: Session):
    #TODO: Implement
    #job_db = get_job(db, job_id)

    #results = {'cog_URL': 'temp-url.tif', 'lulc_summary': {'4': 20, '1': 11, '3': 17}}
    #return results
    pass

