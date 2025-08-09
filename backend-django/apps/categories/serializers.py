"""
分類序列化器
"""

from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """分類序列化器"""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']