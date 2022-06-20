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
def get_scenarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Scenario).offset(skip).limit(limit).all()

def create_scenario(db: Session, scenario: schemas.ScenarioCreate, session_id: str):
    db_scenario = models.Scenario(**scenario.dict(), owner_id=session_id)
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

def update_scenario(db: Session, scenario: schemas.ScenarioCreate, scenario_id: str):
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

# read a single scenario by ID
def get_scenario(db: Session, scenario_id: int):
    return db.query(models.Scenario).filter(models.Scenario.scenario_id == scenario_id).first()

# read multiple jobs
def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Job).offset(skip).limit(limit).all()


def create_job(db: Session, job: schemas.JobCreate):
    db_job = models.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job
