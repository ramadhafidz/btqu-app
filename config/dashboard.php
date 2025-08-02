<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Dashboard Cache Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration for dashboard data caching.
    | Adjust these settings based on your application's performance needs.
    |
    */

    'dashboard' => [
        /*
        |--------------------------------------------------------------------------
        | Default Cache Duration
        |--------------------------------------------------------------------------
        |
        | Default cache time in seconds for dashboard data.
        | Set to 0 to disable caching.
        |
        */
        'default_cache_time' => env('DASHBOARD_CACHE_TIME', 300), // 5 minutes

        /*
        |--------------------------------------------------------------------------
        | Cache Keys Configuration
        |--------------------------------------------------------------------------
        |
        | Define cache key patterns and their specific cache durations.
        |
        */
        'cache_keys' => [
            'teacher_metrics' => [
                'duration' => env('TEACHER_METRICS_CACHE_TIME', 300),
                'pattern' => 'dashboard_metrics_teacher_{teacher_id}_{filters_hash}'
            ],
            'coordinator_metrics' => [
                'duration' => env('COORDINATOR_METRICS_CACHE_TIME', 600), // 10 minutes
                'pattern' => 'dashboard_metrics_coordinator_{filters_hash}'
            ],
            'overall_stats' => [
                'duration' => env('OVERALL_STATS_CACHE_TIME', 1800), // 30 minutes
                'pattern' => 'dashboard_overall_stats'
            ],
            'teacher_ranking' => [
                'duration' => env('TEACHER_RANKING_CACHE_TIME', 900), // 15 minutes
                'pattern' => 'dashboard_teacher_ranking_{filters_hash}'
            ]
        ],

        /*
        |--------------------------------------------------------------------------
        | Cache Invalidation Rules
        |--------------------------------------------------------------------------
        |
        | Define when dashboard cache should be invalidated automatically.
        |
        */
        'invalidation' => [
            // Clear cache when new progress logs are added
            'on_progress_log_create' => true,
            
            // Clear cache when promotions are updated
            'on_promotion_update' => true,
            
            // Clear cache when students are added/updated
            'on_student_update' => false, // Usually not needed for dashboard
            
            // Auto-clear cache during business hours
            'auto_clear_business_hours' => [
                'enabled' => env('AUTO_CLEAR_CACHE', false),
                'times' => ['08:00', '12:00', '16:00'] // Clear at these times
            ]
        ],

        /*
        |--------------------------------------------------------------------------
        | Performance Optimization
        |--------------------------------------------------------------------------
        |
        | Settings to optimize dashboard performance.
        |
        */
        'optimization' => [
            // Maximum number of days to process for activity calculations
            'max_activity_days' => env('MAX_ACTIVITY_DAYS', 90),
            
            // Maximum number of records to process in ranking queries
            'max_ranking_records' => env('MAX_RANKING_RECORDS', 50),
            
            // Use database query optimization
            'enable_query_optimization' => true,
            
            // Paginate large result sets
            'enable_pagination' => true,
            'pagination_size' => 100
        ],

        /*
        |--------------------------------------------------------------------------
        | Business Day Configuration
        |--------------------------------------------------------------------------
        |
        | Configure business day detection for accurate activity tracking.
        |
        */
        'business_days' => [
            // Days of week (0 = Sunday, 6 = Saturday)
            'working_days' => [1, 2, 3, 4, 5], // Monday to Friday
            
            // Indonesian national holidays (will be excluded from business days)
            'holidays' => [
                // Fixed holidays
                '01-01', // New Year
                '08-17', // Independence Day
                '12-25', // Christmas
                
                // Variable holidays (will need to be updated annually)
                // These should ideally come from an external API or database
                '2024-01-01', // New Year 2024
                '2024-02-08', // Chinese New Year
                '2024-02-09', // Chinese New Year Holiday
                '2024-03-11', // Isra Miraj
                '2024-03-29', // Good Friday
                '2024-04-10', // Eid al-Fitr
                '2024-04-11', // Eid al-Fitr Holiday
                '2024-05-01', // Labor Day
                '2024-05-09', // Ascension Day
                '2024-05-23', // Buddha Day
                '2024-06-01', // Pancasila Day
                '2024-06-17', // Eid al-Adha
                '2024-08-17', // Independence Day
                '2024-09-16', // Islamic New Year
                '2024-11-25', // Prophet Muhammad's Birthday
                '2024-12-25', // Christmas
                '2024-12-26', // Boxing Day
            ],
            
            // School-specific holidays
            'school_holidays' => [
                // Add school-specific holidays here
                // These might come from a database table
            ]
        ],

        /*
        |--------------------------------------------------------------------------
        | Monitoring and Logging
        |--------------------------------------------------------------------------
        |
        | Configure monitoring for dashboard performance.
        |
        */
        'monitoring' => [
            // Log slow dashboard queries
            'log_slow_queries' => env('LOG_SLOW_DASHBOARD_QUERIES', true),
            'slow_query_threshold' => env('SLOW_QUERY_THRESHOLD', 1000), // milliseconds
            
            // Monitor cache hit rates
            'monitor_cache_hits' => env('MONITOR_CACHE_HITS', false),
            
            // Alert when cache miss rate is high
            'alert_high_cache_miss' => env('ALERT_HIGH_CACHE_MISS', false),
            'cache_miss_threshold' => 0.3 // 30% miss rate
        ]
    ]
];