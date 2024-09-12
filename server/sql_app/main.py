import csv
import json
import logging
import os
import queue
import sys
from typing import Optional

import shapely.geometry
import shapely.wkt

from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY
from sqlalchemy.orm import Session
from sqlalchemy import event

from . import crud, models, schemas
from .database import SessionLocal, engine

logging.basicConfig(
    level=logging.DEBUG,
    format=(
        '%(asctime)s (%(relativeCreated)d) %(levelname)s %(name)s'
        ' [%(funcName)s:%(lineno)d] %(message)s'),
    stream=sys.stdout)
LOGGER = logging.getLogger(__name__)

# This will help with flexibility of where we store our files and DB
# When gathering URL result for frontend request build the URL with this:
WORKING_ENV = "/opt/appdata"
BASE_LULC = "lulc_overlay_3857.tif"
LULC_CSV_PATH = os.path.join(WORKING_ENV, 'lulc_crosswalk.csv')

# Create a queue that we will use to store our "workload".
QUEUE = queue.PriorityQueue()
# Status constants to use for the DB and to serve to frontend
STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_SUCCESS = "success"
STATUS_FAILED = "failed"
# Priority constants to use for jobs
LOW_PRIORITY = 3
MEDIUM_PRIORITY = 2
HIGH_PRIORITY = 1

# The list of models that run
INVEST_MODELS = [
    "urban_cooling_model",
    "carbon",
    "urban_nature_access"
]

JOB_TYPES = {
    "invest": "invest",
    "pattern_thumbnail": "pattern_thumbnail",
    "wallpaper": "wallpaper",
    "lulc_fill": "lulc_fill",
    "lulc_crop": "lulc_crop",
    "stats_under_parcel": "stats_under_parcel",
}


def insert_lulc_data(target, connection, **kw):
    LOGGER.info('importing LULC Crosswalk table')
    # https://docs.sqlalchemy.org/en/20/_modules/examples/performance/bulk_inserts.html
    with open(LULC_CSV_PATH, 'r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        connection.execute(
            models.LulcCrosswalk.__table__.insert(),
            [row for row in reader]
        )


# create_all() will check if tables already exist before creating them.
# if this table did not exist, populate it from the CSV.
# TODO: use some type of hash to check if the CSV file
# has changed, not just checking if the db table already exists.
event.listen(models.LulcCrosswalk.__table__, 'after_create', insert_lulc_data)

# Normally you would probably initialize your db (create tables, etc) with
# Alembic. Would also use Alembic for "migrations" (that's its main job).
# A "migration" is the set of steps needed whenever you change the structure
# of your SQLA models, add a new attribute, etc. to replicate those changes
# in the db, add a new column, a new table, etc.
models.Base.metadata.create_all(bind=engine)

app = FastAPI()
origins = ["http://localhost:3000", "http://35.238.129.2", "http://35.238.129.2:8000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    #allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # despite this *, PATCH does not pass CORS
    allow_headers=["*"],
)

# Get feedback on 422 errors. Taken wholesale from
# https://github.com/tiangolo/fastapi/issues/3361
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
        request: Request, exc: RequestValidationError):
    exc_str = f'{exc}'.replace('\n', ' ').replace('   ', ' ')
    logging.error(f"{request}: {exc_str}")
    content = {'status_code': 10422, 'message': exc_str, 'data': None}
    return JSONResponse(
        content=content, status_code=HTTP_422_UNPROCESSABLE_ENTITY)


# Dependency
def get_db():
    # We need to have an independent db session / connection (SessionLocal) per
    # request, use the same session through all the request and then close it after
    # the request is finished.

    # Then a new session will be created for the next request.

    # Our dependency will create a new SQLA SessionLocal that will be used in a
    # single request, and then close it once the request is finished.
    # We are creating the db session before each request in the dependency with
    # 'yield', and then closing it afterwards.

    # Then we can create the required dependency in the path operation function,
    # to get that session directly.

    # With that, we can just call crud.get_user directly from inside of the path
    # operation function and use that session.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/sessions/", response_model=schemas.SessionResponse)
def create_session(db: Session = Depends(get_db)):
    # Notice that the values returned are SQLA models. But as all path
    # operations have a 'response_model' with Pydantic models / schemas using
    # orm_mode, the data declared in your Pydantic models will be extracted
    # from them and returned to the client, w/ all the normal filtering and
    # validation.
    return crud.create_session(db=db)


@app.get("/session/{session_id}", response_model=schemas.Session)
def read_session(session_id: str, db: Session = Depends(get_db)):
    db_session = crud.get_session(db, session_id=session_id)
    print(db_session)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@app.post("/study_area/{session_id}", response_model=schemas.StudyArea)
def create_study_area(
        session_id: str, new_area: schemas.StudyAreaCreateRequest,
        db: Session = Depends(get_db)):
    # check that the session exists
    db_session = crud.get_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return crud.create_study_area(
        db=db, **new_area.dict(), session_id=session_id)


@app.get("/study_area/{session_id}/{study_area_id}",
         response_model=schemas.StudyArea)
def get_study_area(
        session_id: str, study_area_id: int, db: Session = Depends(get_db)):
    # check that the session exists
    db_session = crud.get_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db_study_area = crud.get_study_area(db, study_area_id=study_area_id)
    return db_study_area


@app.put("/study_area/{session_id}", response_model=schemas.StudyArea)
def update_study_area(session_id: str, study_area: schemas.StudyArea,
                      db: Session = Depends(get_db)):
    # check that the session exists
    db_session = crud.get_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    del study_area.parcels  # not an attribute of schemas.StudyArea
    db_study_area = crud.update_study_area(db, study_area)
    return db_study_area


@app.get("/study_areas/{session_id}", response_model=list[schemas.StudyArea])
def get_study_areas(session_id: str, db: Session = Depends(get_db)):
    # check that the session exists
    # TODO: when & why do we need to get the session?
    db_session = crud.get_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db_study_areas = crud.get_study_areas(db=db, session_id=session_id)
    return db_study_areas


@app.get("/scenario/{study_area_id}", response_model=list[schemas.Scenario])
def get_scenarios(study_area_id: int, db: Session = Depends(get_db)):
    db_scenarios = crud.get_scenarios(db=db, study_area_id=study_area_id)
    return db_scenarios


@app.get("/scenario/{scenario_id}", response_model=schemas.Scenario)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    db_scenario = crud.get_scenario(db=db, scenario_id=scenario_id)
    return db_scenario


@app.post("/scenario/{study_area_id}", response_model=schemas.ScenarioCreateResponse)
def create_scenario(
    study_area_id: int, scenario: schemas.ScenarioBase,
    db: Session = Depends(get_db)
):
    db_study_area = crud.get_study_area(db, study_area_id=study_area_id)
    if db_study_area is None:
        raise HTTPException(status_code=404, detail="Study area not found")
    return crud.create_scenario(
        db=db, scenario=scenario, study_area_id=study_area_id)


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


@app.get("/jobsqueue/")
async def worker_job_request(db: Session = Depends(get_db)):
    """If there's work to be done in the queue send it to the worker."""
    try:
        # Get job from queue, ignoring returned priority value
        _, _, job_details = QUEUE.get_nowait()
        return json.dumps(job_details)
    except queue.Empty:
        return None


@app.post("/jobsqueue/invest")
def worker_invest_response(
    invest_result: schemas.WorkerResponse, db: Session = Depends(get_db)):
    """Update the db given the job details from the worker.

    Returned URL result will be partial to allow for local vs cloud stored
    depending on production vs dev environment.

    Args:
        invest_result (pydantic model): a pydantic model with the following
            key/vals

            "result": {
                "invest-result" (str): path to json file with results,
                "model": (str): name of the invest model,
                }
             "status": "success | failed",
             "server_attrs": {
                "job_id": int, "scenario_id": int,
                }
    """
    # Update job in db based on status
    job_db = crud.get_job(db, job_id=invest_result.server_attrs['job_id'])
    # Update Scenario in db with the result
    scenario_db = crud.get_scenario(
        db, scenario_id=invest_result.server_attrs['scenario_id'])

    job_status = invest_result.status
    if job_status == STATUS_SUCCESS:
        # Update the job status in the DB to "success"
        job_update = schemas.JobBase(
            status=STATUS_SUCCESS,
            name=job_db.name, description=job_db.description)
        # TODO: how will we store InVEST model results? In Scenario table or in
        # a separate InVEST table? Should each model have a table? Issue #70
        #scenario_update = schemas.ScenarioUpdate(
        #    lulc_url_result=invest_result.result['lulc_path'],
        #    lulc_stats=json.dumps(invest_result.result['lulc_stats']))
        LOGGER.debug('Update invest result')
        _ = crud.update_invest(
            db=db, scenario_id=invest_result.server_attrs['scenario_id'],
            job_id=invest_result.server_attrs['job_id'],
            result=invest_result.result['invest-result'],
            model_name=invest_result.result['model'],
            serviceshed=invest_result.result['serviceshed'])
    else:
        # Update the job status in the DB to "failed"
        job_update = schemas.JobBase(
            status=STATUS_FAILED,
            name=job_db.name, description=job_db.description)
        # If the job failed then there is nothing to update for invest_run as
        # the default for 'result' is None

    LOGGER.debug('Update job status')
    _ = crud.update_job(
        db=db, job=job_update, job_id=invest_result.server_attrs['job_id'])


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
                    lulc-int: lulc-count,
                    11: 53,
                  },
                }
             "status": "success | failed",
             "server_attrs": {
                "job_id": int, "scenario_id": int
                }
    """
    # Update job in db based on status
    job_db = crud.get_job(db, job_id=scenario_job.server_attrs['job_id'])
    # Update Scenario in db with the result
    scenario_db = crud.get_scenario(
        db, scenario_id=scenario_job.server_attrs['scenario_id'])

    job_status = scenario_job.status
    if job_status == STATUS_SUCCESS:
        # Update the job status in the DB to "success"
        job_update = schemas.JobBase(
            status=STATUS_SUCCESS,
            name=job_db.name, description=job_db.description)
        # Update the scenario lulc path and stats
        lulc_stats = crud.explode_lulc_counts(db, scenario_job.result['lulc_stats'])
        scenario_update = schemas.ScenarioUpdate(
            lulc_url_result=scenario_job.result['lulc_path'],
            lulc_stats=json.dumps(lulc_stats))
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
        parcel_stats_job: schemas.WorkerResponse,
        db: Session = Depends(get_db)):
    """Update the db given the job details from the worker."""
    LOGGER.debug("Entering jobsqueue/parcel_stats")
    LOGGER.debug(parcel_stats_job)
    # Update job in db based on status
    job_db = crud.get_job(db, job_id=parcel_stats_job.server_attrs['job_id'])

    job_status = parcel_stats_job.status
    if job_status == "success":
        # Update the job status in the DB to "success"
        job_update = schemas.JobBase(
            status=STATUS_SUCCESS,
            name=job_db.name, description=job_db.description)
        # Update the scenario lulc path and stats
        LOGGER.info(parcel_stats_job.result['lulc_stats']['base'])
        data = crud.explode_lulc_counts(db, parcel_stats_job.result['lulc_stats']['base'])
        stats_update = schemas.ParcelStatsUpdate(
            lulc_stats=json.dumps(data))
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


@app.post("/jobsqueue/pattern")
def worker_pattern_response(
        pattern_job: schemas.WorkerResponse, db: Session = Depends(get_db)):
    """Update the db given the job details from the worker.

    Returned URL result will be partial to allow for local vs cloud stored
    depending on production vs dev environment.

    Args:
        pattern_job (pydantic model): a pydantic model with the following
            key/vals

        {
            "result": {
                "pattern_thumbnail_path": "relative path to file location",
                }
            "status": "success | failed",
            "server_attrs": {
               "job_id": int, "scenario_id": int
               }
       }
    """
    # Update job in db based on status
    job_db = crud.get_job(db, job_id=pattern_job.server_attrs['job_id'])
    # Update Pattern in db with the result
    pattern_db = crud.get_pattern(
        db, pattern_id=pattern_job.server_attrs['pattern_id'])

    job_status = pattern_job.status
    if job_status == "success":
        # Update the job status in the DB to "success"
        job_update = schemas.JobBase(
            status=STATUS_SUCCESS,
            name=job_db.name, description=job_db.description)
        # Update the pattern thumbnail path
        pattern_update = schemas.PatternUpdate(
            pattern_thumbnail_path=pattern_job.result['pattern_thumbnail_path'],
        )
    else:
        # Update the job status in the DB to "failed"
        job_update = schemas.JobBase(
            status=STATUS_FAILED,
            name=job_db.name, description=job_db.description)
        # Update the pattern thumbnail path with None
        pattern_update = schemas.PatternUpdate(
            pattern_thumbnail_path=None)

    LOGGER.debug('Update job status')
    _ = crud.update_job(
        db=db, job=job_update, job_id=pattern_job.server_attrs['job_id'])
    LOGGER.debug('Update pattern result')
    _ = crud.update_pattern(
        db=db, pattern=pattern_update,
        pattern_id=pattern_job.server_attrs['pattern_id'])


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


@app.post("/pattern/{session_id}", response_model=schemas.PatternResponse)
def create_pattern(session_id: str, pattern: schemas.PatternBase,
                   db: Session = Depends(get_db)):
    """Create a wallpapering pattern by saving the wkt and a thumbnail."""
    # Create job entry for pattern task
    job_schema = schemas.JobBase(
        **{"name": "create_pattern",
           "description": "create pattern thumbnail",
           "status": STATUS_PENDING})

    job_db = crud.create_job(
        db=db, session_id=session_id, job=job_schema)

    pattern_db = crud.create_pattern(
        db=db, session_id=session_id, pattern=pattern)

    # Construct worker job and add to the queue
    worker_task = {
        "job_type": JOB_TYPES["pattern_thumbnail"],
        "server_attrs": {
            "job_id": job_db.job_id, "pattern_id": pattern_db.pattern_id
        },
        "job_args": {
            "pattern_wkt": pattern_db.wkt,
            "lulc_source_url": os.path.join(WORKING_ENV, BASE_LULC),
        }
    }

    QUEUE.put_nowait((HIGH_PRIORITY, job_db.job_id, worker_task))

    return {**worker_task['server_attrs'], "label": pattern.label}


@app.get("/pattern/", response_model=list[schemas.Pattern])
def get_patterns(db: Session = Depends(get_db)):
    """Get a list of the wallpapering patterns saved in the db."""
    pattern_db = crud.get_patterns(db=db)

    return pattern_db


def _get_study_area_geometry(study_area_db):
    parcel_wkt_list = []
    for parcel in study_area_db.parcels:
        parcel_wkt_list.append(parcel.wkt)

    parcel_geoms = [shapely.wkt.loads(wkt) for wkt in parcel_wkt_list]

    parcels_combined = shapely.geometry.MultiPolygon(parcel_geoms)
    parcels_combined_wkt = parcels_combined.wkt

    LOGGER.debug(parcels_combined_wkt)
    return parcels_combined_wkt


@app.post("/wallpaper/", response_model=schemas.JobResponse)
def wallpaper(wallpaper: schemas.Wallpaper, db: Session = Depends(get_db)):
    # Get Scenario details from scenario_id
    scenario_db = crud.get_scenario(db, wallpaper.scenario_id)
    study_area_id = scenario_db.study_area_id
    study_area_db = crud.get_study_area(db, study_area_id)
    study_area_wkt = _get_study_area_geometry(study_area_db)
    session_id = study_area_db.owner_id

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
        "job_type": JOB_TYPES["wallpaper"],
        "server_attrs": {
            "job_id": job_db.job_id, "scenario_id": scenario_db.scenario_id
        },
        "job_args": {
            "target_parcel_wkt": study_area_wkt,
            "pattern_bbox_wkt": pattern_db.wkt, #TODO: make sure this is a WKT string and no just a bounding box
            "lulc_source_url": f'{WORKING_ENV}/{scenario_db.lulc_url_base}',
            }
        }

    QUEUE.put_nowait((MEDIUM_PRIORITY, job_db.job_id, worker_task))

    # Return job_id for response
    return job_db


@app.post("/lulc_fill/", response_model=schemas.JobResponse)
def lulc_fill(lulc_fill: schemas.ParcelFill,
              db: Session = Depends(get_db)):
    # Get Scenario details from scenario_id
    scenario_db = crud.get_scenario(db, lulc_fill.scenario_id)
    study_area_id = scenario_db.study_area_id
    study_area_db = crud.get_study_area(db, study_area_id)
    study_area_wkt = _get_study_area_geometry(study_area_db)
    session_id = study_area_db.owner_id

    # Create job entry for wallpapering task
    job_schema = schemas.JobBase(
        **{"name": "lulc_fill", "description": "parcel filling",
           "status": STATUS_PENDING})
    job_db = crud.create_job(
        db=db, session_id=session_id, job=job_schema)

    # Construct worker job and add to the queue
    worker_task = {
        "job_type": JOB_TYPES["lulc_fill"],
        "server_attrs": {
            "job_id": job_db.job_id, "scenario_id": scenario_db.scenario_id
        },
        "job_args": {
            "target_parcel_wkt": study_area_wkt,
            "lulc_class": lulc_fill.lulc_class,
            "lulc_source_url": f'{WORKING_ENV}/{scenario_db.lulc_url_base}',
            }
        }

    QUEUE.put_nowait((MEDIUM_PRIORITY, job_db.job_id, worker_task))

    # Return job_id for response
    return job_db


@app.post("/lulc_crop/{scenario_id}", response_model=schemas.JobResponse)
def lulc_crop(scenario_id: int, db: Session = Depends(get_db)):
    # Get Scenario details from scenario_id
    LOGGER.debug(scenario_id)
    scenario_db = crud.get_scenario(db, scenario_id)
    study_area_id = scenario_db.study_area_id
    study_area_db = crud.get_study_area(db, study_area_id)
    study_area_wkt = _get_study_area_geometry(study_area_db)
    session_id = study_area_db.owner_id

    # Create job entry for wallpapering task
    job_schema = schemas.JobBase(
        **{"name": "lulc_crop", "description": "crop lulc",
           "status": STATUS_PENDING})
    job_db = crud.create_job(
        db=db, session_id=session_id, job=job_schema)

    # Construct worker job and add to the queue
    worker_task = {
        "job_type": JOB_TYPES["lulc_crop"],
        "server_attrs": {
            "job_id": job_db.job_id, "scenario_id": scenario_id
        },
        "job_args": {
            "target_parcel_wkt": study_area_wkt,
            "lulc_source_url": f'{WORKING_ENV}/{scenario_db.lulc_url_base}',
            }
        }

    # In practice, this job is queue'd concurrently with
    # a lulc_fill or wallpaper job, so this one should be
    # prioritized.
    QUEUE.put_nowait((HIGH_PRIORITY, job_db.job_id, worker_task))

    # Return job_id for response
    return job_db


@app.post("/remove_parcel/")
def remove_parcel(delete_parcel_request: schemas.ParcelDeleteRequest,
                  db: Session = Depends(get_db)):
    status = crud.delete_parcel(db=db, **delete_parcel_request.dict())
    return status


@app.post("/add_parcel/", response_model=schemas.JobResponse)
def add_parcel(create_parcel_request: schemas.ParcelCreateRequest,
               db: Session = Depends(get_db)):

    status = crud.create_parcel(
        db=db,
        parcel_wkt=create_parcel_request.wkt,
        parcel_id=create_parcel_request.parcel_id,
        address=create_parcel_request.address,
        study_area_id=create_parcel_request.study_area_id)

    # Check if this parcel has already been computed.
    stats_db = crud.get_parcel_stats_by_id(db, create_parcel_request.parcel_id)
    if stats_db:
        # This is what the frontend is expecting.
        # even though we don't need to submit a new job,
        # the frontend is expecting to need to poll
        # for the status before requesting the results.
        return {
            "job_id": stats_db.job_id,
            "stats_id": stats_db.stats_id
        }

    # NOTE this assumes we're always using baseline LULC
    # Create job entry for wallpapering task
    job_schema = schemas.JobBase(
        **{"name": "stats_under_parcel",
           "description": "get lulc base stats under parcel",
           "status": STATUS_PENDING})
    job_db = crud.create_job(
        db=db, session_id=create_parcel_request.session_id, job=job_schema)

    parcel_stats_db = crud.create_parcel_stats(
        db=db, parcel_id=create_parcel_request.parcel_id,
        parcel_wkt=create_parcel_request.wkt, job_id=job_db.job_id)

    # Construct worker job and add to the queue
    worker_task = {
        "job_type": JOB_TYPES["stats_under_parcel"],
        "server_attrs": {
            "job_id": job_db.job_id, "stats_id": parcel_stats_db.stats_id
        },
        "job_args": {
            "target_parcel_wkt": create_parcel_request.wkt,
            "lulc_source_url": f'{WORKING_ENV}/{BASE_LULC}',
            }
        }

    QUEUE.put_nowait((HIGH_PRIORITY, job_db.job_id, worker_task))

    # Return job_id
    return worker_task['server_attrs']


@app.post("/invest/{scenario_id}")
def run_invest(scenario_id: int, db: Session = Depends(get_db)):
    """Add invest job to the queue. This runs all InVEST models."""
    # Results may already exist; no need to re-compute
    invest_results_db = crud.get_invest(db, scenario_id)
    LOGGER.info(invest_results_db)

    LOGGER.info("Add InVEST runs to queue")
    # Get the scenario LULC for model runs
    scenario_db = crud.get_scenario(db, scenario_id=scenario_id)
    if scenario_db is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    scenario_lulc = scenario_db.lulc_url_result

    # Get the session_id
    study_area_id = scenario_db.study_area_id
    study_area_db = crud.get_study_area(db, study_area_id)
    study_area_wkt = _get_study_area_geometry(study_area_db)
    session_id = study_area_db.owner_id

    # For each invest model create a new job and add to the queue
    # Also create a new invest_result entry
    invest_job_dict = {}
    for invest_model in INVEST_MODELS:
        row = [row for row in invest_results_db if row.model_name == invest_model]
        if row and row[0].result is not None:
            LOGGER.info(f'results already exist for {invest_model}')
            invest_job_dict[invest_model] = row[0].job_id
        else:
            job_schema = schemas.JobBase(
                **{"name": f"InVEST: {invest_model}",
                   "description": f"executing invest model {invest_model}",
                   "status": STATUS_PENDING})
            job_db = crud.create_job(
                db=db, session_id=session_id, job=job_schema)

            invest_schema = schemas.InvestResult(
                **{"scenario_id": scenario_id,
                   "job_id": job_db.job_id,
                   "model_name": invest_model})
            invest_db = crud.create_invest_result(
                db=db, invest_result=invest_schema)

            # Construct worker job and add to the queue
            worker_task = {
                "job_type": JOB_TYPES["invest"],
                "server_attrs": {
                    "job_id": job_db.job_id, "scenario_id": scenario_id,
                },
                "job_args": {
                    "invest_model": invest_model,
                    "lulc_source_url": scenario_lulc,
                    "study_area_wkt": study_area_wkt,
                    "scenario_id": scenario_id
                }
            }

            QUEUE.put_nowait((MEDIUM_PRIORITY, job_db.job_id, worker_task))
            invest_job_dict[invest_model] = job_db.job_id

    # Return dictionary of invest model names mapped to job_ids
    return invest_job_dict


@app.get("/invest/result/{scenario_id}")
def get_invest_results(scenario_id: int, db: Session = Depends(get_db)):
    """Return the invest result if the job was successful."""
    invest_db_list = crud.get_invest(db, scenario_id=scenario_id)
    if len(invest_db_list) == 0:
        raise HTTPException(
            status_code=404, detail="InVEST result not found")
    invest_results = {}
    servicesheds = {}
    for row in invest_db_list:
        invest_results_path = row.result
        LOGGER.debug(invest_results_path)
        if invest_results_path:
            with open(invest_results_path, 'r') as jfp:
                invest_results.update(json.loads(jfp.read()))
        if row.serviceshed:
            servicesheds[row.model_name] = row.serviceshed
    return {
        'results': invest_results,
        'servicesheds': servicesheds
    }


@app.get("/lucodes/nlud_tier_2")
def get_nlud_tier_2(db: Session = Depends(get_db)) -> list[str]:
    db_list = crud.get_nlud_tier_2(db)
    return [row.nlud_simple_class for row in db_list]


@app.post("/lucodes/nlud_tier_3")
def get_nlud_tier_3(nlud_dict: dict[str, str],
                    db: Session = Depends(get_db)) -> list[str]:
    db_list = crud.get_nlud_tier_3(
        db,
        nlud_tier_2=nlud_dict['nlud_tier_2'])
    return [row.nlud_simple_subclass for row in db_list]


@app.post("/lucodes/nlcd")
def get_nlcd(nlud_dict: dict[str, str],
             db: Session = Depends(get_db)) -> list[str]:
    db_list = crud.get_nlcd(
        db,
        nlud_tier_2=nlud_dict['nlud_tier_2'],
        nlud_tier_3=nlud_dict['nlud_tier_3'])
    return [row.nlcd_lulc for row in db_list]


@app.post("/lucodes/tree")
def get_tree(lulc_dict: dict[str, str],
             db: Session = Depends(get_db)) -> list[str]:
    db_list = crud.get_tree(
        db,
        nlud_tier_2=lulc_dict['nlud_tier_2'],
        nlud_tier_3=lulc_dict['nlud_tier_3'],
        nlcd=lulc_dict['nlcd'])
    return [row.tree_canopy_cover for row in db_list]


@app.post("/lucodes/lucode")
def get_lucode(lulc_dict: schemas.LulcRequest,
               db: Session = Depends(get_db)) -> Optional[int]:
    row = crud.get_lucode(
        db,
        nlud_tier_2=lulc_dict.nlud_tier_2,
        nlud_tier_3=lulc_dict.nlud_tier_3,
        nlcd=lulc_dict.nlcd,
        tree=lulc_dict.tree)
    if row:
        return row.lucode
    return None
