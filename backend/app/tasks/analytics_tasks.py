# backend/app/tasks/analytics_tasks.py - v4.2
import logging
from datetime import datetime
from app.tasks.celery_app import celery_app
from app.models.metric import Metric
from app.models import stakes_collection, users_collection
from app.utils.mongodb_helpers import convert_to_double, convert_uint256_for_mongodb

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@celery_app.task(name='tasks.snapshot_tvl')
def snapshot_tvl():
    """Calculate and record Total Value Locked (TVL)"""
    try:
        # Use convert_to_double to handle mixed int/string types in amount field
        pipeline = [
            {'$match': {'status': 'active'}},
            {'$group': {'_id': None, 'total': {'$sum': convert_to_double('$amount')}}}
        ]

        result = list(stakes_collection.aggregate(pipeline))
        tvl = int(result[0]['total']) if result else 0

        active_stakes_count = stakes_collection.count_documents({'status': 'active'})

        # Convert large TVL values to MongoDB-safe format (int or string)
        Metric.record(
            metric_type='tvl',
            value=convert_uint256_for_mongodb(tvl),
            metadata={
                'active_stakes': active_stakes_count,
                'tvl_formatted': f"{tvl / 10**18:,.2f} DAI"
            }
        )
        
        logger.info(f"✅ TVL Snapshot: {tvl} DAI ({active_stakes_count} active stakes)")
        return {'status': 'success', 'tvl': str(tvl), 'active_stakes': active_stakes_count}
    
    except Exception as e:
        logger.error(f"❌ TVL Snapshot failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.snapshot_users')
def snapshot_users():
    """Calculate and record user statistics"""
    try:
        total_users = users_collection.count_documents({})
        active_users = users_collection.count_documents({'active_stakes_count': {'$gt': 0}})
        
        Metric.record(
            metric_type='users',
            value=total_users,
            metadata={
                'active_users': active_users,
                'inactive_users': total_users - active_users
            }
        )
        
        logger.info(f"✅ Users Snapshot: {total_users} total ({active_users} active)")
        return {'status': 'success', 'total': total_users, 'active': active_users}
    
    except Exception as e:
        logger.error(f"❌ Users Snapshot failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.snapshot_tier_distribution')
def snapshot_tier_distribution():
    """Record stake distribution across tiers"""
    try:
        # Use convert_to_double to handle mixed int/string types in amount field
        pipeline = [
            {'$match': {'status': 'active'}},
            {
                '$group': {
                    '_id': '$tier_id',
                    'count': {'$sum': 1},
                    'total_amount': {'$sum': convert_to_double('$amount')}
                }
            }
        ]

        tiers = list(stakes_collection.aggregate(pipeline))

        tier_data = {}
        for tier in tiers:
            tier_data[f'tier_{tier["_id"]}'] = {
                'count': tier['count'],
                'amount': str(int(tier['total_amount']))
            }
        
        total_active = sum(t['count'] for t in tiers)
        
        Metric.record(
            metric_type='tier_distribution',
            value=total_active,
            metadata=tier_data
        )
        
        logger.info(f"✅ Tier Distribution: {len(tiers)} tiers, {total_active} total stakes")
        return {'status': 'success', 'tiers': tier_data}
    
    except Exception as e:
        logger.error(f"❌ Tier Distribution Snapshot failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.snapshot_top_users')
def snapshot_top_users():
    """Record top 10 users by total staked amount"""
    try:
        top_users = list(users_collection.find(
            {'total_staked': {'$gt': 0}}
        ).sort('total_staked', -1).limit(10))
        
        top_users_data = [
            {
                'address': user['address'],
                'total_staked': str(user['total_staked']),
                'rewards_claimed': str(user.get('total_rewards_claimed', 0)),
                'active_stakes': user.get('active_stakes_count', 0)
            }
            for user in top_users
        ]
        
        total_top_staked = sum(user['total_staked'] for user in top_users)
        
        Metric.record(
            metric_type='top_users',
            value=len(top_users_data),
            metadata={
                'users': top_users_data,
                'total_staked': str(total_top_staked)
            }
        )
        
        logger.info(f"✅ Top Users Snapshot: {len(top_users_data)} users, {total_top_staked} DAI")
        return {'status': 'success', 'count': len(top_users_data)}
    
    except Exception as e:
        logger.error(f"❌ Top Users Snapshot failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.calculate_effective_apy')
def calculate_effective_apy():
    """Calculate effective APY based on actual rewards distributed"""
    try:
        # Use convert_to_double to handle mixed int/string types
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'total_staked': {'$sum': convert_to_double('$amount')},
                    'total_rewards': {'$sum': convert_to_double('$total_rewards_claimed')}
                }
            }
        ]

        result = list(stakes_collection.aggregate(pipeline))

        if result and result[0]['total_staked'] > 0:
            total_staked = int(result[0]['total_staked'])
            total_rewards = int(result[0]['total_rewards'])
            
            effective_apy = (total_rewards / total_staked) * 100 if total_staked > 0 else 0
            
            Metric.record(
                metric_type='effective_apy',
                value=int(effective_apy * 100),
                metadata={
                    'apy_percentage': f"{effective_apy:.2f}%",
                    'total_staked': str(total_staked),
                    'total_rewards': str(total_rewards)
                }
            )
            
            logger.info(f"✅ Effective APY: {effective_apy:.2f}%")
            return {'status': 'success', 'apy': effective_apy}
        else:
            logger.info("⚠️ No data for APY calculation")
            return {'status': 'success', 'apy': 0}
    
    except Exception as e:
        logger.error(f"❌ Effective APY calculation failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.cleanup_old_metrics')
def cleanup_old_metrics():
    """Delete metrics older than 30 days"""
    try:
        deleted_count = Metric.cleanup_old(days=30)
        
        logger.info(f"✅ Cleanup: Deleted {deleted_count} old metrics")
        return {'status': 'success', 'deleted': deleted_count}
    
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.test_mongodb')
def test_mongodb():
    """Test MongoDB connection from Celery"""
    try:
        from app.models import db
        collections = db.list_collection_names()
        logger.info(f"✅ MongoDB connected! Collections: {collections}")
        return {'status': 'success', 'collections': collections}
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}