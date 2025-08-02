# BTQ Dashboard System Implementation

This document summarizes the comprehensive dashboard calculation system implemented for the BTQ application.

## Overview

The dashboard system provides real-time metrics and analytics for both teachers (guru) and coordinators (koordinator) with the following key features:

- **Teacher Dashboard**: Progress tracking, student metrics, promotion management
- **Coordinator Dashboard**: Teacher activity monitoring, system-wide statistics, performance ranking
- **Caching System**: Optimized performance with configurable cache duration
- **Business Day Detection**: Automatic filtering for working days
- **Chart.js Integration**: Ready-to-use data formatting for frontend charts
- **Role-based Access**: Secure endpoints with proper authorization

## Architecture

### Core Components

1. **DashboardMetricsService** (`app/Services/DashboardMetricsService.php`)
   - Central service for all dashboard calculations
   - Implements caching for performance optimization
   - Business day detection and filtering
   - Comprehensive metrics for both teacher and coordinator roles

2. **API Controllers**
   - **DashboardApiController** (`app/Http/Controllers/Api/DashboardApiController.php`)
   - **Enhanced ChartController** (`app/Http/Controllers/ChartController.php`)
   - RESTful endpoints with proper error handling and validation

3. **Middleware**
   - **RoleMiddleware** (`app/Http/Middleware/RoleMiddleware.php`)
   - Role-based access control for dashboard endpoints

4. **Console Commands**
   - **ClearDashboardCache** (`app/Console/Commands/ClearDashboardCache.php`)
   - Manual and scheduled cache management

## Features Implemented

### Teacher Dashboard Metrics
- ✅ Progress harian per siswa dalam grup
- ✅ Distribusi tingkat jilid siswa
- ✅ Jumlah hafalan per siswa
- ✅ Kenaikan jilid yang diajukan vs diterima
- ✅ Total halaman dibaca hari ini
- ✅ Aktivitas per hari
- ✅ Siswa yang siap naik jilid

### Coordinator Dashboard Metrics
- ✅ Rekap aktivitas harian per guru
- ✅ Kenaikan jilid per bulan
- ✅ Ranking guru paling aktif
- ✅ Distribusi tingkat jilid per level kelas
- ✅ Statistik hafalan

### Technical Features
- ✅ RESTful API endpoints with comprehensive documentation
- ✅ Caching system with configurable duration (5-30 minutes)
- ✅ Date range filtering (date_from, date_to)
- ✅ Class level and group filtering
- ✅ Business day detection (Monday-Friday, excludes holidays)
- ✅ Chart.js compatible data formatting
- ✅ Error handling and validation
- ✅ Role-based authorization
- ✅ Test coverage for core functionality

## API Endpoints

### Main Dashboard Endpoints
```
GET /api/dashboard/teacher           # Teacher dashboard data
GET /api/dashboard/coordinator       # Coordinator dashboard data
GET /api/dashboard/teacher/{id}/metrics  # Specific teacher metrics
GET /api/dashboard/summary          # Dashboard summary
GET /api/dashboard/business-day-status   # Business day check
DELETE /api/dashboard/cache         # Clear dashboard cache
```

### Legacy Chart Endpoints (Backward Compatibility)
```
GET /api/charts/teacher-dashboard
GET /api/charts/coordinator-dashboard
GET /api/charts/teacher/{id}/metrics
DELETE /api/charts/cache
```

## Configuration

### Cache Configuration (`config/dashboard.php`)
- Configurable cache durations for different metrics
- Cache invalidation rules
- Performance optimization settings
- Business day configuration
- Monitoring and logging options

### Environment Variables
```env
DASHBOARD_CACHE_TIME=300
TEACHER_METRICS_CACHE_TIME=300
COORDINATOR_METRICS_CACHE_TIME=600
OVERALL_STATS_CACHE_TIME=1800
AUTO_CLEAR_CACHE=false
MAX_ACTIVITY_DAYS=90
```

## Database Schema Usage

The system leverages existing database tables:
- `student_progress_logs` - Daily activity tracking
- `student_progress` - Current student status and promotions
- `students` - Student information
- `btq_groups` - Teacher groups and assignments
- `employees` - Teacher data
- `school_classes` - Class levels
- `users` - Authentication and roles

## Frontend Integration

### JavaScript Client (`docs/dashboard-client.js`)
- Ready-to-use API client class
- Chart.js helper functions
- Utility functions for date formatting and data handling
- Example implementation for teacher dashboard

### Usage Example
```javascript
const api = new DashboardAPI();
api.setAuthToken(localStorage.getItem('auth_token'));

const data = await api.getTeacherDashboard({
    date_from: '2024-08-01',
    date_to: '2024-08-31'
});

// Create charts with Chart.js
DashboardCharts.createDailyActivityChart(ctx, data.daily_activity.chart_data);
```

## Performance Optimizations

1. **Caching Strategy**
   - 5-minute cache for teacher metrics
   - 10-minute cache for coordinator metrics
   - 30-minute cache for overall statistics
   - Automatic cache invalidation on data updates

2. **Query Optimization**
   - Business day filtering in database queries
   - Efficient joins and aggregations
   - Limited date ranges to prevent performance issues
   - Pagination for large result sets

3. **Scheduled Tasks**
   - Daily cache clearing at 6 AM on business days
   - Automatic cache warming during off-peak hours

## Security Features

1. **Authentication**
   - Laravel Sanctum token-based authentication
   - All endpoints require valid authentication

2. **Authorization**
   - Role-based access control (guru, koordinator, superadmin)
   - Teachers can only access their own group data
   - Coordinators can access all teacher data

3. **Validation**
   - Input validation for all filters
   - Date range validation
   - Proper error handling and messaging

## Testing

### Unit Tests (`tests/Unit/DashboardMetricsServiceTest.php`)
- Service instantiation
- Business day detection
- Error handling for invalid data
- Filter validation

### Feature Tests (`tests/Feature/DashboardApiTest.php`)
- Authentication requirements
- Role-based access control
- API response structure validation
- Filter parameter validation

## Monitoring and Maintenance

### Console Commands
```bash
# Clear all dashboard cache
php artisan dashboard:clear-cache

# Clear specific cache pattern
php artisan dashboard:clear-cache --pattern=teacher_123

# Force clear without confirmation
php artisan dashboard:clear-cache --force
```

### Scheduled Tasks
- Daily cache clearing configured in `routes/console.php`
- Runs at 6:00 AM on business days only
- Prevents overlap and runs in background

## Documentation

1. **API Documentation** (`docs/dashboard-api.md`)
   - Comprehensive endpoint documentation
   - Request/response examples
   - Error handling guide

2. **Frontend Client** (`docs/dashboard-client.js`)
   - JavaScript client library
   - Chart.js integration examples
   - Utility functions

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**
   - WebSocket integration for live dashboard updates
   - Push notifications for important metrics

2. **Advanced Analytics**
   - Predictive analytics for student performance
   - Machine learning insights for teaching optimization

3. **Export Features**
   - PDF report generation
   - Excel export for detailed analysis

4. **Mobile Optimization**
   - Responsive dashboard design
   - Mobile app API compatibility

### Scalability Considerations
1. **Database Optimization**
   - Add database indexes for dashboard queries
   - Consider read replicas for heavy reporting

2. **Caching Improvements**
   - Redis implementation for distributed caching
   - Cache warming strategies

3. **Monitoring**
   - Performance monitoring with tools like New Relic
   - Dashboard usage analytics

## Support and Maintenance

For issues or questions regarding the dashboard system:

1. Check the API documentation in `docs/dashboard-api.md`
2. Review error logs for debugging information
3. Use the console commands for cache management
4. Refer to the test files for usage examples

The system is designed to be maintainable and extensible, with clear separation of concerns and comprehensive documentation.