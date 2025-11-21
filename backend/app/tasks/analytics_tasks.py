# backend/app/tasks/analytics_tasks.py - v4.3
import logging
from datetime import datetime, timedelta
from app.tasks.celery_app import celery_app
from app.models.metric import Metric
from app.models import stakes_collection, users_collection, raw_events_collection
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
    """
    Record top 10 users by total staked amount.

    Uses MongoDB aggregation on stakes collection to calculate accurate total_staked.
    This fixes the issue where users.total_staked was incorrect due to uint256 overflow.
    """
    try:
        # Aggregate active stakes by user to get accurate total_staked
        pipeline = [
            {'$match': {'status': 'active'}},
            {
                '$group': {
                    '_id': '$user_address',
                    'total_staked': {'$sum': convert_to_double('$amount')},
                    'active_stakes': {'$sum': 1}
                }
            },
            {'$sort': {'total_staked': -1}},
            {'$limit': 10}
        ]

        aggregated_users = list(stakes_collection.aggregate(pipeline))

        # Enrich with rewards data from users collection
        top_users_data = []
        for agg_user in aggregated_users:
            user_address = agg_user['_id']
            user_doc = users_collection.find_one({'address': user_address})

            total_staked_int = int(agg_user['total_staked'])

            top_users_data.append({
                'address': user_address,
                'total_staked': str(total_staked_int),
                'rewards_claimed': str(user_doc.get('total_rewards_claimed', 0)) if user_doc else '0',
                'active_stakes': agg_user['active_stakes']
            })

        total_top_staked = sum(int(user['total_staked']) for user in top_users_data)

        Metric.record(
            metric_type='top_users',
            value=len(top_users_data),
            metadata={
                'users': top_users_data,
                'total_staked': str(total_top_staked)
            }
        )

        logger.info(f"✅ Top Users Snapshot: {len(top_users_data)} users, {total_top_staked / 10**18:.2f} DAI")
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

@celery_app.task(name='tasks.snapshot_rewards_timeline')
def snapshot_rewards_timeline():
    """
    Record rewards claimed timeline by aggregating RewardsClaimed events by day.

    Aggregates raw_events collection to calculate:
    - Daily rewards claimed
    - Number of claims per day
    - Used for RewardsTimelineChart component
    """
    try:
        # Look back 90 days for historical data
        start_time = datetime.utcnow() - timedelta(days=90)

        # Aggregate RewardsClaimed events by day
        pipeline = [
            {
                '$match': {
                    'event_name': 'RewardsClaimed',
                    'processed_at': {'$gte': start_time}
                }
            },
            {
                '$project': {
                    'date': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$processed_at'
                        }
                    },
                    'amount': convert_to_double('$args.rewards')
                }
            },
            {
                '$group': {
                    '_id': '$date',
                    'total_rewards': {'$sum': '$amount'},
                    'claim_count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]

        daily_rewards = list(raw_events_collection.aggregate(pipeline))

        # Calculate totals
        total_days = len(daily_rewards)
        total_rewards_sum = 0
        timeline_data = []

        for day_data in daily_rewards:
            total_rewards_int = int(day_data['total_rewards'])
            total_rewards_sum += total_rewards_int

            timeline_data.append({
                'date': day_data['_id'],
                'rewards_wei': str(total_rewards_int),
                'rewards_dai': round(total_rewards_int / 10**18, 2),
                'claim_count': day_data['claim_count']
            })

        # Store all timeline data as a single metric (like snapshot_activity_heatmap does)
        Metric.record(
            metric_type='rewards_timeline',
            value=total_days,
            metadata={
                'timeline_data': timeline_data,
                'days_covered': total_days,
                'total_rewards_wei': str(total_rewards_sum),
                'total_rewards_dai': round(total_rewards_sum / 10**18, 2),
                'total_claims': sum(day['claim_count'] for day in daily_rewards)
            }
        )

        logger.info(f"✅ Rewards Timeline: {total_days} days, {total_rewards_sum / 10**18:.2f} DAI total")
        return {'status': 'success', 'days': total_days, 'total_rewards': str(total_rewards_sum)}

    except Exception as e:
        logger.error(f"❌ Rewards Timeline Snapshot failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@celery_app.task(name='tasks.snapshot_activity_heatmap')
def snapshot_activity_heatmap():
    """
    Record activity heatmap by aggregating raw_events by hour and day.

    Aggregates raw_events collection to calculate:
    - Events per hour for each day (24 hours x 7-90 days)
    - Breakdown by event type (StakeCreated, RewardsClaimed, Unstaked)
    - Used for ActivityHeatmap component
    """
    try:
        # Look back 30 days for heatmap
        start_time = datetime.utcnow() - timedelta(days=30)

        # Aggregate events by date and hour
        pipeline = [
            {
                '$match': {
                    'processed_at': {'$gte': start_time},
                    'event_name': {'$in': ['StakeCreated', 'RewardsClaimed', 'Unstaked']}
                }
            },
            {
                '$project': {
                    'date': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$processed_at'
                        }
                    },
                    'hour': {'$hour': '$processed_at'},
                    'event_name': 1
                }
            },
            {
                '$group': {
                    '_id': {
                        'date': '$date',
                        'hour': '$hour',
                        'event': '$event_name'
                    },
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id.date': 1, '_id.hour': 1}}
        ]

        activity_data = list(raw_events_collection.aggregate(pipeline))

        # Group by date-hour for storage
        hourly_activity = {}
        for item in activity_data:
            date_hour_key = f"{item['_id']['date']}_{item['_id']['hour']:02d}"
            event_type = item['_id']['event']

            if date_hour_key not in hourly_activity:
                hourly_activity[date_hour_key] = {
                    'date': item['_id']['date'],
                    'hour': item['_id']['hour'],
                    'StakeCreated': 0,
                    'RewardsClaimed': 0,
                    'Unstaked': 0,
                    'total': 0
                }

            hourly_activity[date_hour_key][event_type] = item['count']
            hourly_activity[date_hour_key]['total'] += item['count']

        # Store aggregated data as a single metric with all hourly data
        Metric.record(
            metric_type='activity_heatmap',
            value=len(hourly_activity),
            metadata={
                'hourly_data': list(hourly_activity.values()),
                'days_covered': len(set(item['date'] for item in hourly_activity.values())),
                'total_events': sum(item['total'] for item in hourly_activity.values())
            }
        )

        logger.info(f"✅ Activity Heatmap: {len(hourly_activity)} time slots recorded")
        return {'status': 'success', 'time_slots': len(hourly_activity)}

    except Exception as e:
        logger.error(f"❌ Activity Heatmap Snapshot failed: {str(e)}")
        return {'status': 'error', 'message': str(e)}