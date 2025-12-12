import json
import os
import re
import sqlite3
import threading
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from fastapi import Request

try:
    from .ingest import STOP_WORDS
except ImportError:  # pragma: no cover - fallback if ingest import changes
    STOP_WORDS = set()

_DB_PATH = Path(os.getenv("ANALYTICS_DB_PATH", Path(__file__).resolve().parent.parent / "analytics.db"))
_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

_LOCK = threading.Lock()


def _now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat()


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def _serialize(metadata: Optional[Any]) -> Optional[str]:
    if metadata is None:
        return None
    try:
        return json.dumps(metadata, ensure_ascii=False)
    except TypeError:
        return json.dumps(str(metadata))


def _ensure_schema() -> None:
    # Base tables with university/roll_no support from the start
    tables = [
        """
        CREATE TABLE IF NOT EXISTS ingestion_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            course TEXT,
            file_name TEXT,
            file_type TEXT,
            file_size INTEGER,
            chunk_count INTEGER,
            token_count INTEGER,
            duration_ms INTEGER,
            status TEXT,
            error TEXT,
            metadata TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS chunk_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ingestion_id INTEGER,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            source_name TEXT,
            topic TEXT,
            chunk_index INTEGER,
            token_count INTEGER,
            keywords TEXT,
            FOREIGN KEY (ingestion_id) REFERENCES ingestion_events(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS retrieval_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            endpoint TEXT,
            question TEXT,
            topic TEXT,
            top_k INTEGER,
            retrieved_sources TEXT,
            scores TEXT,
            latency_ms INTEGER,
            context_count INTEGER,
            answer_tokens INTEGER,
            metadata TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS user_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            event_type TEXT,
            metadata TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS summary_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            topic TEXT,
            chunk_count INTEGER,
            latency_ms INTEGER,
            mode TEXT,
            metadata TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            question_id TEXT,
            topic TEXT,
            difficulty TEXT,
            was_correct INTEGER,
            selected_option TEXT,
            correct_option TEXT,
            latency_ms INTEGER,
            source_label TEXT,
            metadata TEXT
        );
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempt_unique
            ON quiz_attempts(session_id, question_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_chunk_topics_source
            ON chunk_topics(source_name);
        """,
        """
        CREATE TABLE IF NOT EXISTS feedback_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            university TEXT,
            roll_no TEXT,
            session_id TEXT,
            object_type TEXT,
            object_id TEXT,
            feedback TEXT,
            comment TEXT,
            metadata TEXT
        );
        """
    ]

    with _LOCK:
        conn = _get_conn()
        try:
            for sql in tables:
                conn.execute(sql)
            
            # Migration: Ensure columns exist for existing databases
            existing_tables = ["ingestion_events", "chunk_topics", "retrieval_events", "user_events", "summary_events", "quiz_attempts", "feedback_events"]
            for tbl in existing_tables:
                for col in ["university", "roll_no"]:
                    try:
                        conn.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} TEXT")
                    except sqlite3.OperationalError:
                        pass # Column likely exists
            
            conn.commit()
        finally:
            conn.close()


_ensure_schema()


__all__ = [
    "resolve_session_id",
    "log_user_event",
    "log_ingestion_event",
    "derive_chunk_topics",
    "record_chunk_topics",
    "log_retrieval_event",
    "log_summary_event",
    "log_quiz_question_event",
    "log_quiz_attempt",
    "log_quiz_history",
    "log_feedback_event",
    "render_quiz_performance_html",
    "get_quiz_analytics_options",
]


def resolve_session_id(request: Request) -> str:
    header_candidates = [
        "x-session-id",
        "x-client-id",
        "x-user-id",
    ]
    for header in header_candidates:
        value = request.headers.get(header)
        if value:
            return value
    if request.cookies.get("session_id"):
        return request.cookies["session_id"]
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


def log_user_event(
    event_type: str, 
    session_id: str, 
    metadata: Optional[Dict[str, Any]] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    payload = (
        _now(),
        university,
        roll_no,
        session_id,
        event_type,
        _serialize(metadata),
    )
    with _LOCK:
        conn = _get_conn()
        try:
            conn.execute(
                "INSERT INTO user_events (timestamp, university, roll_no, session_id, event_type, metadata) VALUES (?, ?, ?, ?, ?, ?)",
                payload,
            )
            conn.commit()
        finally:
            conn.close()


def log_ingestion_event(
    session_id: str,
    file_name: str,
    file_type: Optional[str],
    file_size: int,
    chunk_count: int,
    token_count: int,
    duration_ms: int,
    status: str,
    course: Optional[str] = None,
    error: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> int:
    payload = (
        _now(),
        university,
        roll_no,
        session_id,
        course,
        file_name,
        file_type,
        file_size,
        chunk_count,
        token_count,
        duration_ms,
        status,
        error,
        _serialize(metadata),
    )
    with _LOCK:
        conn = _get_conn()
        try:
            cursor = conn.execute(
                """
                INSERT INTO ingestion_events (
                    timestamp, university, roll_no, session_id, course, file_name, file_type, file_size,
                    chunk_count, token_count, duration_ms, status, error, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            conn.commit()
            return int(cursor.lastrowid)
        finally:
            conn.close()


def derive_chunk_topics(chunks: Sequence[str], top_terms: int = 2) -> List[Dict[str, Any]]:
    topics: List[Dict[str, Any]] = []
    stop_words = set(STOP_WORDS)
    for index, chunk in enumerate(chunks):
        tokens = re.findall(r"[A-Za-z][\w-]+", (chunk or "").lower())
        filtered = [token for token in tokens if len(token) >= 4 and token not in stop_words]
        token_count = len(filtered)
        topic_terms: List[str] = []
        topic_label: Optional[str] = None
        if filtered:
            counts = Counter(filtered)
            topic_terms = [term for term, _ in counts.most_common(max(3, top_terms))]
            topic_label = " ".join(term.title() for term in topic_terms[:top_terms]) if topic_terms else None
        topics.append(
            {
                "chunk_index": index,
                "topic": topic_label,
                "terms": topic_terms,
                "token_count": token_count,
            }
        )
    return topics


def record_chunk_topics(
    ingestion_id: int,
    session_id: str,
    source_name: str,
    topics: Iterable[Dict[str, Any]],
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    rows = []
    timestamp = _now()
    for entry in topics:
        rows.append(
            (
                ingestion_id,
                timestamp,
                university,
                roll_no,
                session_id,
                source_name,
                entry.get("topic"),
                int(entry.get("chunk_index", 0)),
                int(entry.get("token_count", 0)),
                _serialize(entry.get("terms")),
            )
        )
    if not rows:
        return
    with _LOCK:
        conn = _get_conn()
        try:
            conn.executemany(
                """
                INSERT INTO chunk_topics (
                    ingestion_id, timestamp, university, roll_no, session_id, source_name, topic,
                    chunk_index, token_count, keywords
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
            )
            conn.commit()
        finally:
            conn.close()


def log_retrieval_event(
    session_id: str,
    endpoint: str,
    question: str,
    hits: Sequence[Dict[str, Any]],
    latency_ms: int,
    top_k: int,
    topic: Optional[str] = None,
    answer_tokens: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    sources = [
        (hit.get("meta", {}) or {}).get("source")
        for hit in hits
        if isinstance(hit, dict)
    ]
    filtered_sources = [source for source in sources if source]
    scores = [
        hit.get("score")
        for hit in hits
        if isinstance(hit, dict) and hit.get("score") is not None
    ]
    payload = (
        _now(),
        university,
        roll_no,
        session_id,
        endpoint,
        question,
        topic,
        int(top_k),
        _serialize(filtered_sources),
        _serialize(scores),
        int(latency_ms),
        len(hits),
        None if answer_tokens is None else int(answer_tokens),
        _serialize(metadata),
    )
    with _LOCK:
        conn = _get_conn()
        try:
            conn.execute(
                """
                INSERT INTO retrieval_events (
                    timestamp, university, roll_no, session_id, endpoint, question, topic, top_k,
                    retrieved_sources, scores, latency_ms, context_count, answer_tokens, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            conn.commit()
        finally:
            conn.close()


def log_summary_event(
    session_id: str,
    topic: Optional[str],
    chunk_count: int,
    latency_ms: int,
    mode: str = "summary",
    metadata: Optional[Dict[str, Any]] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    payload = (
        _now(),
        university,
        roll_no,
        session_id,
        topic,
        int(chunk_count),
        int(latency_ms),
        mode,
        _serialize(metadata),
    )
    with _LOCK:
        conn = _get_conn()
        try:
            conn.execute(
                """
                INSERT INTO summary_events (
                    timestamp, university, roll_no, session_id, topic, chunk_count, latency_ms, mode, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            conn.commit()
        finally:
            conn.close()


def log_quiz_question_event(
    session_id: str,
    question_payload: Dict[str, Any],
    total_questions: int,
    remaining_questions: int,
    source_label: Optional[str] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    metadata = {
        "questionId": question_payload.get("question_id"),
        "difficulty": question_payload.get("difficulty"),
        "conceptLabel": question_payload.get("conceptLabel"),
        "questionType": question_payload.get("questionType"),
        "focusConcept": question_payload.get("focusConcept"),
        "focusKeywords": question_payload.get("focusKeywords"),
        "totalQuestions": total_questions,
        "remainingQuestions": remaining_questions,
        "sourceLabel": source_label,
    }
    log_user_event("quiz_question_generated", session_id, metadata, university=university, roll_no=roll_no)


def log_quiz_attempt(
    session_id: str,
    attempt: Dict[str, Any],
    source_label: Optional[str] = None,
    latency_ms: Optional[int] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    question_id = attempt.get("question_id") or attempt.get("questionId")
    if not question_id:
        return
    payload = (
        _now(),
        university,
        roll_no,
        session_id,
        question_id,
        attempt.get("concept_label") or attempt.get("conceptLabel"),
        attempt.get("difficulty"),
        1 if attempt.get("was_correct") or attempt.get("wasCorrect") else 0,
        attempt.get("selected_option_id") or attempt.get("selectedOptionId"),
        attempt.get("correct_option_id") or attempt.get("correctOptionId"),
        None if latency_ms is None else int(latency_ms),
        source_label,
        _serialize({
            "explanation": attempt.get("explanation"),
        }),
    )
    with _LOCK:
        conn = _get_conn()
        try:
            conn.execute(
                """
                INSERT OR IGNORE INTO quiz_attempts (
                    timestamp, university, roll_no, session_id, question_id, topic, difficulty, was_correct,
                    selected_option, correct_option, latency_ms, source_label, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            conn.commit()
        finally:
            conn.close()


def log_quiz_history(
    session_id: str,
    history: Sequence[Dict[str, Any]],
    source_label: Optional[str] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    if not history:
        return
    for attempt in history:
        log_quiz_attempt(session_id, attempt, source_label=source_label, university=university, roll_no=roll_no)


def _simplify_source_label(source_label: Optional[str]) -> Optional[str]:
    if not source_label:
        return None
    simplified = source_label.strip()
    if not simplified:
        return None
    segments = [segment.strip() for segment in simplified.split(",") if segment.strip()]
    return segments[0] if segments else simplified


def _prepare_quiz_records(rows: Sequence[sqlite3.Row]) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    for row in rows:
        raw_ts = row["timestamp"]
        try:
            stamp = datetime.fromisoformat(raw_ts)
        except (ValueError, TypeError):
            stamp = datetime.fromtimestamp(0)
        topic_label = (row["topic"] or "General").strip() or "General"
        difficulty_label = (row["difficulty"] or "Unknown").strip().title() or "Unknown"
        was_correct = row["was_correct"]
        try:
            was_correct_bool = bool(int(was_correct))
        except (ValueError, TypeError):
            was_correct_bool = bool(was_correct)
        keys = row.keys()
        primary_source = _simplify_source_label(row["source_label"] if "source_label" in keys else None)
        records.append(
            {
                "timestamp": stamp,
                "topic": topic_label,
                "difficulty": difficulty_label,
                "was_correct": was_correct_bool,
                "source_label": primary_source,
            }
        )
    return records


def _summarize_quiz_records(records: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    total_attempts = len(records)
    correct_count = sum(1 for rec in records if rec["was_correct"])
    incorrect_count = total_attempts - correct_count
    overall_accuracy = round((correct_count / total_attempts) * 100, 1) if total_attempts else 0.0

    recent_window = min(5, total_attempts)
    recent_records = list(records[-recent_window:]) if recent_window else []
    recent_correct = sum(1 for rec in recent_records if rec["was_correct"])
    recent_accuracy = round((recent_correct / recent_window) * 100, 1) if recent_window else 0.0

    if total_attempts > recent_window and total_attempts - recent_window > 0:
        earlier_records = records[: total_attempts - recent_window]
        earlier_correct = sum(1 for rec in earlier_records if rec["was_correct"])
        earlier_accuracy = round((earlier_correct / len(earlier_records)) * 100, 1) if earlier_records else overall_accuracy
    else:
        earlier_accuracy = overall_accuracy

    trend_delta = round(recent_accuracy - earlier_accuracy, 1)
    if trend_delta > 4:
        trend_label = "improving"
    elif trend_delta < -4:
        trend_label = "needs attention"
    else:
        trend_label = "steady"

    streak = 0
    for rec in reversed(records):
        if rec["was_correct"]:
            streak += 1
        else:
            break

    difficulty_order = ("Easy", "Medium", "Hard", "Unknown")
    difficulty_stats: Dict[str, Dict[str, int]] = {}
    for rec in records:
        diff = rec["difficulty"] or "Unknown"
        bucket = difficulty_stats.setdefault(diff, {"attempts": 0, "correct": 0})
        bucket["attempts"] += 1
        if rec["was_correct"]:
            bucket["correct"] += 1

    difficulty_breakdown: List[Dict[str, Any]] = []
    for diff in difficulty_order:
        if diff not in difficulty_stats:
            continue
        bucket = difficulty_stats[diff]
        attempts = bucket["attempts"]
        correct = bucket["correct"]
        accuracy = round((correct / attempts) * 100, 1) if attempts else 0.0
        difficulty_breakdown.append(
            {
                "difficulty": diff,
                "attempts": attempts,
                "correct": correct,
                "accuracy": accuracy,
            }
        )

    topic_stats: Dict[str, Dict[str, Any]] = {}
    source_stats: Dict[str, Dict[str, Any]] = {}
    for rec in records:
        topic = rec["topic"]
        bucket = topic_stats.setdefault(
            topic,
            {
                "attempts": 0,
                "correct": 0,
                "incorrect": 0,
                "sources": Counter(),
            },
        )
        bucket["attempts"] += 1
        if rec["was_correct"]:
            bucket["correct"] += 1
        else:
            bucket["incorrect"] += 1
        if rec["source_label"]:
            bucket["sources"][rec["source_label"]] += 1

            source_label = rec["source_label"] or "Unspecified source"
            source_bucket = source_stats.setdefault(
                source_label,
                {
                    "attempts": 0,
                    "correct": 0,
                },
            )
            source_bucket["attempts"] += 1
            if rec["was_correct"]:
                source_bucket["correct"] += 1

    topic_breakdown: List[Dict[str, Any]] = []
    for topic, bucket in topic_stats.items():
        attempts = bucket["attempts"]
        correct = bucket["correct"]
        incorrect = bucket["incorrect"]
        accuracy = round((correct / attempts) * 100, 1) if attempts else 0.0
        primary_source = None
        if bucket["sources"]:
            primary_source = bucket["sources"].most_common(1)[0][0]
        topic_breakdown.append(
            {
                "topic": topic,
                "attempts": attempts,
                "correct": correct,
                "incorrect": incorrect,
                "accuracy": accuracy,
                "primary_source": primary_source,
            }
        )
    topic_breakdown.sort(key=lambda item: (item["accuracy"], -item["attempts"]))

    recommended_topic: Optional[Dict[str, Any]] = None
    for entry in topic_breakdown:
        if entry["attempts"] >= 2 and entry["accuracy"] < 85.0:
            recommended_topic = entry
            break
    if recommended_topic is None and topic_breakdown:
        recommended_topic = max(topic_breakdown, key=lambda item: item["attempts"])

    running_accuracy: List[float] = []
    running_correct = 0
    for index, rec in enumerate(records, start=1):
        if rec["was_correct"]:
            running_correct += 1
        running_accuracy.append(round((running_correct / index) * 100, 2))

    recent_projection = recent_accuracy
    if trend_label == "improving":
        recent_projection = min(100.0, recent_projection + 5.0)
    elif trend_label == "needs attention":
        recent_projection = max(0.0, recent_projection - 5.0)

    if total_attempts >= 20:
        projection_confidence = "high"
    elif total_attempts >= 10:
        projection_confidence = "medium"
    else:
        projection_confidence = "low"

    source_overview: List[Dict[str, Any]] = []
    for label, bucket in source_stats.items():
        attempts = bucket["attempts"]
        correct = bucket["correct"]
        accuracy = round((correct / attempts) * 100, 1) if attempts else 0.0
        source_overview.append(
            {
                "label": label,
                "attempts": attempts,
                "correct": correct,
                "accuracy": accuracy,
            }
        )
    source_overview.sort(key=lambda entry: (-entry["attempts"], -entry["accuracy"]))

    return {
        "total_attempts": total_attempts,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "overall_accuracy": overall_accuracy,
        "recent_accuracy": recent_accuracy,
        "recent_window": recent_window,
        "trend_label": trend_label,
        "trend_delta": trend_delta,
        "streak": streak,
        "difficulty_breakdown": difficulty_breakdown,
        "topic_breakdown": topic_breakdown,
        "recommended_topic": recommended_topic,
        "running_accuracy": running_accuracy,
        "projection_accuracy": round(recent_projection, 1),
        "projection_confidence": projection_confidence,
        "source_overview": source_overview,
    }


def _fetch_quiz_attempt_rows(
    *,
    limit: Optional[int] = 200,
    session_ids: Optional[Sequence[str]] = None,
    source_filter: Optional[str] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> List[sqlite3.Row]:
    conditions: List[str] = []
    params: List[Any] = []

    if session_ids:
        placeholders = ",".join(["?"] * len(session_ids))
        conditions.append(f"session_id IN ({placeholders})")
        params.extend(session_ids)

    if source_filter:
        conditions.append("source_label = ?")
        params.append(source_filter)
        
    if university:
        conditions.append("university = ?")
        params.append(university)
        
    if roll_no:
        conditions.append("roll_no = ?")
        params.append(roll_no)

    query = (
        "SELECT timestamp, topic, difficulty, was_correct, source_label, session_id "
        "FROM quiz_attempts"
    )
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY datetime(timestamp) DESC"
    if limit:
        query += " LIMIT ?"
        params.append(int(limit))

    with _get_conn() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()
    rows.reverse()
    return list(rows)


def _get_latest_session_id(university: Optional[str] = None, roll_no: Optional[str] = None) -> Optional[str]:
    query = (
        "SELECT session_id FROM quiz_attempts "
        "WHERE session_id IS NOT NULL AND TRIM(session_id) <> '' "
    )
    params = []
    
    if university:
        query += " AND university = ?"
        params.append(university)
    if roll_no:
        query += " AND roll_no = ?"
        params.append(roll_no)
        
    query += " ORDER BY datetime(timestamp) DESC LIMIT 1"
    
    with _get_conn() as conn:
        row = conn.execute(query, params).fetchone()
    if row and row[0]:
        return str(row[0])
    return None


def _collect_session_overview(limit: int = 12, university: Optional[str] = None, roll_no: Optional[str] = None) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    query = "SELECT session_id, timestamp, was_correct, source_label FROM quiz_attempts WHERE 1=1"
    params = []
    
    if university:
        query += " AND university = ?"
        params.append(university)
    if roll_no:
        query += " AND roll_no = ?"
        params.append(roll_no)
        
    query += " ORDER BY datetime(timestamp) ASC"

    with _get_conn() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()

    sessions: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        session_id = (row["session_id"] or "").strip() or "anonymous"
        info = sessions.setdefault(
            session_id,
            {
                "sessionId": session_id,
                "attempts": 0,
                "correct": 0,
                "startedAt": None,
                "lastAttemptAt": None,
                "sourceFrequency": Counter(),
            },
        )
        timestamp = row["timestamp"]
        if not info["startedAt"]:
            info["startedAt"] = timestamp
        info["lastAttemptAt"] = timestamp
        info["attempts"] += 1
        try:
            if int(row["was_correct"]):
                info["correct"] += 1
        except (TypeError, ValueError):
            if row["was_correct"]:
                info["correct"] += 1
        
        # Check if source_label column exists in row keys (it should, but safety first)
        source_label_val = row["source_label"] if "source_label" in row.keys() else None
        source_label = _simplify_source_label(source_label_val)
        if source_label:
            info["sourceFrequency"][source_label] += 1

    overview: List[Dict[str, Any]] = []
    for data in sessions.values():
        attempts = data["attempts"]
        accuracy = round((data["correct"] / attempts) * 100, 1) if attempts else 0.0
        top_source = None
        if data["sourceFrequency"]:
            top_source = data["sourceFrequency"].most_common(1)[0][0]
        overview.append(
            {
                "sessionId": data["sessionId"],
                "attempts": attempts,
                "accuracy": accuracy,
                "startedAt": data["startedAt"],
                "lastAttemptAt": data["lastAttemptAt"],
                "primarySource": top_source,
            }
        )

    overview.sort(key=lambda item: item["lastAttemptAt"] or "", reverse=True)
    latest_session_id = overview[0]["sessionId"] if overview else None

    if limit and len(overview) > limit:
        overview = overview[:limit]

    return overview, latest_session_id


def _collect_source_options(limit: Optional[int] = None, university: Optional[str] = None, roll_no: Optional[str] = None) -> List[Dict[str, Any]]:
    query = (
        "SELECT COALESCE(source_label, '') AS source_label, "
        "COUNT(*) AS attempts, SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) AS correct "
        "FROM quiz_attempts WHERE 1=1"
    )
    params = []
    if university:
        query += " AND university = ?"
        params.append(university)
    if roll_no:
        query += " AND roll_no = ?"
        params.append(roll_no)
        
    query += " GROUP BY source_label ORDER BY attempts DESC"

    with _get_conn() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()

    results: List[Dict[str, Any]] = []
    for row in rows:
        raw_value = (row["source_label"] or "").strip()
        label = _simplify_source_label(raw_value) or raw_value or "Unspecified source"
        attempts = int(row["attempts"] or 0)
        correct = int(row["correct"] or 0)
        accuracy = round((correct / attempts) * 100, 1) if attempts else 0.0
        results.append(
            {
                "label": label,
                "value": raw_value or label,
                "attempts": attempts,
                "accuracy": accuracy,
            }
        )

    if limit and len(results) > limit:
        results = results[:limit]
    return results


def get_quiz_analytics_options(university: Optional[str] = None, roll_no: Optional[str] = None) -> Dict[str, Any]:
    sessions, latest_session_id = _collect_session_overview(limit=20, university=university, roll_no=roll_no)
    sources = _collect_source_options(university=university, roll_no=roll_no)
    return {
        "sessions": sessions,
        "sources": sources,
        "latestSessionId": latest_session_id,
    }


try:
    from plotly.offline import plot as plotly_render
    from plotly.subplots import make_subplots
    import plotly.graph_objects as go
    _PLOTLY_AVAILABLE = True
except ImportError:
    _PLOTLY_AVAILABLE = False
    plotly_render = None
    make_subplots = None
    go = None


def render_quiz_performance_html(
    max_points: int = 200,
    *,
    scope: str = "session",
    session_filter: Optional[Sequence[str]] = None,
    source_filter: Optional[str] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> str:
    """Return a student-friendly quiz performance report with recommendations."""
    # Use global availability check
    plotly_available = _PLOTLY_AVAILABLE

    resolved_scope = (scope or "session").strip().lower()

    session_ids: List[str] = []
    if session_filter:
        if isinstance(session_filter, str):  # type: ignore[unreachable]
            candidates = [segment.strip() for segment in session_filter.split(",")]
        else:
            candidates = [str(item).strip() for item in session_filter]
        session_ids = [candidate for candidate in candidates if candidate]

    resolved_session_id: Optional[str] = session_ids[0] if session_ids else None
    session_scopes = {"session", "recent", "latest", "latest_session"}
    if resolved_scope in session_scopes and not session_ids:
        latest_session = _get_latest_session_id(university=university, roll_no=roll_no)
        if latest_session:
            session_ids = [latest_session]
            resolved_session_id = latest_session
    elif resolved_scope == "overall":
        session_ids = []

    raw_source_filter = (source_filter or "").strip() or None

    rows = _fetch_quiz_attempt_rows(
        limit=max_points,
        session_ids=session_ids or None,
        source_filter=raw_source_filter,
        university=university,
        roll_no=roll_no
    )

    if not rows:
        return (
            "<html><head><meta charset='utf-8'><title>Quiz Analytics</title>"
            "<style>body{font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background:#f3f4f6;padding:32px;}"
            "h2{color:#111827;}p{color:#4b5563;font-size:15px;max-width:720px;}"
            ".card{background:#ffffff;border-radius:16px;box-shadow:0 20px 25px -18px rgba(15,23,42,0.35);padding:28px;max-width:960px;margin:0 auto;}"
            "</style></head><body><div class='card'>"
            "<h2>Quiz Performance Insights</h2>"
            "<p>No quiz attempts matched the selected filters. Try another session or source.</p>"
            "</div></body></html>"
        )

    records = _prepare_quiz_records(rows)
    stats = _summarize_quiz_records(records)

    filters = {
        "scope": resolved_scope,
        "sessionId": resolved_session_id,
        "source": raw_source_filter,
    }

    chart_div = ""
    if plotly_available and plotly_render and make_subplots and go:
        chart_div = _build_quiz_performance_chart(records, stats, plotly_render, make_subplots, go)
    else:
        chart_div = (
            "<div class='notice'>Interactive charts require Plotly. Install it with "
            "<code>pip install plotly</code> to enable the timeline visual. The summary below is still up to date.</div>"
        )

    return _render_quiz_report(stats, chart_div, filters)


def _build_quiz_performance_chart(
    records: Sequence[Dict[str, Any]],
    stats: Dict[str, Any],
    plotly_render,  # type: ignore[valid-type]
    make_subplots,  # type: ignore[valid-type]
    go,  # type: ignore[valid-type]
) -> str:
    timestamps = [rec["timestamp"] for rec in records]
    running_accuracy = stats["running_accuracy"]
    difficulties = [rec["difficulty"] for rec in records]

    difficulty_colors = {
        "Easy": "#22c55e",
        "Medium": "#f59e0b",
        "Hard": "#ef4444",
        "Unknown": "#64748b",
    }

    fig = make_subplots(
        rows=2,
        cols=1,
        shared_xaxes=False,
        vertical_spacing=0.18,
        subplot_titles=("Running Accuracy", "Accuracy by Difficulty"),
        row_heights=[0.65, 0.35],
    )

    fig.add_trace(
        go.Scatter(
            x=timestamps,
            y=running_accuracy,
            mode="lines+markers",
            name="Running Accuracy",
            line=dict(color="#2563eb", width=3),
            hovertemplate="<b>%{x|%Y-%m-%d %H:%M}</b><br>Accuracy: %{y:.2f}%<extra></extra>",
        ),
        row=1,
        col=1,
    )

    unique_difficulties = sorted(set(difficulties), key=lambda label: (label != "Easy", label != "Medium", label))
    for label in unique_difficulties:
        indices = [idx for idx, diff in enumerate(difficulties) if diff == label]
        if not indices:
            continue
        fig.add_trace(
            go.Scatter(
                x=[timestamps[idx] for idx in indices],
                y=[running_accuracy[idx] for idx in indices],
                mode="markers",
                name=f"{label} Attempts",
                marker=dict(
                    size=12,
                    symbol="circle",
                    color=difficulty_colors.get(label, "#475569"),
                    line=dict(width=1, color="#1f2937"),
                ),
                hovertemplate=(
                    "<b>%{x|%Y-%m-%d %H:%M}</b><br>Difficulty: "
                    f"{label}<br>Running Accuracy: %{{y:.2f}}%<extra></extra>"
                ),
            ),
            row=1,
            col=1,
        )

    bar_x: List[str] = []
    bar_y: List[float] = []
    bar_text: List[str] = []
    for entry in stats["difficulty_breakdown"]:
        label = entry["difficulty"]
        attempts = entry["attempts"]
        if not attempts:
            continue
        bar_x.append(label)
        bar_y.append(entry["accuracy"])
        bar_text.append(f"{entry['accuracy']:.1f}% ({entry['correct']}/{attempts})")

    if bar_x:
        fig.add_trace(
            go.Bar(
                x=bar_x,
                y=bar_y,
                marker_color=[difficulty_colors.get(label, "#475569") for label in bar_x],
                text=bar_text,
                textposition="outside",
                name="Accuracy by Difficulty",
                hovertemplate="Difficulty: %{x}<br>Accuracy: %{y:.2f}%<extra></extra>",
            ),
            row=2,
            col=1,
        )

    fig.update_yaxes(title_text="Accuracy (%)", range=[0, 100], row=1, col=1)
    fig.update_yaxes(title_text="Difficulty Accuracy (%)", range=[0, 100], row=2, col=1)
    fig.update_xaxes(title_text="Attempt timeline", row=1, col=1)
    fig.update_xaxes(title_text="Difficulty", row=2, col=1)

    fig.update_layout(
        showlegend=True,
        legend=dict(orientation="h", x=0, y=1.08),
        margin=dict(l=60, r=40, t=80, b=60),
        paper_bgcolor="#f9fafb",
        plot_bgcolor="#ffffff",
        title=dict(
            text="Student Understanding - Quiz Performance",
            x=0.04,
            font=dict(size=22, color="#111827"),
        ),
    )

    return plotly_render(fig, include_plotlyjs=True, output_type="div")


def _render_quiz_report(stats: Dict[str, Any], chart_div: str, filters: Optional[Dict[str, Any]] = None) -> str:
    total_attempts = stats["total_attempts"]
    correct_count = stats["correct_count"]
    incorrect_count = stats["incorrect_count"]
    overall_accuracy = stats["overall_accuracy"]
    recent_accuracy = stats["recent_accuracy"]
    recent_window = stats["recent_window"]
    trend_label = stats["trend_label"]
    trend_delta = stats["trend_delta"]
    streak = stats["streak"]
    projection_accuracy = stats["projection_accuracy"]
    projection_confidence = stats["projection_confidence"]
    difficulty_breakdown = stats["difficulty_breakdown"]
    topic_breakdown = stats["topic_breakdown"]
    recommended_topic = stats["recommended_topic"]
    source_overview = stats.get("source_overview", [])

    filter_items: List[str] = []
    if filters:
        scope = filters.get("scope")
        if scope == "overall":
            filter_items.append("Scope: Overall performance")
        elif scope == "session":
            session_id = filters.get("sessionId")
            label = f"Session: {session_id}" if session_id else "Scope: Current session"
            filter_items.append(label)
        elif scope == "document":
            filter_items.append("Scope: Document focus")

        source_value = filters.get("source")
        if source_value:
            filter_items.append(f"Source: {source_value}")

    filters_html = ""
    if filter_items:
        badges = "".join(f"<span class='badge'>{item}</span>" for item in filter_items)
        filters_html = f"<div class='filters'>{badges}</div>"

    if trend_label == "improving":
        trend_text = f"Accuracy is trending up (+{trend_delta:.1f}% compared with earlier attempts)."
    elif trend_label == "needs attention":
        trend_text = f"Accuracy dipped {-trend_delta:.1f}% versus earlier attempts. A quick review will help."
    else:
        trend_text = "Accuracy is steady across recent attempts."

    if streak > 1:
        streak_text = f"{streak} correct answers in a row."
    elif streak == 1:
        streak_text = "You answered the last question correctly."
    else:
        streak_text = "Streak reset on the last question."

    if recent_window:
        recent_text = f"Last {recent_window} questions: {recent_accuracy:.1f}% accuracy."
    else:
        recent_text = "Answer more questions to unlock recent trends."

    summary_items = [
        f"<li><strong>Overall accuracy:</strong> {overall_accuracy:.1f}% ({correct_count}/{total_attempts} correct).</li>",
        f"<li><strong>Recent performance:</strong> {recent_text}</li>",
        f"<li><strong>Trend:</strong> {trend_text}</li>",
        f"<li><strong>Current streak:</strong> {streak_text}</li>",
        f"<li><strong>Predicted next round:</strong> about {projection_accuracy:.1f}% accuracy ({projection_confidence} confidence).</li>",
    ]

    def _format_material_label(raw: Optional[str]) -> Optional[str]:
        if not raw:
            return None
        parts = [segment.strip() for segment in raw.split("|") if segment.strip()]
        if parts:
            return ", ".join(parts)
        return raw.strip()

    if recommended_topic:
        material_label = _format_material_label(recommended_topic.get("primary_source"))
        attempts = recommended_topic["attempts"]
        correct = recommended_topic["correct"]
        accuracy = recommended_topic["accuracy"]
        topic_name = recommended_topic["topic"]
        if material_label:
            study_tip = (
                f"Review <em>{material_label}</em> in your course material, then retry a quiz focused on this topic."
            )
        else:
            study_tip = "Open your course notes for this topic, refresh the key ideas, then take another quiz."
        recommendation_html = (
            "<div class='recommendation'>"
            "<h3>Recommended Next Topic</h3>"
            f"<p><strong>Focus on:</strong> {topic_name} &mdash; {accuracy:.1f}% accuracy ({correct}/{attempts} correct).</p>"
            f"<p>{study_tip}</p>"
            "</div>"
        )
    else:
        recommendation_html = (
            "<div class='recommendation'>"
            "<h3>Recommended Next Topic</h3>"
            "<p>Keep answering quiz questions to unlock personalized study suggestions.</p>"
            "</div>"
        )

    difficulty_rows = "".join(
        (
            f"<tr><td>{entry['difficulty']}</td><td>{entry['attempts']}</td>"
            f"<td>{entry['correct']}/{entry['attempts']}</td><td>{entry['accuracy']:.1f}%</td></tr>"
        )
        for entry in difficulty_breakdown
        if entry["attempts"]
    )
    if not difficulty_rows:
        difficulty_rows = "<tr><td colspan='4'>Difficulty insights will appear after your first quiz.</td></tr>"

    topic_rows = "".join(
        (
            f"<tr><td>{entry['topic']}</td><td>{entry['attempts']}</td>"
            f"<td>{entry['correct']}/{entry['attempts']}</td><td>{entry['accuracy']:.1f}%</td>"
            f"<td>{_format_material_label(entry.get('primary_source')) or '&mdash;'}</td></tr>"
        )
        for entry in topic_breakdown[:5]
    )
    if not topic_rows:
        topic_rows = "<tr><td colspan='5'>Topic-specific insights will appear after a few quiz questions.</td></tr>"

    source_rows = "".join(
        (
            f"<tr><td>{entry['label']}</td><td>{entry['attempts']}</td>"
            f"<td>{entry['correct']}/{entry['attempts']}</td><td>{entry['accuracy']:.1f}%</td></tr>"
        )
        for entry in source_overview[:6]
    )
    if not source_rows:
        source_rows = "<tr><td colspan='4'>Source-specific insights appear once quizzes target uploaded documents.</td></tr>"

    return (
        "<html><head><meta charset='utf-8'><title>Quiz Analytics</title>"
        "<style>body{font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background:#f3f4f6;padding:32px;}"
        "h2{color:#111827;}h3{color:#1f2937;margin-top:1.8rem;}"
        ".card{background:#ffffff;border-radius:16px;box-shadow:0 24px 38px -30px rgba(15,23,42,0.4);padding:28px;max-width:980px;margin:0 auto;}"
        ".filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}"
        ".badge{display:inline-flex;align-items:center;gap:6px;background:#1f2937;color:#e2e8f0;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;}"
        ".summary{margin:1.4rem 0;background:#eff6ff;border-radius:12px;padding:18px;}"
        ".summary ul{margin:0;padding-left:20px;color:#1f2937;font-size:15px;line-height:1.6;}"
        ".summary li{margin-bottom:6px;}"
        ".recommendation{background:#ecfdf5;border:1px solid #34d39940;border-radius:12px;padding:20px;margin-top:24px;color:#065f46;}"
        ".recommendation h3{margin-top:0;color:#047857;}"
        ".notice{margin-top:24px;padding:16px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:14px;}"
        "table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;}"
        "th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb;}"
        "th{color:#111827;background:#f8fafc;font-weight:600;}"
        "td{color:#374151;}"
        "em{font-style:normal;color:#0f172a;font-weight:600;}"
        "</style></head><body><div class='card'>"
        "<h2>Quiz Performance Insights</h2>"
        + filters_html
        + "<div class='summary'><ul>" + "".join(summary_items) + "</ul></div>"
        f"{chart_div}"
        "<h3>Difficulty Breakdown</h3>"
        "<table><thead><tr><th>Difficulty</th><th>Attempts</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>"
        f"{difficulty_rows}" "</tbody></table>"
        "<h3>Topic Focus</h3>"
        "<table><thead><tr><th>Topic</th><th>Attempts</th><th>Correct</th><th>Accuracy</th><th>Course Material</th></tr></thead><tbody>"
        f"{topic_rows}" "</tbody></table>"
        f"{recommendation_html}"
        "<h3>Source Performance</h3>"
        "<table><thead><tr><th>Source</th><th>Attempts</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>"
        f"{source_rows}" "</tbody></table>"
        "<p style='color:#4b5563;font-size:13px;margin-top:28px;'>These insights update automatically as you answer more questions.</p>"
        "</div></body></html>"
    )

def log_feedback_event(
    session_id: str,
    object_type: str,
    object_id: Optional[str],
    feedback: str,
    comment: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    university: Optional[str] = None,
    roll_no: Optional[str] = None
) -> None:
    payload = (
        _now(),
        university,
        roll_no,
        session_id,
        object_type,
        object_id,
        feedback,
        comment,
        _serialize(metadata),
    )
    with _LOCK:
        conn = _get_conn()
        try:
            conn.execute(
                """
                INSERT INTO feedback_events (
                    timestamp, university, roll_no, session_id, object_type, object_id, feedback, comment, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            conn.commit()
        finally:
            conn.close()
