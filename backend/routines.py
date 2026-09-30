"""
Predictive Routine Engine
Analyzes task history to predict recurring behaviors and suggest routines.
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any


def analyze_routines(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyze completed tasks to find recurring patterns.
    
    Args:
        tasks: List of task dicts with 'title', 'created_at', 'is_completed'
    
    Returns:
        List of suggested routines with confidence scores
    """
    # Filter completed tasks
    completed = [t for t in tasks if t.get("is_completed") and t.get("created_at")]
    
    if len(completed) < 2:
        return []
    
    # Group by normalized title
    title_groups = defaultdict(list)
    for task in completed:
        normalized = _normalize_title(task["title"])
        title_groups[normalized].append(task)
    
    suggestions = []
    
    for title, group in title_groups.items():
        if len(group) < 2:
            continue
        
        # Calculate frequency (times per week)
        timestamps = [t["created_at"] for t in group]
        time_span_days = max((max(timestamps) - min(timestamps)).days, 1)
        frequency_per_week = len(group) / (time_span_days / 7)
        
        # Calculate average time of day
        hours = [t.hour for t in timestamps]
        avg_hour = sum(hours) / len(hours)
        
        # Calculate confidence based on consistency
        if len(hours) >= 2:
            variance = sum((h - avg_hour) ** 2 for h in hours) / len(hours)
            confidence = min(1.0, 1.0 - (variance / 36))  # Max variance of 6 hours
        else:
            confidence = 0.5
        
        # Determine if this is a daily, weekly, or occasional routine
        if frequency_per_week >= 5:
            routine_type = "daily"
        elif frequency_per_week >= 1:
            routine_type = "weekly"
        else:
            routine_type = "occasional"
        
        # Calculate next suggested occurrence
        next_occurrence = _next_occurrence(avg_hour, routine_type)
        
        suggestions.append({
            "title": title,
            "frequency": round(frequency_per_week, 1),
            "routine_type": routine_type,
            "confidence": round(confidence, 2),
            "suggested_time": next_occurrence,
            "occurrences": len(group),
        })
    
    # Sort by confidence and frequency
    suggestions.sort(key=lambda x: (x["confidence"], x["frequency"]), reverse=True)
    
    return suggestions[:5]  # Return top 5 suggestions


def _normalize_title(title: str) -> str:
    """Normalize task title for grouping."""
    return title.lower().strip()


def _next_occurrence(avg_hour: float, routine_type: str) -> str:
    """Calculate the next suggested time for a routine."""
    now = datetime.utcnow()
    suggested = now.replace(hour=int(avg_hour), minute=int((avg_hour % 1) * 60), second=0)
    
    if suggested <= now:
        if routine_type == "daily":
            suggested += timedelta(days=1)
        else:
            suggested += timedelta(weeks=1)
    
    return suggested.strftime("%Y-%m-%dT%H:%M:%S")
