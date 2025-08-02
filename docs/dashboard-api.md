# Dashboard API Documentation

This document describes the new dashboard API endpoints for the BTQ application.

## Authentication

All endpoints require authentication using Laravel Sanctum. Include the bearer token in the Authorization header:

```
Authorization: Bearer {your-token}
```

## Base URL

All endpoints are prefixed with `/api/dashboard`

## Teacher Dashboard Endpoints

### Get Teacher Dashboard Data
```
GET /api/dashboard/teacher
```

**Permission Required:** Role `guru`

**Query Parameters:**
- `date_from` (optional): Start date filter (YYYY-MM-DD)
- `date_to` (optional): End date filter (YYYY-MM-DD)  
- `class_level` (optional): Filter by class level (1-12)
- `group_id` (optional): Filter by specific BTQ group

**Response:**
```json
{
  "success": true,
  "data": {
    "group_info": {
      "id": 1,
      "level": 1,
      "student_count": 25,
      "teacher_name": "John Doe"
    },
    "daily_progress_per_student": {
      "Ahmad": [
        {
          "date": "2024-08-01",
          "pages_count": 5,
          "hafalan_count": 2
        }
      ]
    },
    "jilid_distribution": [
      {
        "label": "Jilid 1",
        "value": 10,
        "jilid": 1
      }
    ],
    "hafalan_count_per_student": [
      {
        "student_name": "Ahmad",
        "student_id": 1,
        "hafalan_count": 15
      }
    ],
    "promotion_stats": {
      "proposed": 5,
      "accepted": 3,
      "rejected": 1,
      "chart_data": {
        "labels": ["Diajukan", "Diterima", "Ditolak"],
        "datasets": [
          {
            "data": [5, 3, 1],
            "backgroundColor": ["#fbbf24", "#10b981", "#ef4444"]
          }
        ]
      }
    },
    "pages_read_today": 25,
    "daily_activity": {
      "chart_data": {
        "labels": ["Aug 01", "Aug 02"],
        "datasets": [
          {
            "label": "Halaman",
            "data": [10, 15],
            "backgroundColor": "#3b82f6"
          },
          {
            "label": "Hafalan", 
            "data": [5, 8],
            "backgroundColor": "#10b981"
          }
        ]
      }
    },
    "students_ready_for_promotion": [
      {
        "id": 1,
        "nama_lengkap": "Ahmad",
        "jilid": 1,
        "halaman": 25,
        "activity_count": 15,
        "last_activity": "2024-08-01T10:00:00Z"
      }
    ]
  },
  "meta": {
    "filters_applied": {},
    "generated_at": "2024-08-02T10:00:00Z",
    "cache_enabled": true
  }
}
```

## Coordinator Dashboard Endpoints

### Get Coordinator Dashboard Data
```
GET /api/dashboard/coordinator
```

**Permission Required:** Role `koordinator`

**Query Parameters:** Same as teacher dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_teacher_activity": {
      "John Doe": [
        {
          "teacher_name": "John Doe",
          "teacher_id": 1,
          "date": "2024-08-01",
          "pages_count": 50,
          "hafalan_count": 20,
          "active_students": 25
        }
      ]
    },
    "monthly_promotions": [
      {
        "label": "Aug 2024",
        "year": 2024,
        "month": 8,
        "count": 15
      }
    ],
    "teacher_ranking": [
      {
        "teacher_name": "John Doe",
        "teacher_id": 1,
        "group_level": 1,
        "total_activities": 100,
        "pages_count": 75,
        "hafalan_count": 25,
        "active_students": 25,
        "active_days": 20
      }
    ],
    "jilid_distribution_by_class_level": {
      "1": [
        {
          "class_level": "1",
          "jilid": 1,
          "student_count": 20
        }
      ]
    },
    "hafalan_statistics": {
      "total_hafalan": 150,
      "total_students_with_hafalan": 50,
      "average_hafalan_per_student": 3.0,
      "by_class_level": [
        {
          "class_level": "1",
          "hafalan_count": 50,
          "students_with_hafalan": 20
        }
      ],
      "chart_data": {
        "labels": ["1", "2", "3"],
        "datasets": [
          {
            "label": "Jumlah Hafalan",
            "data": [50, 60, 40],
            "backgroundColor": "#10b981"
          }
        ]
      }
    },
    "overall_stats": {
      "total_students": 100,
      "total_teachers": 5,
      "total_groups": 5,
      "total_classes": 6,
      "active_promotions": 10
    }
  }
}
```

### Get Specific Teacher Metrics
```
GET /api/dashboard/teacher/{teacherId}/metrics
```

**Permission Required:** Role `koordinator`

**Parameters:**
- `teacherId`: The ID of the teacher/employee

**Query Parameters:** Same as teacher dashboard

**Response:** Same structure as teacher dashboard but for the specified teacher

## Utility Endpoints

### Get Dashboard Summary
```
GET /api/dashboard/summary
```

**Permission Required:** Role `guru` or `koordinator`

Returns a simplified summary based on user role.

### Get Business Day Status
```
GET /api/dashboard/business-day-status
```

**Permission Required:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": {
    "is_business_day": true,
    "current_time": "2024-08-02T10:00:00Z",
    "timezone": "Asia/Jakarta"
  }
}
```

### Clear Dashboard Cache
```
DELETE /api/dashboard/cache
```

**Permission Required:** Role `koordinator` or `superadmin`

**Query Parameters:**
- `pattern` (optional): Specific cache pattern to clear

**Response:**
```json
{
  "success": true,
  "message": "Cache dashboard berhasil dibersihkan",
  "pattern": "all"
}
```

## Legacy Chart Endpoints

The following legacy endpoints are still available under `/api/charts/` for backward compatibility:

- `GET /api/charts/teacher-dashboard` - Enhanced teacher dashboard
- `GET /api/charts/coordinator-dashboard` - Enhanced coordinator dashboard  
- `GET /api/charts/teacher/{teacherId}/metrics` - Teacher metrics for coordinator
- `DELETE /api/charts/cache` - Clear dashboard cache

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": { /* validation errors if applicable */ }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `401` - Unauthenticated
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `422` - Validation error
- `500` - Server error

## Data Filters

All dashboard endpoints support the following filters:

- **date_from / date_to**: Filter data by date range
- **class_level**: Filter by school class level (1-12)
- **group_id**: Filter by specific BTQ group

## Performance Notes

- All dashboard data is cached for 5 minutes by default
- Business day detection excludes weekends automatically
- Large date ranges may impact performance
- Use the cache clearing endpoint sparingly

## Chart.js Compatibility

Chart data is formatted for direct use with Chart.js library. The `chart_data` objects include:

- `labels`: Array of x-axis labels
- `datasets`: Array of dataset objects with data and styling
- Standard Chart.js color scheme for consistency