# Mates

A full-stack real-time chat application built as a learning project and gradually evolved into a production-oriented backend and DevOps platform.

The project started with Django REST Framework and a React frontend, then expanded into a multi-service architecture with containerization, reverse proxying, asynchronous processing, CI/CD, observability, PostgreSQL high availability, and backup/recovery mechanisms.

The main goal of the project is not only to implement a chat application, but to demonstrate how an application can be structured, deployed, monitored, and operated as a complete system.

---

## Overview

Mates is organized as a monorepo containing the application services and infrastructure configuration required to run the platform.

The application is composed of:

- React frontend
- Nginx frontend web server
- Users backend service
- Chat backend service
- Redis
- Celery workers
- PostgreSQL high-availability cluster
- HAProxy
- Patroni
- etcd
- Traefik
- Prometheus
- Loki
- Grafana
- Multiple exporters and application instrumentation

The system is containerized using Docker and Docker Compose.

---

# Architecture

The platform is divided into several layers:

```text
                         External Traffic
                                |
                                v
                           +---------+
                           | Traefik |
                           +----+----+
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
         +---------+      +-----------+     +-----------+
         |  Nginx  |      |   Users   |     |   Chat    |
         | Frontend|      |  Service  |     |  Service  |
         +----+----+      +-----+-----+     +-----+-----+
              |                  |                 |
              v                  +--------+--------+
           React App                      |
                                          v
                                      +-------+
                                      | Redis |
                                      +---+---+
                                          |
                                  +-------+-------+
                                  |               |
                                  v               v
                           +-----------+   +-----------+
                           |  Celery   |   |  Celery   |
                           |  Worker   |   |  Worker   |
                           +-----------+   +-----------+

                    Database Access
                           |
              +------------+------------+
              |                         |
              v                         v
        +-----------+             +-----------+
        |   Users   |             |   Chat    |
        |  Service  |             |  Service  |
        +-----+-----+             +-----+-----+
              |                         |
              +------------+------------+
                           |
                           v
                       +---------+
                       | HAProxy |
                       +----+----+
                           |
                           v
                  PostgreSQL HA Cluster
                           |
                +----------+----------+
                |                     |
                v                     v
             Patroni                 etcd
                |
                v
        PostgreSQL Nodes
```

The request path and the observability path are intentionally separated.

Application traffic is handled by Traefik and the application services, while metrics and logs are collected independently by Prometheus and Loki.

---

# Application Architecture

## Frontend

The frontend is implemented using React and Vite.

The production frontend is built into static assets and served by Nginx.

Nginx is responsible only for serving the frontend application. Backend API and WebSocket traffic are routed by Traefik directly to the appropriate backend service.

```text
React Source
     |
     v
   Vite
     |
     v
Production Build
     |
     v
   Nginx
```

---

## Users Service

The Users Service is a Django-based backend service responsible for user-related functionality.

Responsibilities include:

- User registration
- Authentication
- JWT handling
- User information
- User profiles

The service exposes REST APIs consumed by the frontend.

---

## Chat Service

The Chat Service handles the core chat functionality.

Responsibilities include:

- Chat rooms
- Public and private rooms
- Join and leave operations
- Messages
- Message history
- Join requests
- Real-time communication

Django Channels and WebSockets are used for real-time communication.

The WebSocket connection follows the structure:

```text
ws://host/ws/chat/<room_id>/
```

---

# Service Communication

The backend is split into independent services rather than keeping all functionality inside a single Django application.

```text
                    +----------------+
                    |    Frontend    |
                    +-------+--------+
                            |
                         Traefik
                            |
              +-------------+-------------+
              |                           |
              v                           v
       +-------------+              +-------------+
       |    Users    |              |    Chat     |
       |   Service   |              |   Service   |
       +------+------+              +------+------+
              |                            |
              +-------------+--------------+
                            |
                          Redis
                            |
                    +-------+-------+
                    |               |
                    v               v
                 Celery          Celery
                 Worker          Worker
```

Redis is used as the message broker for Celery and as an infrastructure component supporting communication between the application services and asynchronous workers.

Celery workers process background tasks outside the main request-response path.

---

# Traffic Routing

Traefik is the main entry point for external application traffic.

```text
Internet
   |
   v
Traefik
   |
   +----> Nginx ------> React Frontend
   |
   +----> Users Service
   |
   +----> Chat Service
```

Traefik is responsible for routing requests to the correct service.

Nginx is not used as the backend reverse proxy. Its role is limited to serving the built React application.

WebSocket traffic is routed to the Chat Service through Traefik.

---

# Database Architecture

The application uses PostgreSQL as its persistent database.

Instead of connecting the backend services directly to individual PostgreSQL nodes, database traffic passes through HAProxy.

```text
Users Service ----\
                   \
                    > HAProxy ---> PostgreSQL HA Cluster
                   /
Chat Service -----/
```

This provides a stable database endpoint for the application while allowing the underlying PostgreSQL topology to change during failover.

---

# PostgreSQL High Availability

The PostgreSQL layer is managed as a high-availability cluster using Patroni.

The main components are:

- PostgreSQL nodes
- Patroni
- etcd
- HAProxy

### Patroni

Patroni manages PostgreSQL high availability and coordinates primary/replica roles.

It is responsible for handling PostgreSQL cluster state and initiating failover when the current primary becomes unavailable.

### etcd

etcd provides the distributed coordination and state storage required by Patroni.

It allows the Patroni instances to coordinate cluster state and leader information.

### HAProxy

HAProxy provides the stable connection endpoint used by the application.

Instead of targeting a specific PostgreSQL node, the backend services connect to HAProxy, which routes connections according to the current PostgreSQL cluster state.

### PostgreSQL Replication

The PostgreSQL nodes maintain replicated database state so that a healthy replica can be promoted when the primary fails.

Conceptually:

```text
                    +---------+
                    | HAProxy |
                    +----+----+
                         |
                +--------+--------+
                |                 |
                v                 v
          PostgreSQL          PostgreSQL
            Primary             Replica
                |                 |
                +--------+--------+
                         |
                      Patroni
                         |
                       etcd
```

The purpose of this architecture is to reduce downtime caused by PostgreSQL node failures.

---

# Backup and Recovery

High availability and backup solve different problems.

PostgreSQL HA is designed primarily for availability and failover.

Backups provide a separate recovery mechanism for situations such as:

- Data corruption
- Accidental deletion
- Incorrect changes
- Recovery after data loss

The project therefore treats backups as a separate layer from PostgreSQL failover.

```text
PostgreSQL
     |
     v
  Backup
     |
     v
Backup Storage
     |
     v
Restore / Recovery
```

A database replica should not be considered a replacement for a backup.

---

# Observability

The observability stack consists of separate metric and logging pipelines.

```text
                    Application / Infrastructure
                              |
                 +------------+------------+
                 |                         |
                 v                         v
             Metrics                     Logs
                 |                         |
                 v                         v
            Prometheus                    Loki
                 |                         |
                 +------------+------------+
                              |
                              v
                           Grafana
```

Grafana is used as the visualization layer for both metrics and logs.

No application screenshots or dashboard screenshots are required for the architecture documentation. The monitoring stack is documented through its data flow and responsibilities.

---

## Metrics

Prometheus collects metrics from infrastructure components and application services.

### Node Exporter

Node Exporter exposes host-level metrics such as:

- CPU
- Memory
- Disk
- Network

### cAdvisor

cAdvisor provides container-level metrics including:

- CPU usage
- Memory usage
- Network usage
- Filesystem usage

### Nginx Prometheus Exporter

The Nginx exporter exposes Nginx metrics such as:

- Active connections
- Reading connections
- Writing connections
- Waiting connections
- Accepted connections

### Django Prometheus

The Django services expose application-level metrics through django-prometheus.

These metrics include information related to:

- HTTP requests
- Response status codes
- Request latency
- Database operations


---

# Logging

Loki is used for centralized log aggregation.

The logging path is:

```text
Application / Infrastructure
            |
            v
           Loki
            |
            v
         Grafana
```

Loki provides centralized access to logs while Prometheus handles metric collection.

This keeps metric collection and log aggregation as separate observability pipelines while allowing both to be explored through Grafana.

---

# CI/CD

The repository uses GitHub Actions for automated testing and Docker image publishing.

The current setup contains five workflows:

| Workflow | Purpose |
|----------|---------|
| `users-ci` | Install dependencies and run Users Service tests |
| `users-cd` | Build and publish the Users Service Docker image |
| `chat-ci` | Install dependencies and run Chat Service tests |
| `chat-cd` | Build and publish the Chat Service Docker image |
| `front-cd` | Build and publish the frontend Docker image |

The general pipeline is:

```text
Git Push
   |
   v
GitHub Actions
   |
   v
Tests
   |
   v
Docker Build
   |
   v
Docker Image
   |
   v
Docker Hub
```

CI workflows validate the application before the corresponding image publishing stages.

The deployment workflows are structured so that the resulting images can be consumed by the deployment environment.

---

# Containerization

The complete application stack is containerized using Docker.

Docker Compose is used to define and run the services together during development and deployment.

The containerized environment includes the application services, infrastructure components, database components, and observability services.

The architecture is therefore reproducible without requiring every component to be installed directly on the host system.

---

# Repository Structure

The repository follows a monorepo structure:

```text
mates/
├── assets
├── backend
├── docker
├── docker-compose.yml
├── frontend
├── k8s
├── monitoring
└── traefik

```

The monorepo keeps application code, infrastructure configuration, monitoring configuration, and CI/CD workflows in a single repository.

This makes the complete platform configuration version-controlled and easier to reproduce.

---

# API Overview

## Users

| Endpoint | Description |
|----------|-------------|
| `POST /auth/registration` | Register a new user |
| `POST /auth/login` | Authenticate a user |
| `GET /auth/user` | Get the current user |
| `GET /profile/{id}` | Get a user profile |
| ...... | ...... |

## Rooms

| Endpoint | Description |
|----------|-------------|
| `GET /api/rooms` | List rooms |
| `POST /api/rooms/create` | Create a room |
| `POST /api/rooms/join` | Join a room |
| `POST /api/rooms/leave` | Leave a room |
| ...... | ...... |

## WebSocket

```text
ws://host/ws/chat/<room_id>/
```

---

# Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, Vite |
| Frontend Web Server | Nginx |
| Backend | Django, Django REST Framework |
| Real-time Communication | Django Channels, WebSockets |
| Background Processing | Celery |
| Message Broker | Redis |
| Database | PostgreSQL |
| Database HA | Patroni, etcd, HAProxy |
| Traffic Routing | Traefik |
| Containerization | Docker, Docker Compose |
| Metrics | Prometheus |
| Logging | Loki |
| Visualization | Grafana |
| Infrastructure Metrics | Node Exporter, cAdvisor |
| Nginx Metrics | Nginx Prometheus Exporter |
| Application Metrics | django-prometheus |
| CI/CD | GitHub Actions |
| Container Registry | Docker Hub |

---

# Project Evolution

## Phase 1: Application

- JWT authentication
- User registration and profiles
- Public and private rooms
- Join and leave room logic
- REST APIs
- Message history
- Django Channels
- WebSocket communication
- React frontend

## Phase 2: Infrastructure

- Monorepo
- Docker
- Docker Compose
- Service separation
- Traefik
- Nginx
- Redis
- Celery
- GitHub Actions
- Docker Hub

## Phase 3: Observability

- Prometheus
- Grafana
- Loki
- Node Exporter
- cAdvisor
- Nginx Prometheus Exporter
- django-prometheus
- Centralized logging

## Phase 4: Reliability

- PostgreSQL High Availability
- Patroni
- etcd
- HAProxy
- PostgreSQL replication
- Automatic failover
- Database backups
- Recovery workflow

## Future Work

- Kubernetes
- AWS deployment
- GitOps
- Terraform
