"""
群組視圖
"""

from rest_framework import viewsets, permissions
from .models import Group
from .serializers import GroupSerializer, GroupCreateUpdateSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """群組管理視圖集"""
    queryset = Group.objects.prefetch_related('managers', 'members__user').all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupCreateUpdateSerializer
        return GroupSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)