"""
用戶視圖
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserPreferences
from .serializers import UserSerializer, UserDetailSerializer, UserCreateSerializer, LoginSerializer, UserPreferencesSerializer


class UserViewSet(viewsets.ModelViewSet):
    """用戶管理視圖集"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer
    
    def get_permissions(self):
        """根據動作設置權限"""
        if self.action == 'login':
            return [permissions.AllowAny()]
        elif self.action == 'create':
            return [permissions.IsAuthenticated()]  # 只有登入用戶可以創建用戶
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """用戶登入"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """獲取/更新當前用戶資訊"""
        if not request.user.is_authenticated:
            return Response({'error': '未登入'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.method == 'GET':
            return Response(UserDetailSerializer(request.user).data)
        elif request.method == 'PATCH':
            # 檢查是否要更新密碼
            if 'new_password' in request.data:
                current_password = request.data.get('current_password')
                new_password = request.data.get('new_password')
                
                # 驗證當前密碼
                if not current_password:
                    return Response(
                        {'error': '請提供當前密碼'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if not request.user.check_password(current_password):
                    return Response(
                        {'error': '當前密碼不正確'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # 更新密碼
                request.user.set_password(new_password)
                request.user.save()
                
                # 移除密碼相關欄位，繼續更新其他資料
                data = request.data.copy()
                data.pop('current_password', None)
                data.pop('new_password', None)
            else:
                data = request.data
            
            # 更新其他用戶資訊
            serializer = UserSerializer(request.user, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'patch'], url_path='me/preferences')
    def preferences(self, request):
        """獲取/更新當前用戶偏好設定"""
        if not request.user.is_authenticated:
            return Response({'error': '未登入'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 獲取或創建用戶偏好設定
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user,
            defaults={
                'theme': 'light',
                'currency': 'TWD',
                'notifications': True
            }
        )
        
        if request.method == 'GET':
            return Response(UserPreferencesSerializer(preferences).data)
        elif request.method == 'PATCH':
            serializer = UserPreferencesSerializer(preferences, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)