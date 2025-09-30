# backend/app/models/metric.py - v1.0
from datetime import datetime, timedelta
from app.models import metrics_collection

class Metric:
    @staticmethod
    def record(metric_type, value, metadata=None):
        """Record a metric snapshot"""
        metric_data = {
            'type': metric_type,
            'value': value,
            'metadata': metadata or {},
            'timestamp': datetime.utcnow()
        }
        metrics_collection.insert_one(metric_data)
        return metric_data
    
    @staticmethod
    def get_history(metric_type, hours=24, limit=100):
        """Get metric history for the last N hours"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        return list(metrics_collection.find(
            {
                'type': metric_type,
                'timestamp': {'$gte': since}
            }
        ).sort('timestamp', -1).limit(limit))
    
    @staticmethod
    def get_latest(metric_type):
        """Get latest metric value"""
        return metrics_collection.find_one(
            {'type': metric_type},
            sort=[('timestamp', -1)]
        )
    
    @staticmethod
    def get_all_types():
        """Get list of all metric types"""
        return metrics_collection.distinct('type')
    
    @staticmethod
    def cleanup_old(days=30):
        """Delete metrics older than N days"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = metrics_collection.delete_many({'timestamp': {'$lt': cutoff}})
        return result.deleted_count