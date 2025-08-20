"""
簡單的測試 WebSocket Consumer
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone


class TestConsumer(AsyncWebsocketConsumer):
    """簡單的測試 Consumer"""
    
    async def connect(self):
        """WebSocket 連線"""
        print("🔌 WebSocket 連接嘗試")
        await self.accept()
        print("✅ WebSocket 連接成功")
        
        # 發送歡迎訊息
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': '測試 WebSocket 連線成功！',
            'timestamp': timezone.now().isoformat(),
            'server': 'Django Channels'
        }))

    async def disconnect(self, close_code):
        """WebSocket 斷線"""
        print(f"🔌 WebSocket 斷線，代碼: {close_code}")

    async def receive(self, text_data):
        """接收訊息"""
        try:
            data = json.loads(text_data)
            print(f"📨 收到訊息: {data}")
            
            # 回送確認訊息
            await self.send(text_data=json.dumps({
                'type': 'message_received',
                'original_message': data,
                'response': '訊息已收到',
                'timestamp': timezone.now().isoformat()
            }))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': '無效的 JSON 格式',
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'處理訊息時發生錯誤: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))