// 全局日期格式化工具函数

/**
 * 将日期格式化为 dd-MM-yyyy 格式
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  
  // 如果已经是 dd-MM-yyyy 格式，直接返回
  if (typeof dateString === 'string' && dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return dateString;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * 将 dd-MM-yyyy 格式转换为 yyyy-MM-dd 格式（用于HTML date input）
 * @param {string} dateString - dd-MM-yyyy 格式的日期字符串
 * @returns {string} yyyy-MM-dd 格式的日期字符串
 */
export const formatDateForHTMLInput = (dateString) => {
  if (!dateString) return '';
  
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  return dateString;
};

/**
 * 将 yyyy-MM-dd 格式转换为 dd-MM-yyyy 格式
 * @param {string} dateString - yyyy-MM-dd 格式的日期字符串
 * @returns {string} dd-MM-yyyy 格式的日期字符串
 */
export const formatDateFromHTMLInput = (dateString) => {
  if (!dateString) return '';
  
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateString;
};

/**
 * 检查日期是否有效
 * @param {string} dateString - 日期字符串
 * @returns {boolean} 是否为有效日期
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}; 