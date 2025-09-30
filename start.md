🚀 Ordre de démarrage au redémarrage du PC

️⃣ Arrêter MongoDB local (si installé)
bash# Windows PowerShell (Admin)
net stop MongoDB

2️⃣ Démarrer Anvil (Blockchain local)
bash# Terminal 1 - Dans contracts/
cd /c/_Felix/projet/ChainStaker/contracts
anvil
Laisser tourner (ne pas fermer ce terminal)

3️⃣ Démarrer Docker Backend
bash# Terminal 2 - Dans backend/
cd /c/_Felix/projet/ChainStaker/backend
docker-compose up -d

# Vérifier que tout démarre
docker-compose ps

# Voir les logs
docker-compose logs -f blockchain-listener
4️⃣ Vérifier que tout fonctionne
bash# Test API
curl http://localhost:5000/health

# Test analytics
curl http://localhost:5000/api/analytics/ | jq

# Test MongoDB Compass
# Ouvrir Compass → mongodb://localhost:27017/chainstaker


###########################################################
###########################################################
###########################################################
📝 Quick Start (optionnel)

## 1. Stop MongoDB local service
```powershell
net stop MongoDB
2. Start Anvil (Terminal 1)
bashcd contracts
anvil
Leave this terminal open.
3. Start Backend (Terminal 2)
bashcd backend
docker-compose up -d
docker-compose logs -f
4. Verify

API: http://localhost:5000/health
Analytics: http://localhost:5000/api/analytics/
MongoDB Compass: mongodb://localhost:27017/chainstaker

Stop Everything
bash# Stop backend
cd backend
docker-compose down

# Stop Anvil: Ctrl+C in Terminal 1

---

## 🎯 Résumé ordre de démarrage

1. **MongoDB local** → STOP (éviter conflit port 27017)
2. **Anvil** → START dans contracts/ (`anvil`)
3. **Docker Backend** → START dans backend/ (`docker-compose up -d`)
4. **Vérifier** → API + Compass