# API_CONTRACT

Date: March 2, 2026

## Health
### `GET /api/health`
Response:
```json
{
  "status": "OK",
  "timeUTC": "2026-03-02T00:00:00.000Z",
  "version": "1.0.0",
  "db": "connected"
}
```

## Auth
### `POST /api/auth/login`
Request:
```json
{ "identifier": "student@example.com", "password": "***" }
```
Response:
```json
{ "user": { "_id": "...", "role": "student" }, "token": "..." }
```

### `GET /api/auth/me`
Response:
```json
{ "_id": "...", "role": "student", "email": "..." }
```

## Exam Runtime (Student)
### `POST /api/exams/:examId/start`
Response (shape):
```json
{
  "session": { "sessionId": "...", "attemptRevision": 0, "expiresAt": "..." },
  "exam": { "_id": "...", "title": "..." },
  "questions": []
}
```

### `POST /api/exams/:examId/attempt/:attemptId/answer`
Request:
```json
{
  "attemptRevision": 2,
  "answers": [{ "questionId": "...", "selectedAnswer": "A" }]
}
```
Response:
```json
{ "saved": true, "savedAt": "...", "attemptRevision": 3 }
```

### `POST /api/exams/:examId/attempt/:attemptId/submit`
Request:
```json
{
  "attemptRevision": 3,
  "submissionType": "manual",
  "answers": [{ "questionId": "...", "selectedAnswer": "A" }]
}
```
Response:
```json
{
  "submitted": true,
  "message": "Exam submitted successfully.",
  "resultId": "...",
  "resultPublished": false,
  "attemptRevision": 4
}
```

### `POST /api/exams/:examId/attempt/:attemptId/event`
Response (active attempt):
```json
{ "logged": true, "action": "logged", "attemptRevision": 4 }
```
Response (already submitted/inactive attempt):
```json
{ "logged": false, "ignored": true, "reason": "attempt_not_active", "attemptRevision": 4 }
```

### `GET /api/exams/:examId/result`
Response (pending):
```json
{
  "resultPublished": false,
  "publishDate": "...",
  "message": "Result is not published yet. Please wait until publish time."
}
```
Response (published):
```json
{
  "resultPublished": true,
  "exam": { "_id": "...", "title": "..." },
  "result": {
    "obtainedMarks": 34,
    "totalMarks": 50,
    "percentage": 68,
    "correctCount": 17,
    "wrongCount": 6,
    "unansweredCount": 2
  }
}
```

## News (Public)
### `GET /api/news-v2/list?page=1&limit=12&category=All&search=`
### `GET /api/news-v2/config/appearance`
### `GET /api/news-v2/widgets`
### `GET /api/news-v2/:slug`
### `POST /api/news-v2/share/track`

## Admin API Prefixes
Both prefixes are supported:
- `/api/admin/*`
- `/api/campusway-secure-admin/*`

### Admin News V2
- `GET /news-v2/dashboard`
- `POST /news-v2/fetch-now`
- `GET/POST/PUT /news-v2/items`
- `POST /news-v2/items/:id/approve`
- `POST /news-v2/items/:id/reject`
- `POST /news-v2/items/:id/publish-now`
- `POST /news-v2/items/:id/schedule`
- `GET/POST/PUT/DELETE /news-v2/sources`
- `GET/PUT /news-v2/settings/appearance`
- `GET/PUT /news-v2/settings/ai`
- `GET/PUT /news-v2/settings/share`
- `GET/POST/DELETE /news-v2/media`
- `GET /news-v2/exports/news|sources|logs`
- `GET /news-v2/audit-logs`

### Admin Exam/Live
- `GET /exams?view=cards&includeMetrics=true`
- `POST /exams`
- `PUT /exams/:id`
- `POST /exams/:id/publish`
- `POST /exams/:id/share-link/regenerate`
- `GET /live/stream` (SSE)