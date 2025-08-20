"""
報表管理視圖
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
import json

from .models import ReportTemplate, ReportConfig, ReportGeneration, ReportShare
from .serializers import (
    ReportTemplateSerializer, ReportConfigSerializer, 
    ReportGenerationSerializer, ReportShareSerializer
)


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """報表模板管理"""
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ReportTemplate.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('category', 'name')

    def perform_create(self, serializer):
        # 只有非系統模板才設定創建者
        if not serializer.validated_data.get('is_system', False):
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()


class ReportConfigViewSet(viewsets.ModelViewSet):
    """報表配置管理"""
    serializer_class = ReportConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportConfig.objects.filter(
            user=self.request.user,
            is_active=True
        ).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """複製報表配置"""
        config = self.get_object()
        new_config = ReportConfig.objects.create(
            user=request.user,
            name=f"{config.name} (副本)",
            description=config.description,
            report_type=config.report_type,
            date_range_preset=config.date_range_preset,
            start_date=config.start_date,
            end_date=config.end_date,
            filters=config.filters,
            group_by=config.group_by,
            metrics=config.metrics,
            chart_config=config.chart_config,
            export_formats=config.export_formats,
            schedule=config.schedule,
            template=config.template
        )
        
        serializer = self.get_serializer(new_config)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """生成報表"""
        config = self.get_object()
        
        # 創建報表生成任務
        generation = ReportGeneration.objects.create(
            user=request.user,
            config=config,
            export_format=request.data.get('export_format', 'JSON'),
            parameters=request.data.get('parameters', {})
        )
        
        # 在實際環境中，這裡會觸發背景任務來生成報表
        # 現在先返回生成任務的資訊
        serializer = ReportGenerationSerializer(generation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReportGenerationViewSet(viewsets.ReadOnlyModelViewSet):
    """報表生成記錄管理"""
    serializer_class = ReportGenerationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ReportGeneration.objects.filter(user=self.request.user)
        
        # 篩選狀態
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 篩選日期範圍
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """下載報表檔案"""
        generation = self.get_object()
        
        if generation.status != 'completed':
            return Response(
                {'error': '報表尚未生成完成'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not generation.file_path:
            return Response(
                {'error': '找不到報表檔案'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 實際環境中這裡會返回檔案下載
        return Response({
            'download_url': f'/api/reports/files/{generation.id}/',
            'file_name': f"report_{generation.id}.{generation.export_format.lower()}",
            'file_size': '0 KB'  # 實際檔案大小
        })

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """分享報表"""
        generation = self.get_object()
        
        if generation.status != 'completed':
            return Response(
                {'error': '報表尚未生成完成'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 檢查是否已有分享設定
        try:
            share_setting = generation.share_setting
            # 更新分享設定
            share_setting.is_public = request.data.get('is_public', False)
            share_setting.expires_at = request.data.get('expires_at')
            share_setting.save()
        except ReportShare.DoesNotExist:
            # 創建新的分享設定
            share_setting = ReportShare.objects.create(
                generation=generation,
                is_public=request.data.get('is_public', False),
                expires_at=request.data.get('expires_at')
            )
            share_setting.generate_share_token()
        
        # 設定允許存取的用戶
        allowed_user_ids = request.data.get('allowed_users', [])
        if allowed_user_ids:
            share_setting.allowed_users.set(allowed_user_ids)
        
        serializer = ReportShareSerializer(share_setting)
        return Response(serializer.data)


class ReportShareViewSet(viewsets.ReadOnlyModelViewSet):
    """報表分享管理"""
    serializer_class = ReportShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportShare.objects.filter(
            generation__user=self.request.user
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """撤銷分享"""
        share_setting = self.get_object()
        share_setting.is_public = False
        share_setting.allowed_users.clear()
        share_setting.save()
        
        return Response({'message': '分享已撤銷'})

    @action(detail=False, methods=['get'])
    def shared_report(self, request):
        """透過分享令牌存取報表"""
        token = request.query_params.get('token')
        if not token:
            return Response(
                {'error': '缺少分享令牌'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            share_setting = ReportShare.objects.get(share_token=token)
        except ReportShare.DoesNotExist:
            return Response(
                {'error': '無效的分享令牌'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 檢查分享是否過期
        if share_setting.expires_at and share_setting.expires_at < timezone.now():
            return Response(
                {'error': '分享連結已過期'}, 
                status=status.HTTP_410_GONE
            )
        
        # 檢查存取權限
        if not share_setting.is_public:
            if request.user.is_anonymous or request.user not in share_setting.allowed_users.all():
                return Response(
                    {'error': '無權存取此報表'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # 更新存取統計
        share_setting.access_count += 1
        share_setting.last_accessed_at = timezone.now()
        share_setting.save(update_fields=['access_count', 'last_accessed_at'])
        
        # 返回報表資料
        generation = share_setting.generation
        serializer = ReportGenerationSerializer(generation)
        return Response(serializer.data)