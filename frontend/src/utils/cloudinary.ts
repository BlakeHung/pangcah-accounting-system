// Cloudinary 設定和上傳功能
interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

// 從環境變數讀取設定（需要在 .env 設定）
const config: CloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset',
  folder: 'pangcah-accounting'
};

export interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  thumbnail_url?: string;
}

/**
 * 上傳單一圖片到 Cloudinary
 * @param file - 要上傳的檔案
 * @param onProgress - 上傳進度回調
 * @returns 上傳結果
 */
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', config.folder);
  
  // 加入自動優化參數（使用正確的格式）
  formData.append('quality', 'auto');
  formData.append('fetch_format', 'auto');
  formData.append('width', '2000');
  formData.append('crop', 'limit');

  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    // 監聽上傳進度
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        // 生成縮圖 URL
        response.thumbnail_url = response.secure_url.replace(
          '/upload/',
          '/upload/w_200,h_200,c_thumb,g_auto/'
        );
        resolve(response);
      } else {
        reject(new Error(`上傳失敗: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('網路錯誤'));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`);
    xhr.send(formData);
  });
};

/**
 * 批次上傳多個圖片
 * @param files - 檔案陣列
 * @param onProgress - 整體進度回調
 * @returns 上傳結果陣列
 */
export const uploadMultipleImages = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<UploadResponse[]> => {
  const results: UploadResponse[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImage(files[i]);
      results.push(result);
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`檔案 ${files[i].name} 上傳失敗:`, error);
      throw error;
    }
  }
  
  return results;
};

/**
 * 刪除 Cloudinary 上的圖片（需要後端 API 支援）
 * @param publicId - 圖片的 public_id
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  // 這個功能需要使用 API Secret，必須透過後端實作
  // 前端只能發送請求到後端 API
  const response = await fetch('/api/v1/cloudinary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify({ public_id: publicId })
  });

  if (!response.ok) {
    throw new Error('刪除圖片失敗');
  }
};

/**
 * 取得優化後的圖片 URL
 * @param url - 原始 Cloudinary URL
 * @param options - 轉換選項
 */
export const getOptimizedUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  let transformation = `/upload/q_${quality},f_${format}`;
  if (width) transformation += `,w_${width}`;
  if (height) transformation += `,h_${height}`;
  
  return url.replace('/upload/', `${transformation}/`);
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getOptimizedUrl,
  config
};