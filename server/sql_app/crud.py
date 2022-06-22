"""CRUD: Create, Read, Update, and Delete"""
from sqlalchemy.orm import Session
from fastapi import HTTPException

from . import models, schemas

import uuid

# By creating functions that are only dedicated to interacting with the
# database (get a user or an item) independent of your path operation function,
# you can more easily reuse them in multiple parts and also add unit tests for
# them.

# read a single user by ID
def get_user(db: Session, session_id: str):
    return db.query(models.User).filter(models.User.session_id == session_id).first()


# read a single user by email
#def get_user_by_session_id(db: Session, session_id: str):
#    return db.query(models.User).filter(models.User.session_id == session_id).first()

# read multiple users
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


# create user data
#def create_user(db: Session, user: schemas.UserCreate):
def create_user(db: Session):
    session_uuid = uuid.uuid4()
    session_id = str(session_uuid)

    # create SQLA model instance with your data
    #db_user = models.User(email=user.email, hashed_password=fake_hashed_password)
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


def create_scenario(db: Session, scenario: schemas.ScenarioCreate, session_id: str):
    db_scenario = models.Scenario(**scenario.dict(), owner_id=session_id)
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario


def update_scenario(db: Session, scenario: schemas.ScenarioCreate, scenario_id: int):
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
    return db.query(models.Job).filter(models.Job.job_id == job_id).firts()


def create_job(db: Session, job: schemas.JobCreate):
    db_job = models.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


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


def lulc_under_parcel_summary(session_id: str, db: Session = Depends(get_db), wkt_parcel: str):
    #TODO: Implement
    #job_db = models.Job(name=f"lulc-summary-job", status="running")
    #create_job(db, job_db)

    #summary = {'4': 20, '1': 11, '3': 17}
    #return summary
    pass


def wallpaper(session_id: str, scenario_id: int, db: Session = Depends(get_db)):
    #TODO: Implement run wallpapering
    pass


def get_wallpaper_results(db: Session = Depends(get_db), job_id: int):
    #TODO: Implement
    #job_db = get_job(db, job_id)

    #results = {'cog_URL': 'temp-url.tif', 'lulc_summary': {'4': 20, '1': 11, '3': 17}}
    #return results
    pass

