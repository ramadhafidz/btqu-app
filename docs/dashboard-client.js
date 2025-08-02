/**
 * Dashboard API Client
 * Frontend JavaScript client for the BTQ Dashboard API
 */

class DashboardAPI {
    constructor(baseURL = '/api/dashboard', authToken = null) {
        this.baseURL = baseURL;
        this.authToken = authToken;
    }

    /**
     * Set authentication token
     */
    setAuthToken(token) {
        this.authToken = token;
    }

    /**
     * Make authenticated request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    /**
     * Get teacher dashboard data
     */
    async getTeacherDashboard(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/teacher?${params}`);
    }

    /**
     * Get coordinator dashboard data
     */
    async getCoordinatorDashboard(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/coordinator?${params}`);
    }

    /**
     * Get teacher metrics (for coordinator)
     */
    async getTeacherMetrics(teacherId, filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/teacher/${teacherId}/metrics?${params}`);
    }

    /**
     * Get dashboard summary
     */
    async getDashboardSummary(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/summary?${params}`);
    }

    /**
     * Get business day status
     */
    async getBusinessDayStatus() {
        return this.request('/business-day-status');
    }

    /**
     * Clear dashboard cache
     */
    async clearCache(pattern = null) {
        const body = pattern ? JSON.stringify({ pattern }) : undefined;
        return this.request('/cache', {
            method: 'DELETE',
            body
        });
    }
}

/**
 * Chart.js helper functions
 */
class DashboardCharts {
    /**
     * Create line chart for daily activity
     */
    static createDailyActivityChart(ctx, chartData) {
        return new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    /**
     * Create pie chart for jilid distribution
     */
    static createJilidDistributionChart(ctx, data) {
        const chartData = {
            labels: data.map(item => item.label),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                ]
            }]
        };

        return new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Create bar chart for promotion statistics
     */
    static createPromotionChart(ctx, chartData) {
        return new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * Create horizontal bar chart for teacher ranking
     */
    static createTeacherRankingChart(ctx, teachers) {
        const chartData = {
            labels: teachers.map(t => t.teacher_name),
            datasets: [{
                label: 'Total Aktivitas',
                data: teachers.map(t => t.total_activities),
                backgroundColor: '#3b82f6'
            }]
        };

        return new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

/**
 * Dashboard utilities
 */
class DashboardUtils {
    /**
     * Format date for API filters
     */
    static formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Get date range filter for last N days
     */
    static getLastDaysFilter(days) {
        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(today.getDate() - days);

        return {
            date_from: this.formatDate(fromDate),
            date_to: this.formatDate(today)
        };
    }

    /**
     * Format number with thousand separator
     */
    static formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }

    /**
     * Format date for display
     */
    static formatDisplayDate(dateString) {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(new Date(dateString));
    }

    /**
     * Check if user has required role
     */
    static hasRole(user, requiredRoles) {
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(user.role);
        }
        return user.role === requiredRoles;
    }

    /**
     * Show loading state
     */
    static showLoading(element) {
        element.innerHTML = '<div class="spinner">Loading...</div>';
    }

    /**
     * Show error message
     */
    static showError(element, message) {
        element.innerHTML = `<div class="error">Error: ${message}</div>`;
    }
}

/**
 * Usage example
 */
async function initializeTeacherDashboard() {
    const api = new DashboardAPI();
    api.setAuthToken(localStorage.getItem('auth_token'));

    try {
        // Show loading
        const dashboardContainer = document.getElementById('dashboard-container');
        DashboardUtils.showLoading(dashboardContainer);

        // Get dashboard data
        const filters = DashboardUtils.getLastDaysFilter(30);
        const response = await api.getTeacherDashboard(filters);
        const { data } = response;

        // Update UI with data
        updateDashboardStats(data);
        
        // Create charts
        if (data.daily_activity.chart_data) {
            const activityCtx = document.getElementById('activity-chart').getContext('2d');
            DashboardCharts.createDailyActivityChart(activityCtx, data.daily_activity.chart_data);
        }

        if (data.jilid_distribution) {
            const jilidCtx = document.getElementById('jilid-chart').getContext('2d');
            DashboardCharts.createJilidDistributionChart(jilidCtx, data.jilid_distribution);
        }

        if (data.promotion_stats.chart_data) {
            const promotionCtx = document.getElementById('promotion-chart').getContext('2d');
            DashboardCharts.createPromotionChart(promotionCtx, data.promotion_stats.chart_data);
        }

    } catch (error) {
        console.error('Dashboard error:', error);
        DashboardUtils.showError(dashboardContainer, error.message);
    }
}

function updateDashboardStats(data) {
    // Update stat cards
    document.getElementById('pages-today').textContent = DashboardUtils.formatNumber(data.pages_read_today);
    document.getElementById('total-students').textContent = DashboardUtils.formatNumber(data.group_info.student_count);
    document.getElementById('ready-promotions').textContent = DashboardUtils.formatNumber(data.students_ready_for_promotion.length);
    
    // Update student list
    const studentsList = document.getElementById('students-ready-list');
    studentsList.innerHTML = data.students_ready_for_promotion
        .map(student => `
            <div class="student-item">
                <span class="student-name">${student.nama_lengkap}</span>
                <span class="student-jilid">Jilid ${student.jilid}</span>
                <span class="student-activity">${student.activity_count} aktivitas</span>
            </div>
        `).join('');
}

// Auto-refresh dashboard every 5 minutes
setInterval(() => {
    if (document.visibilityState === 'visible') {
        initializeTeacherDashboard();
    }
}, 5 * 60 * 1000);

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardAPI, DashboardCharts, DashboardUtils };
}