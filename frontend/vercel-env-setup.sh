#!/bin/bash
# Vercel 環境變數設定腳本

echo "設定 Vercel 環境變數..."

# 設定 Production 環境變數
vercel env add VITE_CLOUDINARY_CLOUD_NAME production
# 輸入: dfaittd9e

vercel env add VITE_CLOUDINARY_UPLOAD_PRESET production  
# 輸入: pangcah_unsigned

vercel env add VITE_API_URL production
# 輸入: https://your-backend-domain.com

echo "環境變數設定完成！"
echo "請執行 'vercel --prod' 重新部署"