# backend/app/tasks/celery_app.py - v4.0
from celery import Celery
from celery.schedules import crontab
from app.config import config

celery_app = Celery(
    'chainstaker',
    broker=config.CELERY_BROKER_URL,
    backend=config.CELERY_RESULT_BACKEND,
    include=['app.tasks.analytics_tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

celery_app.conf.beat_schedule = {
    'snapshot-tvl-every-5-minutes': {
        'task': 'tasks.snapshot_tvl',
        'schedule': 300.0,
    },
    'snapshot-users-every-5-minutes': {
        'task': 'tasks.snapshot_users',
        'schedule': 300.0,
    },
    'snapshot-tier-distribution-every-10-minutes': {
        'task': 'tasks.snapshot_tier_distribution',
        'schedule': 600.0,
    },
    'snapshot-top-users-every-15-minutes': {
        'task': 'tasks.snapshot_top_users',
        'schedule': 900.0,
    },
    'calculate-effective-apy-every-15-minutes': {
        'task': 'tasks.calculate_effective_apy',
        'schedule': 900.0,
    },
    'cleanup-old-metrics-daily': {
        'task': 'tasks.cleanup_old_metrics',
        'schedule': crontab(hour=3, minute=0),
    },
}