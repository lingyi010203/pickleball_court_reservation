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
 * 檢查日期是否有效
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否有效
 */
export const isValidDate = (date) => {
  if (!date) return false;
  
  try {
    const d = new Date(date);
    return !isNaN(d.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * 檢查日期是否過期
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否過期
 */
export const isExpired = (date) => {
  if (!date) return false;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;
    
    return d < new Date();
  } catch (error) {
    return false;
  }
};

// 日期處理工具函數

/**
 * 格式化voucher過期日期
 * @param {string|Date|null} expiryDate - 過期日期
 * @returns {string} 格式化後的日期字符串
 */
export const formatVoucherExpiryDate = (expiryDate) => {
  if (!expiryDate) {
    return 'No expiry';
  }

  try {
    // 如果是字符串，嘗試解析
    let date;
    if (typeof expiryDate === 'string') {
      // 處理不同的日期格式
      if (expiryDate.includes('-')) {
        // 標準日期格式 yyyy-MM-dd 或 dd-MM-yyyy
        const parts = expiryDate.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // yyyy-MM-dd 格式
            date = new Date(expiryDate);
          } else {
            // dd-MM-yyyy 格式，轉換為 yyyy-MM-dd
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else {
          date = new Date(expiryDate);
        }
      } else {
        date = new Date(expiryDate);
      }
    } else {
      date = new Date(expiryDate);
    }

    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
      return 'No expiry';
    }

    // 檢查是否為1970-01-01（默認日期）
    if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
      return 'No expiry';
    }

    // 格式化日期
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  } catch (error) {
    console.error('Error formatting date:', error);
    return 'No expiry';
  }
}; 