/**
 * 处理图片URL，添加基础URL前缀
 * @param {string} imagePath - 图片路径
 * @returns {string} 完整的图片URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // 如果已经是完整的URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 添加基础URL
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
  return `${baseUrl}${imagePath}`;
};

/**
 * 批量处理图片URL数组
 * @param {Array} images - 图片数组
 * @returns {Array} 处理后的图片数组
 */
export const processImageUrls = (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.map(img => ({
    ...img,
    imagePath: getFullImageUrl(img.imagePath)
  }));
};
