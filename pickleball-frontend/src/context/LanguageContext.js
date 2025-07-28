import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// 翻译数据
const translations = {
  en: {
    // Admin Settings
    'settings.profile': 'Profile',
    'settings.changePassword': 'Change Password',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.dangerZone': 'Danger Zone',
    'settings.deleteAccount': 'Delete Account',
    'settings.deleteAccountWarning': 'Once you delete your account, there is no going back. Please be certain.',
    'settings.confirmDelete': 'This action cannot be undone.',
    'settings.deleteAccountDescription': 'This will permanently delete your admin account and remove all associated data. You will lose access to all admin privileges and cannot recover this account.',
    'settings.typeDeleteToConfirm': 'To confirm deletion, please type DELETE in the box below:',
    'settings.typeDeletePlaceholder': 'Type DELETE to confirm',
    'settings.passwordsDoNotMatch': 'Please type DELETE exactly',
    'settings.cancel': 'Cancel',
    'settings.deleting': 'Deleting...',
    'settings.save': 'Save',
    'settings.changePassword': 'Change Password',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmNewPassword': 'Confirm New Password',
    'settings.passwordRequirements': 'Password Requirements:',
    'settings.min8Characters': 'At least 8 characters',
    'settings.uppercaseLetter': 'At least one uppercase letter',
    'settings.lowercaseLetter': 'At least one lowercase letter',
    'settings.number': 'At least one number',
    'settings.specialCharacter': 'At least one special character',
    'settings.passwordStrength': 'Password Strength:',
    'settings.weak': 'Weak',
    'settings.fair': 'Fair',
    'settings.good': 'Good',
    'settings.strong': 'Strong',
    'settings.uploadAvatar': 'Upload Avatar',
    'settings.changeAvatar': 'Change Avatar',
    'settings.clickAvatarToUpload': 'Click avatar or button to upload',
    'settings.name': 'Name',
    'settings.email': 'Email',
    'settings.phone': 'Phone',
    'settings.lightMode': 'Light Mode',
    'settings.darkMode': 'Dark Mode',
    'settings.themeDescription': 'Theme switching is instant and will be remembered.',
    'settings.selectLanguage': 'Select Language',
    'settings.languageDescription': 'Choose your preferred language for the admin interface.',
    'settings.currentLanguage': 'Current Language:',
    'settings.languageSaved': 'Language changes will be applied immediately and saved for future sessions.',
    'settings.profileSaved': 'Profile saved!',
    'settings.passwordChanged': 'Password changed!',
    'settings.failedToLoadProfile': 'Failed to load profile',
    'settings.failedToSaveProfile': 'Failed to save profile',
    'settings.failedToUploadAvatar': 'Failed to upload avatar',
    'settings.failedToRemoveAvatar': 'Failed to remove avatar',
    'settings.failedToDeleteAccount': 'Failed to delete account',
    'settings.currentPasswordRequired': 'Current password is required',
    'settings.newPasswordRequired': 'New password is required',
    'settings.confirmPasswordRequired': 'Please confirm your new password',
    'settings.passwordsDoNotMatch': 'New passwords do not match',
    'settings.passwordRequirementsNotMet': 'Password requirements not met:',
    'settings.failedToChangePassword': 'Failed to change password',
    'settings.minimum8Characters': 'Minimum 8 characters',
    'settings.requiresUppercase': 'Requires uppercase letter',
    'settings.requiresLowercase': 'Requires lowercase letter',
    'settings.requiresNumber': 'Requires number',
    'settings.requiresSpecialCharacter': 'Requires special character'
  },
  ms: {
    // Admin Settings
    'settings.profile': 'Profil',
    'settings.changePassword': 'Tukar Kata Laluan',
    'settings.theme': 'Tema',
    'settings.language': 'Bahasa',
    'settings.dangerZone': 'Zon Bahaya',
    'settings.deleteAccount': 'Padam Akaun',
    'settings.deleteAccountWarning': 'Setelah anda memadamkan akaun anda, tidak ada jalan kembali. Sila pastikan.',
    'settings.confirmDelete': 'Tindakan ini tidak dapat dibatalkan.',
    'settings.deleteAccountDescription': 'Ini akan memadamkan akaun admin anda secara kekal dan membuang semua data yang berkaitan. Anda akan kehilangan akses kepada semua keistimewaan admin dan tidak dapat memulihkan akaun ini.',
    'settings.typeDeleteToConfirm': 'Untuk mengesahkan pemadaman, sila taip DELETE dalam kotak di bawah:',
    'settings.typeDeletePlaceholder': 'Taip DELETE untuk mengesahkan',
    'settings.passwordsDoNotMatch': 'Sila taip DELETE dengan tepat',
    'settings.cancel': 'Batal',
    'settings.deleting': 'Memadam...',
    'settings.save': 'Simpan',
    'settings.changePassword': 'Tukar Kata Laluan',
    'settings.currentPassword': 'Kata Laluan Semasa',
    'settings.newPassword': 'Kata Laluan Baharu',
    'settings.confirmNewPassword': 'Sahkan Kata Laluan Baharu',
    'settings.passwordRequirements': 'Keperluan Kata Laluan:',
    'settings.min8Characters': 'Sekurang-kurangnya 8 aksara',
    'settings.uppercaseLetter': 'Sekurang-kurangnya satu huruf besar',
    'settings.lowercaseLetter': 'Sekurang-kurangnya satu huruf kecil',
    'settings.number': 'Sekurang-kurangnya satu nombor',
    'settings.specialCharacter': 'Sekurang-kurangnya satu aksara khas',
    'settings.passwordStrength': 'Kekuatan Kata Laluan:',
    'settings.weak': 'Lemah',
    'settings.fair': 'Sederhana',
    'settings.good': 'Baik',
    'settings.strong': 'Kuat',
    'settings.uploadAvatar': 'Muat Naik Avatar',
    'settings.changeAvatar': 'Tukar Avatar',
    'settings.clickAvatarToUpload': 'Klik avatar atau butang untuk memuat naik',
    'settings.name': 'Nama',
    'settings.email': 'E-mel',
    'settings.phone': 'Telefon',
    'settings.lightMode': 'Mod Cerah',
    'settings.darkMode': 'Mod Gelap',
    'settings.themeDescription': 'Pertukaran tema adalah serta-merta dan akan diingati.',
    'settings.selectLanguage': 'Pilih Bahasa',
    'settings.languageDescription': 'Pilih bahasa pilihan anda untuk antara muka admin.',
    'settings.currentLanguage': 'Bahasa Semasa:',
    'settings.languageSaved': 'Perubahan bahasa akan digunakan serta-merta dan disimpan untuk sesi akan datang.',
    'settings.profileSaved': 'Profil disimpan!',
    'settings.passwordChanged': 'Kata laluan ditukar!',
    'settings.failedToLoadProfile': 'Gagal memuatkan profil',
    'settings.failedToSaveProfile': 'Gagal menyimpan profil',
    'settings.failedToUploadAvatar': 'Gagal memuat naik avatar',
    'settings.failedToRemoveAvatar': 'Gagal membuang avatar',
    'settings.failedToDeleteAccount': 'Gagal memadamkan akaun',
    'settings.currentPasswordRequired': 'Kata laluan semasa diperlukan',
    'settings.newPasswordRequired': 'Kata laluan baharu diperlukan',
    'settings.confirmPasswordRequired': 'Sila sahkan kata laluan baharu anda',
    'settings.passwordsDoNotMatch': 'Kata laluan baharu tidak sepadan',
    'settings.passwordRequirementsNotMet': 'Keperluan kata laluan tidak dipenuhi:',
    'settings.failedToChangePassword': 'Gagal menukar kata laluan',
    'settings.minimum8Characters': 'Sekurang-kurangnya 8 aksara',
    'settings.requiresUppercase': 'Memerlukan huruf besar',
    'settings.requiresLowercase': 'Memerlukan huruf kecil',
    'settings.requiresNumber': 'Memerlukan nombor',
    'settings.requiresSpecialCharacter': 'Memerlukan aksara khas'
  },
  zh: {
    // Admin Settings
    'settings.profile': '个人资料',
    'settings.changePassword': '修改密码',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.dangerZone': '危险区域',
    'settings.deleteAccount': '删除账户',
    'settings.deleteAccountWarning': '删除账户后无法恢复，请谨慎操作。',
    'settings.confirmDelete': '此操作无法撤销。',
    'settings.deleteAccountDescription': '这将永久删除您的管理员账户并移除所有相关数据。您将失去所有管理员权限且无法恢复此账户。',
    'settings.typeDeleteToConfirm': '要确认删除，请在下方框中输入DELETE：',
    'settings.typeDeletePlaceholder': '输入DELETE确认',
    'settings.passwordsDoNotMatch': '请输入正确的DELETE',
    'settings.cancel': '取消',
    'settings.deleting': '删除中...',
    'settings.save': '保存',
    'settings.changePassword': '修改密码',
    'settings.currentPassword': '当前密码',
    'settings.newPassword': '新密码',
    'settings.confirmNewPassword': '确认新密码',
    'settings.passwordRequirements': '密码要求：',
    'settings.min8Characters': '至少8个字符',
    'settings.uppercaseLetter': '至少一个大写字母',
    'settings.lowercaseLetter': '至少一个小写字母',
    'settings.number': '至少一个数字',
    'settings.specialCharacter': '至少一个特殊字符',
    'settings.passwordStrength': '密码强度：',
    'settings.weak': '弱',
    'settings.fair': '一般',
    'settings.good': '良好',
    'settings.strong': '强',
    'settings.uploadAvatar': '上传头像',
    'settings.changeAvatar': '更换头像',
    'settings.clickAvatarToUpload': '点击头像或按钮上传',
    'settings.name': '姓名',
    'settings.email': '邮箱',
    'settings.phone': '电话',
    'settings.lightMode': '浅色模式',
    'settings.darkMode': '深色模式',
    'settings.themeDescription': '主题切换即时生效并会被记住。',
    'settings.selectLanguage': '选择语言',
    'settings.languageDescription': '选择您偏好的管理员界面语言。',
    'settings.currentLanguage': '当前语言：',
    'settings.languageSaved': '语言更改将立即生效并保存供将来使用。',
    'settings.profileSaved': '个人资料已保存！',
    'settings.passwordChanged': '密码已修改！',
    'settings.failedToLoadProfile': '加载个人资料失败',
    'settings.failedToSaveProfile': '保存个人资料失败',
    'settings.failedToUploadAvatar': '上传头像失败',
    'settings.failedToRemoveAvatar': '删除头像失败',
    'settings.failedToDeleteAccount': '删除账户失败',
    'settings.currentPasswordRequired': '需要当前密码',
    'settings.newPasswordRequired': '需要新密码',
    'settings.confirmPasswordRequired': '请确认您的新密码',
    'settings.passwordsDoNotMatch': '新密码不匹配',
    'settings.passwordRequirementsNotMet': '密码要求未满足：',
    'settings.failedToChangePassword': '修改密码失败',
    'settings.minimum8Characters': '至少8个字符',
    'settings.requiresUppercase': '需要大写字母',
    'settings.requiresLowercase': '需要小写字母',
    'settings.requiresNumber': '需要数字',
    'settings.requiresSpecialCharacter': '需要特殊字符'
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // 从localStorage加载保存的语言设置
    const savedLanguage = localStorage.getItem('adminLanguage');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = useCallback((newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      localStorage.setItem('adminLanguage', newLanguage);
    }
  }, []);

  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    changeLanguage,
    t,
    translations
  }), [language, changeLanguage, t, translations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 