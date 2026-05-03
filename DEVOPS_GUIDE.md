# DevOps Practice Guide: Docker, Kubernetes & GitHub Actions

This guide uses the **InterviewFlow** project (React/Vite frontend + Node.js backend) as a real-world example. Follow each phase in order — each builds on the previous.

---

## Phase 1: Docker — Containerize the App

### What Docker does
Docker packages your app and all its dependencies into a portable **image**. That image runs identically on your laptop, a CI server, or a cloud VM.

**Key concepts:**
- `Dockerfile` — recipe to build an image
- `image` — the built snapshot (like a class)
- `container` — a running instance of an image (like an object)
- `docker-compose.yml` — runs multiple containers together locally

---

### 1.1 Dockerfile for the Backend (Node.js)

Create `interviewflow-backend/Dockerfile`:

```dockerfile
# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: final image
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
```

**Why multi-stage?** The `deps` stage installs packages; the final stage copies only what's needed — keeping the image small and secure.

---

### 1.2 Dockerfile for the Frontend (React/Vite)

Create `interviewflow-frontend/Dockerfile`:

```dockerfile
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `interviewflow-frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # React Router — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_set_header Host $host;
    }
}
```

---

### 1.3 Add .dockerignore files

`interviewflow-backend/.dockerignore`:
```
node_modules
.env
*.log
```

`interviewflow-frontend/.dockerignore`:
```
node_modules
dist
.env
*.log
```

---

### 1.4 docker-compose for local development

Create `docker-compose.yml` at the project root:

```yaml
version: "3.9"

services:
  backend:
    build: ./interviewflow-backend
    ports:
      - "5001:5000"
    env_file:
      - ./interviewflow-backend/.env
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build: ./interviewflow-frontend
    ports:
      - "3000:80"
    depends_on:
      backend:
        condition: service_healthy
```

**Run it:**
```bash
docker compose up --build      # first time
docker compose up              # subsequent runs
docker compose down            # stop and remove containers
docker compose logs -f backend # stream backend logs
```

**Practice commands:**
```bash
docker images                        # list images
docker ps                            # list running containers
docker exec -it <container_id> sh    # shell into a container
docker stats                         # real-time resource usage
docker system prune -f               # clean up unused images/containers
```

---

## Phase 2: GitHub Actions — CI/CD Pipeline

### What GitHub Actions does
GitHub Actions runs automated workflows triggered by git events (push, PR, etc.). You define workflows in YAML files under `.github/workflows/`.

**Key concepts:**
- `workflow` — the YAML file; one or more jobs
- `job` — runs on a machine (runner); has sequential steps
- `step` — a single command or reusable action
- `action` — a pre-built step from the marketplace (e.g. `actions/checkout`)
- `secret` — encrypted env vars stored in GitHub repo settings

---

### 2.1 Create the CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ── Backend ──────────────────────────────────────────────
  backend-ci:
    name: Backend — Lint & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: interviewflow-backend/package-lock.json

      - name: Install dependencies
        working-directory: interviewflow-backend
        run: npm ci

      - name: Run tests
        working-directory: interviewflow-backend
        run: npm test

  # ── Frontend ─────────────────────────────────────────────
  frontend-ci:
    name: Frontend — Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: interviewflow-frontend/package-lock.json

      - name: Install dependencies
        working-directory: interviewflow-frontend
        run: npm ci

      - name: Build
        working-directory: interviewflow-frontend
        run: npm run build
```

---

### 2.2 Create the CD workflow — build and push Docker images

Create `.github/workflows/cd.yml`:

```yaml
name: CD — Build & Push Images

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}/interviewflow

jobs:
  build-and-push:
    name: Build & Push
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write   # needed to push to ghcr.io

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # auto-provided, no setup needed

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3       # enables caching + multi-platform

      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: ./interviewflow-backend
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-backend:${{ github.sha }},${{ env.IMAGE_PREFIX }}-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./interviewflow-frontend
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-frontend:${{ github.sha }},${{ env.IMAGE_PREFIX }}-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**What `${{ github.sha }}` does:** tags the image with the exact commit hash, so every deploy is traceable to its source commit.

---

### 2.3 Add required secrets in GitHub

Go to **Settings → Secrets and variables → Actions** and add:
- `BACKEND_ENV` — contents of your `.env` file (for a real deploy job)

`GITHUB_TOKEN` is provided automatically — no setup needed.

---

## Phase 3: Kubernetes — Orchestrate Containers

### What Kubernetes (k8s) does
Kubernetes runs containers at scale: auto-restarts crashed containers, scales replicas up/down, routes traffic, and manages rolling updates.

**Key concepts:**
| Object | Purpose |
|---|---|
| `Pod` | smallest unit; one or more containers |
| `Deployment` | manages a set of identical Pods; handles rolling updates |
| `Service` | stable network endpoint for a set of Pods |
| `ConfigMap` | non-secret config as key-value pairs |
| `Secret` | base64-encoded sensitive values |
| `Ingress` | HTTP routing from outside the cluster into Services |
| `Namespace` | logical isolation (like a folder for k8s objects) |

---

### 3.1 Local cluster setup with kind

```bash
# Install kind (Kubernetes in Docker)
brew install kind

# Create a local cluster
kind create cluster --name interviewflow

# Verify
kubectl cluster-info --context kind-interviewflow
kubectl get nodes
```

---

### 3.2 Namespace

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: interviewflow
```

```bash
kubectl apply -f k8s/namespace.yaml
```

---

### 3.3 Backend Deployment & Service

Create `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: interviewflow
spec:
  replicas: 2                         # run 2 copies for redundancy
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: ghcr.io/YOUR_USERNAME/interviewflow-backend:latest
          ports:
            - containerPort: 5000
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "5000"
          envFrom:
            - secretRef:
                name: backend-secrets   # see 3.5 below
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:               # k8s won't route traffic until this passes
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:                # k8s restarts the container if this fails
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: interviewflow
spec:
  selector:
    app: backend
  ports:
    - port: 5000
      targetPort: 5000
  type: ClusterIP                       # internal only; Ingress exposes it externally
```

---

### 3.4 Frontend Deployment & Service

Create `k8s/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: interviewflow
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: ghcr.io/YOUR_USERNAME/interviewflow-frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "200m"
              memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: interviewflow
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

---

### 3.5 Secrets

Never commit secrets to git. Create them directly via kubectl:

```bash
kubectl create secret generic backend-secrets \
  --namespace interviewflow \
  --from-env-file=./interviewflow-backend/.env
```

Or declaratively (values must be base64-encoded):

```bash
echo -n "your_value" | base64
```

```yaml
# k8s/backend-secrets.yaml  — DO NOT commit this file
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: interviewflow
type: Opaque
data:
  MONGO_URI: <base64_encoded_value>
  JWT_SECRET: <base64_encoded_value>
```

Add `k8s/backend-secrets.yaml` to `.gitignore`.

---

### 3.6 Ingress (HTTP routing)

Install the nginx ingress controller first:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: interviewflow-ingress
  namespace: interviewflow
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
    - host: interviewflow.local        # add to /etc/hosts for local testing
      http:
        paths:
          - path: /api(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend
                port:
                  number: 5000
          - path: /()(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

Add to `/etc/hosts` for local testing:
```
127.0.0.1   interviewflow.local
```

---

### 3.7 Apply everything

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

**Essential kubectl commands:**
```bash
kubectl get all -n interviewflow                    # see everything
kubectl get pods -n interviewflow -w               # watch pods start
kubectl logs -f deployment/backend -n interviewflow # stream logs
kubectl describe pod <pod-name> -n interviewflow    # debug a pod
kubectl rollout status deployment/backend -n interviewflow
kubectl rollout undo deployment/backend -n interviewflow  # rollback
kubectl scale deployment backend --replicas=3 -n interviewflow
kubectl exec -it <pod-name> -n interviewflow -- sh  # shell into pod
```

---

## Phase 4: Full CI/CD to Kubernetes

Add a deploy job to `.github/workflows/cd.yml` that updates the k8s Deployment after the images are pushed:

```yaml
  deploy:
    name: Deploy to Kubernetes
    runs-on: ubuntu-latest
    needs: build-and-push          # waits for images to be pushed
    environment: production        # requires manual approval in GitHub

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config

      - name: Update backend image
        run: |
          kubectl set image deployment/backend \
            backend=ghcr.io/${{ github.repository_owner }}/interviewflow-backend:${{ github.sha }} \
            -n interviewflow

      - name: Update frontend image
        run: |
          kubectl set image deployment/frontend \
            frontend=ghcr.io/${{ github.repository_owner }}/interviewflow-frontend:${{ github.sha }} \
            -n interviewflow

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/backend -n interviewflow --timeout=120s
          kubectl rollout status deployment/frontend -n interviewflow --timeout=120s
```

**Add to GitHub Secrets:**
- `KUBECONFIG` — base64-encoded kubeconfig: `cat ~/.kube/config | base64`

---

## Practice Exercises (in order)

1. **Docker basics** — Build the backend image manually: `docker build -t interviewflow-backend ./interviewflow-backend` then run it with `docker run -p 5000:5000 interviewflow-backend`. Hit the API.

2. **docker-compose** — Run `docker compose up --build` and verify the full stack works at `http://localhost:3000`.

3. **Break and fix** — Stop the backend container. Watch the frontend fail. Restart it. Understand `depends_on`.

4. **GitHub Actions CI** — Push a branch. Watch the CI workflow run in the Actions tab. Break the build intentionally (syntax error) and see it fail.

5. **Image push** — Merge to main. Watch the CD workflow build and push images to `ghcr.io`.

6. **Kubernetes basics** — `kind create cluster`, apply the manifests, run `kubectl get all -n interviewflow`. Exec into a pod.

7. **Rolling update** — Change `replicas: 2` to `replicas: 3`. Apply. Watch `kubectl get pods -w`.

8. **Simulate a crash** — Delete a pod manually: `kubectl delete pod <name> -n interviewflow`. Watch k8s immediately recreate it.

9. **Full pipeline** — Make a code change, push to main, watch CI → image build → k8s deploy happen automatically.

---

## Mental Model

```
Developer pushes code
        │
        ▼
GitHub Actions: CI
  ├── lint / test
  └── build check
        │
        ▼
GitHub Actions: CD
  ├── docker build (frontend + backend)
  ├── docker push → ghcr.io
  └── kubectl set image → Kubernetes
                │
                ▼
        Kubernetes Cluster
          ├── Rolling update (zero downtime)
          ├── Health checks (readiness/liveness probes)
          ├── Auto-restart on crash
          └── Scale replicas on demand
```

---

## File Structure After This Guide

```
InterVirewFlow/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── k8s/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── interviewflow-backend/
│   ├── Dockerfile
│   └── .dockerignore
├── interviewflow-frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
└── docker-compose.yml
```
