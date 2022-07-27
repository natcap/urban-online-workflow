import json
import logging
import queue
import sys

from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine


# This will help with flexibility of where we store our files and DB
# When gathering URL result for frontend request build the URL with this:
WORKING_ENV = "appdata"

logging.basicConfig(
    level=logging.DEBUG,
    format=(
        '%(asctime)s (%(relativeCreated)d) %(levelname)s %(name)s'
        ' [%(funcName)s:%(lineno)d] %(message)s'),
    stream=sys.stdout)
LOGGER = logging.getLogger(__name__)

# Create the db tables
models.Base.metadata.create_all(bind=engine)


# Create a queue that we will use to store our "workload".
QUEUE = queue.PriorityQueue()
# Status constants to use for the DB and to serve to frontend
STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_SUCCESS = "success"
STATUS_FAIL = "failed"
# Priority constants to use for jobs
LOW_PRIORITY = 3
MEDIUM_PRIORITY = 2
HIGH_PRIORITY = 1

# Normally you would probably initialize your db (create tables, etc) with
# Alembic. Would also use Alembic for "migrations" (that's its main job).
# A "migration" is the set of steps needed whenever you change the structure
# of your SQLA models, add a new attribute, etc. to replicate those changes
# in the db, add a new column, a new table, etc.

app = FastAPI()

# We need to have an independent db session / connection (SessionLocal) per
# request, use the same session through all the request and then close it after
# the request is finished.

# Then a new session will be created for the next request.

# Our dependency will create a new SQLA SessionLocal that will be used in a
# single request, and then close it once the request is finished.

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# We are creating the db session before each request in the dependency with
# 'yield', and then closing it afterwards.

# Then we can create the required dependency in the path operation function,
# to get that session directly.

# With that, we can just call crud.get_user directly from inside of the path
# operation function and use that session.


### User / Session Endpoints ###

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(db: Session = Depends(get_db)):
    # Notice that the values returned are SQLA models. But as all path operations
    # have a 'response_model' with Pydantic models / schemas using orm_mode,
    # the data declared in your Pydantic models will be extracted from them
    # and returned to the client, w/ all the normal filtering and validation.
    return crud.create_user(db=db)


# Type annotations in the function arguments will give you editor support
# inside of your function, with error checks, completion, etc.
# So, with that type declaration, FastAPI gives you automatic request "parsing".
# With the same Python type declaration, FastAPI gives you data validation.
# All the data validation is performed under the hood by Pydantic, so you get
# all the benefits from it.

### User / Session Endpoints ###

@app.get("/users/", response_model=list[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@app.get("/users/{session_id}", response_model=schemas.User)
def read_user(session_id: str, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, session_id=session_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

### Scenario Endpoints ###

@app.post("/scenario/{session_id}", response_model=schemas.ScenarioResponse)
def create_scenario(
    session_id: str, scenario: schemas.ScenarioBase,
    db: Session = Depends(get_db)
):
    return crud.create_scenario(
        db=db, scenario=scenario, session_id=session_id)


@app.patch("/scenario/{scenario_id}", status_code=200)
def update_scenario(
    scenario_id: int, scenario: schemas.ScenarioBase,
    db: Session = Depends(get_db)
):
    return crud.update_scenario(
        db=db, scenario=scenario, scenario_id=scenario_id)


@app.delete("/scenario/{scenario_id}", status_code=200)
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    return crud.delete_scenario(db=db, scenario_id=scenario_id)


@app.get("/scenario/{scenario_id}", response_model=schemas.Scenario)
def read_scenario(scenario_id: int, db: Session = Depends(get_db)):
    db_scenario = crud.get_scenario(db, scenario_id=scenario_id)
    if db_scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return db_scenario


@app.get("/scenarios/", response_model=list[schemas.ScenarioAll])
def read_scenarios(session_id: str, db: Session = Depends(get_db)):
    scenarios = crud.get_scenarios(db, session_id=session_id)
    return scenarios


### Worker Endpoints ###
@app.get("/jobsqueue/")
async def worker_job_request(db: Session = Depends(get_db)):
    """If there's work to be done in the queue send it to the worker."""
    try:
        # Get job from queue, ignoring returned priority value
        _, job_details = QUEUE.get_nowait()
        LOGGER.info(f"Sending job [{job_details['job_type']}] to worker.")
        return json.dumps(job_details)
    except queue.Empty:
        return None


@app.post("/jobsqueue/scenario")
def worker_scenario_response(
    scenario_job: schemas.WorkerResponse, db: Session = Depends(get_db)):
    """Update the db given the job details from the worker.

    Returned URL result will be partial to allow for local vs cloud stored
    depending on production vs dev environment.

    Args:
        scenario_job (pydantic model): a pydantic model with the following 
            key/vals

            "result": {
                lulc_path: "relative path to file location",
                lulc_stats: {
                    base: {
                        lulc-int: lulc-perc,
                        11: 53,
                    },
                    result: {
                        lulc-int: lulc-perc,
                        11: 53,
                    },
                  },
                }
             "status": "success | failed",
             "server_attrs": {
                "job_id": int, "scenario_id": int
                }
    """
    LOGGER.debug("Entering jobsqueue/scenario")
    LOGGER.debug(scenario_job)
    # Update job in db based on status
    job_db = crud.get_job(db, job_id=scenario_job.server_attrs['job_id'])
    # Update Scenario in db with the result
    scenario_db = crud.get_scenario(db, scenario_id=scenario_job.server_attrs['scenario_id'])

    job_status = scenario_job.status
    if job_status == "success":
        # Update the job status in the DB to "success"
        job_update = schemas.JobBase(
            status=STATUS_SUCCESS,
            name=job_db.name, description=job_db.description)
        # Update the scenario lulc path and stats
        scenario_update = schemas.ScenarioUpdate(
            lulc_url_result=scenario_job.result['lulc_path'],
            lulc_stats=json.dumps(scenario_job.result['lulc_stats']))
    else:
        # Update the job status in the DB to "failed"
        job_update = schemas.JobBase(
            status=STATUS_FAILED,
            name=job_db.name, description=job_db.description)
        # Update the the scenario lulc path stats with None
        scenario_update = schemas.ScenarioUpdate(
            lulc_url_result=None, lulc_stats=None)

    LOGGER.debug('Update job status')
    _ = crud.update_job(
        db=db, job=job_update, job_id=scenario_job.server_attrs['job_id'])
    LOGGER.debug('Update scenario result')
    _ = crud.update_scenario(
        db=db, scenario=scenario_update,
        scenario_id=scenario_job.server_attrs['scenario_id'])


@app.post("/jobsqueue/parcel_stats")
def worker_parcel_stats_response(
    parcel_stats_job: schemas.WorkerResponse, db: Session = Depends(get_db)):
    """Update the db given the job details from the worker.
    """
    LOGGER.debug("Entering jobsqueue/parcel_stats")
    LOGGER.debug(parcel_stats_job)
    # Update job in db based on status
    job_db = crud.get_job(db, job_id=parcel_stats_job.server_attrs['job_id'])
    # Update Stats in db with the result
    stats_db = crud.get_parcel_stats(
        db, stats_id=parcel_stats_job.server_attrs['stats_id'])

    job_status = parcel_stats_job.status
    if job_status == "success":
        # Update the job status in the DB to "success"
        job_update = schemas.JobBase(
            status=STATUS_SUCCESS,
            name=job_db.name, description=job_db.description)
        # Update the scenario lulc path and stats
        stats_update = schemas.ParcelStatsUpdate(
            lulc_stats=json.dumps(parcel_stats_job.result['lulc_stats']))
    else:
        # Update the job status in the DB to "failed"
        job_update = schemas.JobBase(
            status=STATUS_FAILED,
            name=job_db.name, description=job_db.description)
        # Update the stats with None
        stats_update = schemas.ParcelStatsUpdate(lulc_stats=None)

    LOGGER.debug('Update job status')
    _ = crud.update_job(
        db=db, job=job_update, job_id=parcel_stats_job.server_attrs['job_id'])
    LOGGER.debug('Update stats result')
    _ = crud.update_parcel_stats(
        db=db, parcel_stats=stats_update,
        stats_id=parcel_stats_job.server_attrs['stats_id'])

@app.post("/jobs/", response_model=schemas.Job)
def create_job(
    job: schemas.JobBase, db: Session = Depends(get_db)
):
    """Internal endpoint for testing."""
    return crud.create_job(db=db, job=job)


@app.get("/job/{job_id}", response_model=schemas.JobStatus)
def read_job(job_id: int, db: Session = Depends(get_db)):
    db_job = crud.get_job(db, job_id=job_id)
    if db_job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@app.get("/jobs/", response_model=list[schemas.Job])
def read_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = crud.get_jobs(db, skip=skip, limit=limit)
    return jobs


### Task Endpoints ###

@app.post("/pattern/{session_id}", response_model=schemas.PatternResponse)
def create_pattern(session_id: str, pattern: schemas.PatternBase, db: Session = Depends(get_db)):
    """Create a wallpapering pattern by just saving the wkt in the db."""

    pattern_db = crud.create_pattern(
        db=db, session_id=session_id, pattern=pattern)

    return pattern_db


@app.get("/pattern/", response_model=list[schemas.PatternResponse])
def get_patterns(db: Session = Depends(get_db)):
    """Get a list of the wallpapering patterns saved in the db."""

    pattern_db = crud.get_patterns(
        db=db, session_id=session_id, pattern=pattern)

    return pattern_db


@app.post("/wallpaper/", response_model=schemas.JobResponse)
def wallpaper(wallpaper: schemas.Wallpaper, db: Session = Depends(get_db)):
    # Get Scenario details from scenario_id
    scenario_db = crud.get_scenario(db, wallpaper.scenario_id)
    session_id = scenario_db.owner_id

    # Create job entry for wallpapering task
    job_schema = schemas.JobBase(
        **{"name": "wallpaper", "description": "run wallpapering",
           "status": STATUS_PENDING})
    job_db = crud.create_job(
        db=db, session_id=session_id, job=job_schema)

    # Get Pattern geometry
    pattern_db = crud.get_pattern(db, wallpaper.pattern_id)
    # Construct worker job and add to the queue
    worker_task = {
        "job_type": "wallpaper",
        "server_attrs": {
            "job_id": job_db.job_id, "scenario_id": scenario_db.scenario_id
        },
        "job_args": {
            "target_parcel_wkt": wallpaper.target_parcel_wkt,
            "pattern_bbox_wkt": pattern_db.wkt, #TODO: make sure this is a WKT string and no just a bounding box
            "lulc_source_url": f'{WORKING_ENV}/{scenario_db.lulc_url_base}',
            }
        }

    QUEUE.put_nowait((MEDIUM_PRIORITY, worker_task))

    # Return job_id for response
    return job_db


@app.post("/parcel_fill/", response_model=schemas.JobResponse)
def parcel_fill(parcel_fill: schemas.ParcelFill, db: Session = Depends(get_db)):
    # Get Scenario details from scenario_id
    scenario_db = crud.get_scenario(db, parcel_fill.scenario_id)
    session_id = scenario_db.owner_id

    # Create job entry for wallpapering task
    job_schema = schemas.JobBase(
        **{"name": "parcel_fill", "description": "parcel filling",
           "status": STATUS_PENDING})
    job_db = crud.create_job(
        db=db, session_id=session_id, job=job_schema)

    # Construct worker job and add to the queue
    worker_task = {
        "job_type": "parcel_fill",
        "server_attrs": {
            "job_id": job_db.job_id, "scenario_id": scenario_db.scenario_id
        },
        "job_args": {
            "target_parcel_wkt": parcel_fill.target_parcel_wkt,
            "lulc_class": parcel_fill.lulc_class, #TODO: make sure this is a WKT string and no just a bounding box
            "lulc_source_url": f'{WORKING_ENV}/{scenario_db.lulc_url_base}',
            }
        }

    QUEUE.put_nowait((MEDIUM_PRIORITY, worker_task))

    # Return job_id for response
    return job_db

#TODO: frontend will want preliminary stats under parcel wkt
@app.get("/stats_under_parcel/", response_model=schemas.ParcelStatsResponse)
def get_lulc_stats_under_parcel(parcel_stats: schemas.ParcelStats,
                                db: Session = Depends(get_db)):
    # Create job entry for wallpapering task
    job_schema = schemas.JobBase(
        **{"name": "stats_under_parcel", "description": "get lulc base stats under parcel",
           "status": STATUS_PENDING})
    job_db = crud.create_job(
        db=db, session_id=session_id, job=job_schema)

    parcel_stats_db = crud.create_parcel_stats(
        db=db, target_parcel_wkt=parcel_stats.target_parcel_wkt)
    # Construct worker job and add to the queue
    worker_task = {
        "job_type": "stats_under_parcel",
        "server_attrs": {
            "job_id": job_db.job_id, "stats_id": parcel_stats_db.stats_id
        },
        "job_args": {
            "target_parcel_wkt": parcel_fill.target_parcel_wkt,
            "lulc_source_url": f'{WORKING_ENV}/{scenario_db.lulc_url_base}',
            }
        }

    QUEUE.put_nowait((MEDIUM_PRIORITY, worker_task))

    # Return job_id and stats_id for response
    return worker_task['server_attrs']


@app.get("/scenario/result")
def get_scenario_results(
        job_id: int, scenario_id: int, db: Session = Depends(get_db)):
    """Return the wallpapering or fill results if the job was successful."""
    # Check job status and return URL and Stats from table
    job_db = crud.get_job(db, job_id=job_id)
    if job_db is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job_db.status == STATUS_SUCCESS:
        scenario_db = crud.get_scenario(db, scenario_id=scenario_id)
        if scenario_db is None:
            raise HTTPException(status_code=404, detail="Scenario not found")
        scenario_results = {
            "lulc_url_result": scenario_db.lulc_url_result,
            "lulc_stats": json.loads(scenario_db.lulc_stats),
            }
        return scenario_results
    else:
        return job_db.status


### Testing ideas from tutorial ###

client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World: prototype test"}

def test_add_jobs():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World"}

    # read status of job
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World"}

