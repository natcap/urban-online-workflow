import asyncio
import time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine

# Create the db tables
models.Base.metadata.create_all(bind=engine)


app = FastAPI()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create a queue that we will use to store our "workload".
QUEUE = asyncio.Queue()
TASKS = []

# Normally blocking call (InVEST model, PGP call, wallpapering, ...)
def my_op(sleep_time):
    print('Running my_op')
    time.sleep(sleep_time)
    # Sleep for the "sleep_for" seconds.
    #await asyncio.sleep(sleep_time)
    print(f'Done sleeping for {sleep_time} seconds')

# Our worker to run tasks
async def worker(name, queue):
    while True:
        # Get a "work item" out of the queue.
        job_details = await queue.get()
        print(f'job details: {job_details}')

        # Sleep for the "sleep_for" seconds.
        #await asyncio.sleep(sleep_for)
        run_op = job_details['job']
        # 'gather' and 'to_thread' allows us to await blocking calls for
        # I/O bound or CPU bound processes.
        await asyncio.gather(
            asyncio.to_thread(run_op, job_details['param']))

        # Notify the queue that the "work item" has been processed.
        queue.task_done()

        print(f'{name} has slept for {job_details["param"]} seconds')


# Endpoint

@app.get("/test-async-job/{sleep_time}")
async def test_async_job(sleep_time: int, db: Session = Depends(get_db)):
    job_task = {'job': my_op, 'param': sleep_time}
    QUEUE.put_nowait(job_task)
    task = asyncio.create_task(worker(f'worker-{len(TASKS)+1}', QUEUE))
    TASKS.append(task)
    print('return job added')
    return "job added"

