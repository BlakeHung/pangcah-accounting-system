"""
用戶序列化器
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserPreferences


class UserSerializer(serializers.ModelSerializer):
    """用戶序列化器"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'role', 'image', 
            'is_active', 'date_joined', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at']


class UserDetailSerializer(serializers.ModelSerializer):
    """用戶詳情序列化器（包含群組信息）"""
    managed_groups = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'role', 'image', 
            'is_active', 'date_joined', 'last_login', 'created_at', 'updated_at',
            'managed_groups', 'groups'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at']
    
    def get_managed_groups(self, obj):
        """獲取用戶管理的群組"""
        from apps.groups.models import Group
        managed_groups = Group.objects.filter(managers=obj)
        return [{'id': g.id, 'name': g.name, 'description': g.description} for g in managed_groups]
    
    def get_groups(self, obj):
        """獲取用戶參與的群組"""
        from apps.groups.models import GroupMember
        group_members = GroupMember.objects.filter(user=obj).select_related('group')
        return [{'id': gm.group.id, 'name': gm.group.name, 'description': gm.group.description} 
                for gm in group_members]


class UserCreateSerializer(serializers.ModelSerializer):
    """用戶創建序列化器"""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'name', 'role', 'password', 'is_active']
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """登入序列化器"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('用戶名或密碼錯誤')
            if not user.is_active:
                raise serializers.ValidationError('用戶帳戶已被停用')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('必須提供用戶名和密碼')
            
        return attrs


class UserPreferencesSerializer(serializers.ModelSerializer):
    """用戶偏好設定序列化器"""
    
    class Meta:
        model = UserPreferences
        fields = ['theme', 'currency', 'notifications', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']