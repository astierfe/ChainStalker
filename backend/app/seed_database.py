# backend/seed_database.py - v1.0
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app.models import users_collection, stakes_collection, db

def clear_database():
    """Clear existing data"""
    print("🗑️  Clearing existing data...")
    users_collection.delete_many({})
    stakes_collection.delete_many({})
    print("✅ Database cleared\n")

def seed_users():
    """Create test users (amounts in DAI, not wei, for MongoDB compatibility)"""
    print("👥 Creating test users...")
    
    users = [
        {
            'address': '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
            'total_staked': 5000,  # 5000 DAI
            'total_rewards_claimed': 250,
            'active_stakes_count': 3,
            'created_at': datetime.utcnow() - timedelta(days=60),
            'updated_at': datetime.utcnow()
        },
        {
            'address': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
            'total_staked': 3000,
            'total_rewards_claimed': 180,
            'active_stakes_count': 2,
            'created_at': datetime.utcnow() - timedelta(days=45),
            'updated_at': datetime.utcnow()
        },
        {
            'address': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
            'total_staked': 10000,
            'total_rewards_claimed': 600,
            'active_stakes_count': 5,
            'created_at': datetime.utcnow() - timedelta(days=90),
            'updated_at': datetime.utcnow()
        },
        {
            'address': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
            'total_staked': 1500,
            'total_rewards_claimed': 75,
            'active_stakes_count': 1,
            'created_at': datetime.utcnow() - timedelta(days=30),
            'updated_at': datetime.utcnow()
        },
        {
            'address': '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
            'total_staked': 7500,
            'total_rewards_claimed': 450,
            'active_stakes_count': 4,
            'created_at': datetime.utcnow() - timedelta(days=75),
            'updated_at': datetime.utcnow()
        },
        {
            'address': '0x976ea74026e726554db657fa54763abd0c3a0aa9',
            'total_staked': 2000,
            'total_rewards_claimed': 100,
            'active_stakes_count': 1,
            'created_at': datetime.utcnow() - timedelta(days=20),
            'updated_at': datetime.utcnow()
        },
        {
            'address': '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
            'total_staked': 0,
            'total_rewards_claimed': 50,
            'active_stakes_count': 0,
            'created_at': datetime.utcnow() - timedelta(days=100),
            'updated_at': datetime.utcnow() - timedelta(days=50)
        },
    ]
    
    users_collection.insert_many(users)
    print(f"✅ Created {len(users)} users\n")
    return users

def seed_stakes(users):
    """Create test stakes"""
    print("📊 Creating test stakes...")
    
    stakes = []
    stake_configs = [
        # User 1: 3 active stakes (mixed tiers)
        {'user': users[0], 'amount': 2000, 'tier': 0, 'days_ago': 10, 'rewards': 50},
        {'user': users[0], 'amount': 1500, 'tier': 1, 'days_ago': 35, 'rewards': 100},
        {'user': users[0], 'amount': 1500, 'tier': 2, 'days_ago': 60, 'rewards': 100},
        
        # User 2: 2 active stakes (tier 1 and 2)
        {'user': users[1], 'amount': 1500, 'tier': 1, 'days_ago': 40, 'rewards': 100},
        {'user': users[1], 'amount': 1500, 'tier': 2, 'days_ago': 45, 'rewards': 80},
        
        # User 3: 5 active stakes (all tiers)
        {'user': users[2], 'amount': 2000, 'tier': 0, 'days_ago': 5, 'rewards': 20},
        {'user': users[2], 'amount': 2000, 'tier': 0, 'days_ago': 8, 'rewards': 30},
        {'user': users[2], 'amount': 2000, 'tier': 1, 'days_ago': 50, 'rewards': 150},
        {'user': users[2], 'amount': 2000, 'tier': 2, 'days_ago': 80, 'rewards': 200},
        {'user': users[2], 'amount': 2000, 'tier': 2, 'days_ago': 90, 'rewards': 200},
        
        # User 4: 1 active stake (tier 0)
        {'user': users[3], 'amount': 1500, 'tier': 0, 'days_ago': 15, 'rewards': 75},
        
        # User 5: 4 active stakes (mixed)
        {'user': users[4], 'amount': 2000, 'tier': 1, 'days_ago': 40, 'rewards': 120},
        {'user': users[4], 'amount': 2000, 'tier': 1, 'days_ago': 45, 'rewards': 110},
        {'user': users[4], 'amount': 1500, 'tier': 2, 'days_ago': 70, 'rewards': 110},
        {'user': users[4], 'amount': 2000, 'tier': 2, 'days_ago': 75, 'rewards': 110},
        
        # User 6: 1 active stake (tier 2)
        {'user': users[5], 'amount': 2000, 'tier': 2, 'days_ago': 20, 'rewards': 100},
        
        # User 7: 1 unstaked (past activity)
        {'user': users[6], 'amount': 1000, 'tier': 1, 'days_ago': 100, 'rewards': 50, 'status': 'unstaked'},
    ]
    
    tier_names = {0: '7 days', 1: '30 days', 2: '90 days'}
    
    for idx, config in enumerate(stake_configs):
        user = config['user']
        start_time = int((datetime.utcnow() - timedelta(days=config['days_ago'])).timestamp())
        
        stake = {
            'user_address': user['address'],
            'stake_index': idx,
            'amount': config['amount'],
            'tier_id': config['tier'],
            'start_time': start_time,
            'last_reward_claim': start_time,
            'status': config.get('status', 'active'),
            'total_rewards_claimed': config['rewards'],
            'tx_hash': f"0x{'0' * 63}{idx}",
            'block_number': 12345 + idx,
            'created_at': datetime.utcnow() - timedelta(days=config['days_ago']),
            'updated_at': datetime.utcnow()
        }
        
        stakes.append(stake)
    
    stakes_collection.insert_many(stakes)
    
    # Count by tier
    tier_counts = {0: 0, 1: 0, 2: 0}
    for stake in stakes:
        if stake['status'] == 'active':
            tier_counts[stake['tier_id']] += 1
    
    print(f"✅ Created {len(stakes)} stakes:")
    print(f"   - Tier 0 (7 days):  {tier_counts[0]} stakes")
    print(f"   - Tier 1 (30 days): {tier_counts[1]} stakes")
    print(f"   - Tier 2 (90 days): {tier_counts[2]} stakes")
    print(f"   - Total active: {sum(tier_counts.values())}")
    print()

def print_summary():
    """Print database summary"""
    print("📈 Database Summary:")
    print(f"   - Users: {users_collection.count_documents({})}")
    print(f"   - Active users: {users_collection.count_documents({'active_stakes_count': {'$gt': 0}})}")
    print(f"   - Total stakes: {stakes_collection.count_documents({})}")
    print(f"   - Active stakes: {stakes_collection.count_documents({'status': 'active'})}")
    
    # Calculate TVL
    pipeline = [
        {'$match': {'status': 'active'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]
    result = list(stakes_collection.aggregate(pipeline))
    tvl = result[0]['total'] if result else 0
    print(f"   - Total Value Locked: {tvl} DAI")
    print()

def main():
    print("=" * 60)
    print("🌱 ChainStaker Database Seeder")
    print("=" * 60)
    print()
    
    try:
        # Test connection
        db.command('ping')
        print("✅ MongoDB connected\n")
        
        # Clear existing data
        clear_database()
        
        # Seed data
        users = seed_users()
        seed_stakes(users)
        
        # Print summary
        print_summary()
        
        print("=" * 60)
        print("✅ Database seeding complete!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. View data in MongoDB Compass: mongodb://localhost:27017/chainstaker")
        print("2. Test API: curl http://localhost:5000/api/analytics | jq")
        print("3. Trigger Celery tasks manually:")
        print("   docker-compose exec celery-worker celery -A app.tasks.celery_app call tasks.snapshot_tvl")
        print("4. Wait 5-10 minutes for scheduled tasks to run")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())