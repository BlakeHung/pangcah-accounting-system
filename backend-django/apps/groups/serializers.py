"""
群組序列化器
"""

from rest_framework import serializers
from .models import Group, GroupMember


class GroupSerializer(serializers.ModelSerializer):
    """群組序列化器"""
    managers = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'created_by', 'managers', 'members', 'member_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_managers(self, obj):
        """獲取管理者資訊"""
        return [{'id': m.id, 'name': m.name, 'username': m.username} for m in obj.managers.all()]
    
    def get_members(self, obj):
        """獲取成員資訊"""
        members_data = []
        for member in obj.members.all():
            member_data = {
                'id': member.id,
                'name': member.name,
                'is_system_user': member.is_system_user
            }
            if member.user:
                member_data['user'] = {
                    'id': member.user.id,
                    'username': member.user.username,
                    'name': member.user.name
                }
            members_data.append(member_data)
        return members_data
    
    def get_member_count(self, obj):
        """獲取成員數量"""
        return obj.members.count()


class GroupCreateUpdateSerializer(serializers.ModelSerializer):
    """群組創建和更新序列化器"""
    
    class Meta:
        model = Group
        fields = ['name', 'description', 'managers']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.users.models import User
        # 只允許選擇一般用戶作為管理者
        self.fields['managers'] = serializers.PrimaryKeyRelatedField(
            many=True, 
            queryset=User.objects.filter(role='USER'),
            required=False
        )
    
    def create(self, validated_data):
        managers_data = validated_data.pop('managers', [])
        group = Group.objects.create(**validated_data)
        if managers_data:
            group.managers.set(managers_data)
        return group
    
    def update(self, instance, validated_data):
        managers_data = validated_data.pop('managers', None)
        
        # 更新基本字段
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 更新管理者
        if managers_data is not None:
            instance.managers.set(managers_data)
        
        return instance


class GroupMemberSerializer(serializers.ModelSerializer):
    """群組成員序列化器"""
    
    class Meta:
        model = GroupMember
        fields = ['id', 'group', 'name', 'user', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
