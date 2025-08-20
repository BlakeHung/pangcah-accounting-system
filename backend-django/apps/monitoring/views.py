"""
監控管理視圖
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, Avg, Max, Min
from datetime import datetime, timedelta
import psutil
import json

from .models import SystemMetric, UserActivity, APIMetric, Alert, PerformanceBaseline
from .serializers import (
    SystemMetricSerializer, UserActivitySerializer, APIMetricSerializer,
    AlertSerializer, PerformanceBaselineSerializer, SystemHealthSerializer,
    ActivitySummarySerializer, APIUsageSerializer, AlertSummarySerializer,
    PerformanceTrendSerializer, UserBehaviorSerializer, SimpleAlertSerializer
)


class SystemMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """系統指標監控"""
    serializer_class = SystemMetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SystemMetric.objects.all()
        
        # 篩選指標類型
        metric_type = self.request.query_params.get('metric_type')
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        # 篩選時間範圍
        start_time = self.request.query_params.get('start_time')
        end_time = self.request.query_params.get('end_time')
        
        if start_time:
            queryset = queryset.filter(timestamp__gte=start_time)
        if end_time:
            queryset = queryset.filter(timestamp__lte=end_time)
        
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def current_health(self, request):
        """取得當前系統健康狀態"""
        try:
            # 取得系統資源使用情況
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # 模擬資料庫連線數（實際環境中應從資料庫取得）
            db_connections = 10
            
            # 計算活躍用戶數（最近15分鐘有活動的用戶）
            fifteen_minutes_ago = timezone.now() - timedelta(minutes=15)
            active_users = UserActivity.objects.filter(
                timestamp__gte=fifteen_minutes_ago
            ).values('user').distinct().count()
            
            # 判斷系統狀態
            if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
                status_value = 'critical'
            elif cpu_percent > 70 or memory.percent > 70 or disk.percent > 80:
                status_value = 'warning'
            else:
                status_value = 'healthy'
            
            health_data = {
                'cpu_usage': cpu_percent,
                'memory_usage': memory.percent,
                'disk_usage': disk.percent,
                'database_connections': db_connections,
                'active_users': active_users,
                'status': status_value,
                'last_updated': timezone.now()
            }
            
            serializer = SystemHealthSerializer(health_data)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'無法取得系統健康狀態: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def metrics_trend(self, request):
        """取得指標趨勢資料"""
        metric_type = request.query_params.get('metric_type', 'cpu_usage')
        days = int(request.query_params.get('days', 7))
        
        start_date = timezone.now() - timedelta(days=days)
        
        metrics = SystemMetric.objects.filter(
            metric_type=metric_type,
            timestamp__gte=start_date
        ).values('timestamp', 'value').order_by('timestamp')
        
        # 取得基準線
        try:
            baseline = PerformanceBaseline.objects.filter(
                metric_name=metric_type,
                is_active=True
            ).latest('updated_at')
            baseline_value = baseline.baseline_value
        except PerformanceBaseline.DoesNotExist:
            baseline_value = None
        
        trend_data = []
        for metric in metrics:
            deviation = None
            if baseline_value:
                deviation = ((metric['value'] - baseline_value) / baseline_value) * 100
            
            trend_data.append({
                'metric_name': metric_type,
                'timestamp': metric['timestamp'],
                'value': metric['value'],
                'baseline_value': baseline_value,
                'deviation_percentage': deviation
            })
        
        serializer = PerformanceTrendSerializer(trend_data, many=True)
        return Response(serializer.data)


class UserActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """用戶活動監控"""
    serializer_class = UserActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = UserActivity.objects.all()
        
        # 篩選用戶
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # 篩選操作類型
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # 篩選時間範圍
        start_time = self.request.query_params.get('start_time')
        end_time = self.request.query_params.get('end_time')
        
        if start_time:
            queryset = queryset.filter(timestamp__gte=start_time)
        if end_time:
            queryset = queryset.filter(timestamp__lte=end_time)
        
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """每日活動摘要"""
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now().date() - timedelta(days=days-1)
        
        summary_data = []
        
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            next_date = current_date + timedelta(days=1)
            
            # 統計當日活動
            daily_activities = UserActivity.objects.filter(
                timestamp__date=current_date
            )
            
            total_users = daily_activities.values('user').distinct().count()
            active_users = daily_activities.filter(action='login').values('user').distinct().count()
            total_actions = daily_activities.count()
            login_count = daily_activities.filter(action='login').count()
            expense_actions = daily_activities.filter(action__contains='expense').count()
            event_actions = daily_activities.filter(action__contains='event').count()
            
            summary_data.append({
                'date': current_date,
                'total_users': total_users,
                'active_users': active_users,
                'total_actions': total_actions,
                'login_count': login_count,
                'expense_actions': expense_actions,
                'event_actions': event_actions
            })
        
        serializer = ActivitySummarySerializer(summary_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def user_behavior(self, request):
        """用戶行為分析"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # 分析用戶行為
        user_behavior = UserActivity.objects.filter(
            timestamp__gte=start_date
        ).values('user', 'user__name').annotate(
            session_count=Count('id'),
            actions=Count('action')
        ).order_by('-actions')[:20]  # 取前20名活躍用戶
        
        behavior_data = []
        for user_data in user_behavior:
            # 計算最常用功能
            user_actions = UserActivity.objects.filter(
                user_id=user_data['user'],
                timestamp__gte=start_date
            ).values('action').annotate(count=Count('action')).order_by('-count')[:3]
            
            most_used_features = [action['action'] for action in user_actions]
            
            # 最後活動時間
            last_activity = UserActivity.objects.filter(
                user_id=user_data['user']
            ).order_by('-timestamp').first()
            
            # 活動評分（基於操作頻率）
            activity_score = min(user_data['actions'] / 10.0, 10.0)  # 最高10分
            
            behavior_data.append({
                'user_id': user_data['user'],
                'user_name': user_data['user__name'],
                'total_sessions': user_data['session_count'],
                'avg_session_duration': 30.0,  # 模擬數據
                'most_used_features': most_used_features,
                'last_activity': last_activity.timestamp if last_activity else None,
                'activity_score': activity_score
            })
        
        serializer = UserBehaviorSerializer(behavior_data, many=True)
        return Response(serializer.data)


class APIMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """API 指標監控"""
    serializer_class = APIMetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = APIMetric.objects.all()
        
        # 篩選路徑
        path = self.request.query_params.get('path')
        if path:
            queryset = queryset.filter(path__icontains=path)
        
        # 篩選狀態碼
        status_code = self.request.query_params.get('status_code')
        if status_code:
            queryset = queryset.filter(status_code=status_code)
        
        # 篩選時間範圍
        start_time = self.request.query_params.get('start_time')
        end_time = self.request.query_params.get('end_time')
        
        if start_time:
            queryset = queryset.filter(timestamp__gte=start_time)
        if end_time:
            queryset = queryset.filter(timestamp__lte=end_time)
        
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def usage_stats(self, request):
        """API 使用統計"""
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        # 統計各 API 端點的使用情況
        usage_stats = APIMetric.objects.filter(
            timestamp__gte=start_date
        ).values('path', 'method').annotate(
            total_calls=Count('id'),
            avg_response_time=Avg('response_time'),
            error_count=Count('id', filter=Q(status_code__gte=400)),
            last_called=Max('timestamp')
        ).order_by('-total_calls')[:20]  # 取前20個最常用的端點
        
        api_usage_data = []
        for stat in usage_stats:
            error_rate = (stat['error_count'] / stat['total_calls']) * 100 if stat['total_calls'] > 0 else 0
            
            api_usage_data.append({
                'path': stat['path'],
                'method': stat['method'],
                'total_calls': stat['total_calls'],
                'avg_response_time': round(stat['avg_response_time'], 2),
                'error_rate': round(error_rate, 2),
                'last_called': stat['last_called']
            })
        
        serializer = APIUsageSerializer(api_usage_data, many=True)
        return Response(serializer.data)


class AlertViewSet(viewsets.ModelViewSet):
    """系統告警管理"""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Alert.objects.all()
        
        # 篩選狀態
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 篩選嚴重程度
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """確認告警"""
        alert = self.get_object()
        alert.acknowledge(request.user)
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """解決告警"""
        alert = self.get_object()
        notes = request.data.get('notes', '')
        alert.resolve(request.user, notes)
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """告警摘要"""
        today = timezone.now().date()
        
        total_alerts = Alert.objects.count()
        active_alerts = Alert.objects.filter(status='active').count()
        critical_alerts = Alert.objects.filter(
            severity='critical', 
            status__in=['active', 'acknowledged']
        ).count()
        warning_alerts = Alert.objects.filter(
            severity='warning', 
            status__in=['active', 'acknowledged']
        ).count()
        resolved_today = Alert.objects.filter(
            resolved_at__date=today
        ).count()
        
        summary_data = {
            'total_alerts': total_alerts,
            'active_alerts': active_alerts,
            'critical_alerts': critical_alerts,
            'warning_alerts': warning_alerts,
            'resolved_today': resolved_today
        }
        
        serializer = AlertSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """最近的告警（用於儀表板）"""
        recent_alerts = Alert.objects.filter(
            status__in=['active', 'acknowledged']
        ).order_by('-created_at')[:10]
        
        serializer = SimpleAlertSerializer(recent_alerts, many=True)
        return Response(serializer.data)


class PerformanceBaselineViewSet(viewsets.ModelViewSet):
    """效能基準線管理"""
    serializer_class = PerformanceBaselineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PerformanceBaseline.objects.filter(
            is_active=True
        ).order_by('-updated_at')

    @action(detail=False, methods=['post'])
    def calculate_baseline(self, request):
        """計算效能基準線"""
        metric_name = request.data.get('metric_name')
        days = request.data.get('days', 30)
        
        if not metric_name:
            return Response(
                {'error': '必須指定指標名稱'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 計算統計期間
        end_time = timezone.now()
        start_time = end_time - timedelta(days=days)
        
        # 取得指標資料
        metrics = SystemMetric.objects.filter(
            metric_type=metric_name,
            timestamp__range=[start_time, end_time]
        ).values('value')
        
        if not metrics.exists():
            return Response(
                {'error': '找不到指標資料'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 計算統計值
        values = [m['value'] for m in metrics]
        
        import statistics
        baseline_value = statistics.median(values)  # 使用中位數作為基準值
        min_value = min(values)
        max_value = max(values)
        avg_value = statistics.mean(values)
        std_deviation = statistics.stdev(values) if len(values) > 1 else 0
        
        # 計算告警閾值
        warning_threshold = baseline_value + (2 * std_deviation)
        error_threshold = baseline_value + (3 * std_deviation)
        
        # 停用舊的基準線
        PerformanceBaseline.objects.filter(
            metric_name=metric_name,
            is_active=True
        ).update(is_active=False)
        
        # 建立新的基準線
        baseline = PerformanceBaseline.objects.create(
            metric_name=metric_name,
            baseline_value=baseline_value,
            min_value=min_value,
            max_value=max_value,
            avg_value=avg_value,
            std_deviation=std_deviation,
            period_start=start_time,
            period_end=end_time,
            sample_count=len(values),
            warning_threshold=warning_threshold,
            error_threshold=error_threshold
        )
        
        serializer = self.get_serializer(baseline)
        return Response(serializer.data, status=status.HTTP_201_CREATED)