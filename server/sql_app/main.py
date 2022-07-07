import asyncio
import json
import logging
import sys

from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine


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
QUEUE = asyncio.PriorityQueue()
TASKS = set()
STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_SUCCESS = "success"
STATUS_FAIL = "failed"

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


# To make sure Exceptions aren't silently ignored:
# https://stackoverflow.com/questions/27297638/when-asyncio-task-gets-stored-after-creation-exceptions-from-task-get-muted/27299160#27299160
def handle_result(fut):
    # To prevent keeping references to finished tasks forever,
    # make each task remove its own reference from the set after
    # completion:
    #task.add_done_callback(TASKS.discard)
    TASKS.discard(fut)

    if fut.exception():
        fut.result()  # This will raise the exception.


# Our worker to run tasks
async def worker(name, queue):
    """Handle jobs in the priority queue.

    Args:
        name (string) - name for the asyncio worker task
        queue (asyncio.PriorityQueue) - priority queue to get jobs from where
            the returned queue item is a tuple of: (priority (int), job (dict))
            The job dictionary has keys of:
                'job' (object) - a function to call
                'param' (object) - parameters to pass to `job`.
                'name' (string) - name of job
                'description' (string) - job description
                'status' (string) - job status
                'job_id' (int) - database job ID
                'db' (database reference) - db session
    """
    while True:
        # Get a "work item" out of the queue.
        job_priority, job_details = await queue.get()
        LOGGER.debug(f'job details: {job_details}')

        # I had a try/except here before adding the `add_done_callback` because
        # there was an exception happening that I was never seeing in the console
        try:
            # Update the job status in the DB to "running"
            job_schema = schemas.JobBase(**{
                'name': job_details['name'],
                'description': job_details['description'],
                'status': STATUS_RUNNING})
            LOGGER.debug('Update job status')
            crud.update_job(
                db=job_details['db'], job=job_schema, job_id=job_details['job_id'])
        except Exception as err:
            LOGGER.error(f'Error: {err}')

        run_op = job_details['job']
        # 'gather' and 'to_thread' allows us to await blocking calls for
        # I/O bound or CPU bound processes.
        await asyncio.gather(
            asyncio.to_thread(run_op, job_details['param']))

        # Notify the queue that the "work item" has been processed.
        queue.task_done()
        # Update job status to "success"
        job_schema = schemas.JobBase(**{
            'name': job_details['name'],
            'description': job_details['description'],
            'status': STATUS_SUCCESS})
        LOGGER.debug('Update job status')
        crud.update_job(
            db=job_details['db'], job=job_schema, job_id=job_details['job_id'])

        LOGGER.debug(f'JOB: {job_details["name"]} has completed')


### User / Session Endpoints ###

@app.post("/users/", response_model=schemas.UserOut)
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

@app.post("/scenario/{session_id}", response_model=schemas.ScenarioOut)
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


### Job Endpoints ###

@app.get("/test-async-job/{sleep_time}", response_model=schemas.JobOut)
async def test_async_job(sleep_time: int, db: Session = Depends(get_db)):
    job_schema = schemas.JobBase(
        **{"name": "sleep", "description": "sleep for a few seconds.",
           "status": STATUS_PENDING})
    # Add the job to the DB
    job_db = crud.create_job(db, job_schema)

    # Set up job package
    job_task = {
        **job_schema.dict(), 'job': crud.test_job_task, 'param': sleep_time,
        'job_id': job_db.job_id, 'db': db}
    priority = 2

    QUEUE.put_nowait((priority, job_task))
    task = asyncio.create_task(worker(f'worker-{len(TASKS)+1}', QUEUE))

    # This helps catch any exceptions that might have happened in our worker
    task.add_done_callback(handle_result)

    TASKS.add(task)
    LOGGER.debug(f'Job {job_db.job_id} added')
    # Return the job_id in the response
    return {'job_id': job_db.job_id}


@app.get("/jobsqueue/")
async def worker_job_request(db: Session = Depends(get_db)):
    """If there's work to be done in the queue send it to the worker."""
    try:
        job_priority, job_details = await queue.get_nowait()
        return json.dumps({"job_id": 1, "test": True})
    except QueueEmpty:
        return None


@app.get("/jobsqueue/{job_id}")
async def worker_job_response(
        worker: schemas.WorkerResponse, db: Session = Depends(get_db)):
    """Update the queue and db given the job details from the worker."""
    pass


@app.post("/jobs/", response_model=schemas.Job)
def create_job(
    job: schemas.JobBase, db: Session = Depends(get_db)
):
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

@app.get("/pattern/{session_id}", response_model=list[schemas.PatternJob])
def create_pattern(session_id: str, pattern: schemas.Pattern, ndb: Session = Depends(get_db)):
    #pattern_job = crud.create_pattern(db=db, session_id=session_id, pattern=pattern)
    #return pattern_job
    pass


@app.get("/lulc-table/{session_id}")
def lulc_under_parcel_summary(session_id: str, wkt_parcel: str, db: Session = Depends(get_db)):
    #lulc_summary_table = crud.lulc_under_parcel_summary(db=db, session_id=session_id, pattern=pattern)
    #return lulc_summary_table
    pass


@app.get("/wallpapering/{session_id}/{scenario_id}")
def run_wallpapering(session_id: str, scenario_id: int, db: Session = Depends(get_db)):
    #wallpaper = crud.run_wallpaper(db=db, session_id=session_id, scenario_id=scenario_id)
    #return wallpaper
    pass

@app.get("/wallpapering/{job_id}")
def read_wallpapering_results(job_id: int, db: Session = Depends(get_db)):
    #wallpaper_results = crud.get_wallpaper_results(db=db, job_id=job_id)
    #return wallpaper_results
    pass


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

