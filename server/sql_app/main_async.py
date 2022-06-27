import asyncio
import time
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


app = FastAPI()

# To make sure Exceptions aren't silently ignored:
# https://stackoverflow.com/questions/27297638/when-asyncio-task-gets-stored-after-creation-exceptions-from-task-get-muted/27299160#27299160
def handle_result(fut):
    if fut.exception():
        fut.result()  # This will raise the exception.

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create a queue that we will use to store our "workload".
QUEUE = asyncio.PriorityQueue()
TASKS = []
STATUS = {0: "pending", 1: "running", 2: "success", 3: "failed"}

# Normally blocking call (InVEST model, PGP call, wallpapering, ...)
def my_op(job_details):
    LOGGER.debug('Running my_op')

    sleep_time = job_details['param']
    time.sleep(sleep_time)
    # Sleep for the "sleep_for" seconds.
    #await asyncio.sleep(sleep_time)
    LOGGER.debug(f'Done sleeping for {sleep_time} seconds')

# Our worker to run tasks
async def worker(name, queue):
    while True:
        # Get a "work item" out of the queue.
        job_priority, job_details = await queue.get()
        LOGGER.debug(f'job details: {job_details}')

        # I had a try/except here before adding the `add_done_callback` because
        # there was an exception happening that I was never seeing in the console
        try:
            job_schema = schemas.JobBase(**{"name": "my-job", "description": "my-desc", "status": 1})
            LOGGER.debug('Update job')
            crud.update_job(db=job_details['db'], job=job_schema, job_id=job_details['job_id'])
        except Exception as err:
            LOGGER.error(f'Error: {err}')

        # Sleep for the "sleep_for" seconds.
        #await asyncio.sleep(sleep_for)
        run_op = job_details['job']
        # 'gather' and 'to_thread' allows us to await blocking calls for
        # I/O bound or CPU bound processes.
        await asyncio.gather(
            asyncio.to_thread(run_op, job_details))

        # Notify the queue that the "work item" has been processed.
        queue.task_done()
        job_schema = schemas.JobBase(**{"name": "my-job", "description": "my-desc", "status": 2})
        LOGGER.debug('Update job')
        crud.update_job(db=job_details['db'], job=job_schema, job_id=job_details['job_id'])

        LOGGER.debug(f'{name} has slept for {job_details["param"]} seconds')


# Endpoint

@app.get("/test-async-job/{sleep_time}")
async def test_async_job(sleep_time: int, db: Session = Depends(get_db)):
    job_schema = schemas.JobBase(**{"name": "my-job", "description": "my-desc", "status": 0})
    job_db = crud.create_job(db, job_schema)

    job_task = {'job': my_op, 'param': sleep_time, 'job_id': job_db.job_id, 'db': db}
    priority = 2

    QUEUE.put_nowait((priority, job_task))
    task = asyncio.create_task(worker(f'worker-{len(TASKS)+1}', QUEUE))
    task.add_done_callback(handle_result)
    TASKS.append(task)
    LOGGER.debug('return job added')
    return "job added"

