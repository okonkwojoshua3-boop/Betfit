# Social Bet App — System Architecture

## 1. Architecture Overview
The system will follow a modular service-based architecture (can start as a modular monolith and later split into microservices).

### High-Level Architecture Layers
1. Frontend (Web App)
2. API Layer (Backend)
3. Core Services Layer
4. Database Layer
5. External Services Layer
6. Storage Layer
7. Background Jobs / Workers

---

## 2. Frontend Architecture
**Tech Stack Suggested**
- Next.js (React)
- Tailwind CSS
- React Query
- Zustand or Redux (state management)
- Socket.io (real-time updates)

### Frontend Modules
- Auth Module
- Dashboard Module
- Matches Module
- Bets Module
- Punishments Module
- Friends Module
- Leaderboard Module
- Notifications Module
- Profile Module

### Frontend Structure Example
```
/src
  /components
  /pages
  /features
    /auth
    /bets
    /matches
    /friends
    /punishments
    /leaderboard
    /notifications
  /services (API calls)
  /store (state management)
  /utils
```

---

## 3. Backend Architecture
**Tech Stack Suggested**
- Node.js
- Express or NestJS
- PostgreSQL
- Redis
- AWS S3 (file uploads)
- Sports Data API

Backend will expose REST API (or GraphQL later).

### Backend Main Modules
- Authentication Service
- User Service
- Friend Service
- Match Service
- Bet Service
- Punishment Service
- Proof Service
- Leaderboard Service
- Notification Service
- Admin Service

---

## 4. Core System Services

### 4.1 Authentication Service
Handles:
- User registration
- Login
- JWT tokens
- Password reset
- Email verification

**Endpoints**
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password

---

### 4.2 User Service
Handles:
- User profile
- Stats
- Profile picture
- Points
- Win/Loss record

**Endpoints**
- GET /users/:id
- PUT /users/:id
- GET /users/:id/stats

---

### 4.3 Friend Service
Handles:
- Friend requests
- Accept/reject requests
- Friend list
- Remove friend

**Endpoints**
- POST /friends/request
- POST /friends/accept
- POST /friends/reject
- GET /friends/list
- DELETE /friends/remove

---

### 4.4 Match Service
Handles:
- Fetch matches from Sports API
- Store matches in database
- Update match results

**Background Job:**
- Fetch matches every few hours
- Update match results automatically

**Endpoints**
- GET /matches
- GET /matches/:id

---

### 4.5 Bet Service
This is the core service.

Handles:
- Create bet
- Accept bet
- Reject bet
- Cancel bet
- Determine bet winner
- Update bet status

**Bet Status Flow**
```
Pending → Accepted → Match Finished → Punishment Pending → Proof Uploaded → Completed
```

**Endpoints**
- POST /bets/create
- POST /bets/accept
- POST /bets/reject
- GET /bets/active
- GET /bets/history

---

### 4.6 Punishment Service
Handles:
- List punishments
- Create custom punishment
- Assign punishment to bet

**Endpoints**
- GET /punishments
- POST /punishments

---

### 4.7 Proof Service
Handles:
- Upload video/image proof
- Store proof in S3
- Proof approval/rejection

**Endpoints**
- POST /proof/upload
- POST /proof/approve
- POST /proof/reject

---

### 4.8 Leaderboard Service
Handles:
- Rankings
- Points
- Win streaks
- Punishment completion stats

**Endpoints**
- GET /leaderboard

---

### 4.9 Notification Service
Handles:
- Bet requests
- Bet accepted
- Match result
- Punishment reminder
- Proof approval

**Notification Types**
- In-app notifications
- Email notifications
- Push notifications (future)

---

## 5. Database Design (PostgreSQL)

### Tables

#### Users
- id
- username
- email
- password_hash
- profile_image
- points
- wins
- losses
- punishments_completed
- created_at

#### Friends
- id
- user_id
- friend_id
- status
- created_at

#### Matches
- id
- sport
- team_a
- team_b
- match_time
- status
- winner
- external_match_id

#### Bets
- id
- match_id
- creator_id
- opponent_id
- creator_pick
- opponent_pick
- punishment_id
- status
- winner_id
- loser_id
- created_at

#### Punishments
- id
- name
- description
- reps
- duration

#### Proofs
- id
- bet_id
- user_id
- file_url
- status
- created_at

#### Notifications
- id
- user_id
- type
- message
- read
- created_at

---

## 6. Storage Layer
Use **AWS S3** for:
- Proof videos
- Proof images
- Profile pictures

---

## 7. Background Jobs / Workers
Use a job queue system.

**Jobs Needed**
1. Fetch matches from sports API
2. Update match results
3. Determine bet winners
4. Send notifications
5. Punishment reminder after X days
6. Leaderboard recalculation

**Tools**
- BullMQ
- Redis
- Cron jobs

---

## 8. Real-Time System
Use WebSockets for:
- New bet request
- Bet accepted
- Match result
- Proof uploaded
- Notifications
- Leaderboard updates

**Tool**
- Socket.io

---

## 9. System Flow Example (End-to-End Bet Flow)

### Bet Creation Flow
1. User selects friend
2. User selects match
3. User selects team
4. User selects punishment
5. Bet stored in DB (status = Pending)
6. Notification sent to friend

### Bet Acceptance Flow
1. Friend accepts bet
2. Status → Accepted

### Match Result Flow
1. Background job checks match result
2. Winner team determined
3. Bet winner determined
4. Bet status → Punishment Pending
5. Loser notified

### Proof Flow
1. Loser uploads video
2. Winner approves/rejects
3. If approved → Bet Completed
4. Points updated
5. Leaderboard updated

---

## 10. Points & Ranking System Logic

### Points
- Win bet → +10
- Complete punishment → +5
- Win streak → +5 bonus
- Reject fake proof → +2

### Leaderboard Ranking Factors
- Total points
- Win rate
- Punishments completed
- Current streak

---

## 11. Security Considerations
- JWT Authentication
- Rate limiting
- File upload validation
- Video size limits
- Input validation
- SQL injection protection
- HTTPS

---

## 12. Future Architecture Expansion
Later you can split into microservices:
- Auth Service
- Bet Service
- Match Service
- Notification Service
- Leaderboard Service
- Media Service

And add:
- Mobile App
- AI punishment verification
- Social feed
- Group bets
- Tournament mode

---

## 13. Recommended MVP Stack Summary

**Frontend**
- Next.js
- Tailwind

**Backend**
- Node.js
- Express / NestJS

**Database**
- PostgreSQL

**Storage**
- AWS S3

**Cache / Jobs**
- Redis
- BullMQ

**Real-time**
- Socket.io

**Hosting**
- Vercel (Frontend)
- AWS / Railway / Render (Backend)

---

## 14. System Architecture Summary Diagram (Text)**

```
Frontend (Next.js)
        |
        |
Backend API (Node.js)
        |
---------------------------------
| Auth Service                  |
| User Service                  |
| Friend Service                |
| Match Service                 |
| Bet Service                   |
| Punishment Service            |
| Proof Service                 |
| Leaderboard Service           |
| Notification Service          |
---------------------------------
        |
Database (PostgreSQL)
        |
Storage (AWS S3)
        |
Redis (Cache + Jobs)
        |
Sports Data API
```

---

This architecture is scalable from MVP to large social app.

