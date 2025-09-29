# Structure Backend - v1.2

```
backend/
├── app/
│   ├── __init__.py                 ✅ Créé
│   ├── config.py                   ✅ Créé
│   ├── models/
│   │   ├── __init__.py             ✅ Créé
│   │   ├── user.py                 ✅ Créé (Étape 2.2)
│   │   ├── stake.py                ✅ Créé (Étape 2.2)
│   │   └── metric.py               ⏳ Étape 2.4
│   ├── services/
│   │   ├── __init__.py             📝 Créer (vide)
│   │   ├── blockchain_listener.py  ✅ Créé (Étape 2.2)
│   │   ├── analytics.py            ⏳ Étape 2.4
│   │   └── notifications.py        ⏳ Étape 2.5
│   ├── api/
│   │   ├── __init__.py             📝 Créer (vide)
│   │   ├── users.py                ✅ Créé (minimal)
│   │   ├── stakes.py               ✅ Créé (minimal)
│   │   └── analytics.py            ✅ Créé (minimal)
│   ├── tasks/
│   │   ├── __init__.py             📝 Créer (vide)
│   │   ├── celery_app.py           ⏳ Étape 2.4
│   │   └── analytics_tasks.py      ⏳ Étape 2.4
│   ├── utils/
│   │   ├── __init__.py             📝 Créer (vide)
│   │   └── web3_utils.py           ✅ Créé (Étape 2.2)
│   └── abi/
│       ├── StakingPool.json        ✅ Créé (Étape 2.2)
│       └── ERC20.json              ✅ Créé (Étape 2.2)
├── logs/                           📝 Créer dossier
├── mongo-init/                     📝 Créer dossier (optionnel)
├── tests/                          ⏳ Phase tests
├── docker-compose.yml              ✅ Mis à jour (listener ajouté)
├── Dockerfile                      ✅ Créé
├── requirements.txt                ✅ Créé
├── .env.example                    ✅ Créé
├── .env                            📝 Copier depuis .env.example
├── .gitignore                      ✅ Créé
├── run.py                          ✅ Créé
└── README.md                       📝 À créer (optionnel)
```

## Commandes Setup

```bash
# Créer structure (si pas déjà fait)
mkdir -p app/{models,services,api,tasks,utils,abi} logs mongo-init

# Créer __init__.py vides (si pas déjà fait)
touch app/services/__init__.py
touch app/api/__init__.py
touch app/tasks/__init__.py
touch app/utils/__init__.py

# Copier .env (si pas déjà fait)
cp .env.example .env

# IMPORTANT: Modifier .env avec vraies valeurs
# - STAKING_POOL_ADDRESS
# - DAI_TOKEN_ADDRESS
# - RPC_URL si différent
nano .env

# Rebuild avec nouveau service listener
docker-compose up --build -d

# Vérifier logs
docker-compose logs -f blockchain-listener
```

## Test Event Listener

```bash
# Vérifier connexion RPC
docker-compose exec blockchain-listener python -c "from app.utils.web3_utils import web3_manager; print(f'Connected: {web3_manager.w3.is_connected()}')"

# Voir events capturés
docker-compose exec mongodb mongosh chainstaker --eval "db.raw_events.find().limit(5)"

# Voir stakes créés
docker-compose exec mongodb mongosh chainstaker --eval "db.stakes.find().limit(5)"
```