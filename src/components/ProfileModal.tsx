import React, { useState, useRef } from 'react';
import { X, Save, User, Mail, Lock, Upload, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, updateCurrentUser, boards, tasks } = useApp();
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    patronymic: currentUser?.patronymic || '',
    email: currentUser?.email || '',
    username: currentUser?.username || '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar || null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Валидация имени
  const validateName = (name: string): { isValid: boolean; message: string } => {
    if (name.length < 2) {
      return { isValid: false, message: 'ДОЛЖНО СОДЕРЖАТЬ МИНИМУМ 2 СИМВОЛА' };
    }
    
    if (!/^[a-zA-Zа-яА-Я]+$/.test(name)) {
      return { isValid: false, message: 'ДОЛЖНО СОДЕРЖАТЬ ТОЛЬКО БУКВЫ' };
    }
    
    return { isValid: true, message: '' };
  };

  // Валидация пароля
  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8 || password.length > 30) {
      return { isValid: false, message: 'ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ОТ 8 ДО 30 СИМВОЛОВ' };
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return { isValid: false, message: 'ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ТОЛЬКО АНГЛИЙСКИЕ БУКВЫ И ЦИФРЫ' };
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      return { isValid: false, message: 'ПАРОЛЬ ДОЛЖЕН СОДЕРЖАТЬ ХОТЯ БЫ ОДНУ БУКВУ' };
    }
    
    return { isValid: true, message: '' };
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация имени
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      setError('ИМЯ ' + firstNameValidation.message);
      return;
    }

    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
      setError('ФАМИЛИЯ ' + lastNameValidation.message);
      return;
    }

    if (formData.patronymic && formData.patronymic.length > 0) {
      const patronymicValidation = validateName(formData.patronymic);
      if (!patronymicValidation.isValid) {
        setError('ОТЧЕСТВО ' + patronymicValidation.message);
        return;
      }
    }

    // Валидация пароля, если он изменяется
    if (formData.newPassword) {
      if (!formData.password) {
        setError('ВВЕДИТЕ ТЕКУЩИЙ ПАРОЛЬ');
        return;
      }

      if (formData.password !== currentUser?.password) {
        setError('НЕВЕРНЫЙ ТЕКУЩИЙ ПАРОЛЬ');
        return;
      }

      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.message);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('ПАРОЛИ НЕ СОВПАДАЮТ');
        return;
      }
    }

    const updates: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      patronymic: formData.patronymic || undefined,
      email: formData.email,
    };

    if (formData.newPassword) {
      updates.password = formData.newPassword;
    }

    if (avatar) {
      updates.avatar = avatarPreview;
    }

    updateCurrentUser(updates);
    onClose();
  };

  // Статистика пользователя
  const userBoards = boards.filter(board => currentUser?.boardIds.includes(board.id));
  const userTasks = tasks.filter(task => task.assigneeIds.includes(currentUser?.id || ''));
  const completedTasks = userTasks.filter(task => task.status === 'completed');
  const inProgressTasks = userTasks.filter(task => task.status === 'in-progress');

  // Статистика по доскам
  const boardStats = userBoards.map(board => {
    const boardTasks = tasks.filter(task => 
      task.boardId === board.id && task.assigneeIds.includes(currentUser?.id || '')
    );
    return {
      board,
      totalTasks: boardTasks.length,
      completedTasks: boardTasks.filter(task => task.status === 'completed').length,
      inProgressTasks: boardTasks.filter(task => task.status === 'in-progress').length,
    };
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 uppercase">ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-6 text-center font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeTab === 'profile' ? '#b6c2fc' : '#a4d2fc' }}
          >
            <User className="w-4 h-4 inline mr-2" />
            ПРОФИЛЬ
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-6 text-center font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeTab === 'stats' ? '#b6c2fc' : '#a4d2fc' }}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            СТАТИСТИКА
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Аватар */}
              <div className="text-center">
                <div className="relative inline-block">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-gray-200">
                      {currentUser?.firstName?.charAt(0).toUpperCase()}{currentUser?.lastName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2 uppercase">НАЖМИТЕ НА ИКОНКУ ДЛЯ ЗАГРУЗКИ АВАТАРА</p>
              </div>

              {/* Имя и фамилия */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                    ИМЯ *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                    ФАМИЛИЯ *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Отчество */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  ОТЧЕСТВО (НЕОБЯЗАТЕЛЬНО)
                </label>
                <input
                  type="text"
                  value={formData.patronymic}
                  onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Email и Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                    ИМЯ ПОЛЬЗОВАТЕЛЯ
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1 uppercase">ИМЯ ПОЛЬЗОВАТЕЛЯ НЕЛЬЗЯ ИЗМЕНИТЬ</p>
                </div>
              </div>

              {/* Смена пароля */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">СМЕНА ПАРОЛЯ</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                      ТЕКУЩИЙ ПАРОЛЬ
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Введите текущий пароль"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                      НОВЫЙ ПАРОЛЬ
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Введите новый пароль"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                      ПОДТВЕРДИТЕ НОВЫЙ ПАРОЛЬ
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Подтвердите новый пароль"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium uppercase"
                >
                  ОТМЕНА
                </button>
                
                <button
                  type="submit"
                  className="flex items-center space-x-2 text-gray-800 px-6 py-3 rounded-xl transition-all font-medium uppercase"
                  style={{ backgroundColor: '#b6c2fc' }}
                >
                  <Save className="w-4 h-4" />
                  <span>СОХРАНИТЬ</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-6">
              {/* Общая статистика */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{userTasks.length}</div>
                  <div className="text-sm text-blue-700 uppercase">ВСЕГО ЗАДАЧ</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                  <div className="text-sm text-green-700 uppercase">ВЫПОЛНЕНО</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{inProgressTasks.length}</div>
                  <div className="text-sm text-yellow-700 uppercase">В ПРОЦЕССЕ</div>
                </div>
              </div>

              {/* Статистика по доскам */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">СТАТИСТИКА ПО ДОСКАМ</h3>
                <div className="space-y-3">
                  {boardStats.map(stat => (
                    <div key={stat.board.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 uppercase">{stat.board.name}</h4>
                        <span className="text-sm text-gray-500 uppercase">КОД: {stat.board.code}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{stat.totalTasks}</div>
                          <div className="text-gray-500 uppercase">ВСЕГО</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{stat.completedTasks}</div>
                          <div className="text-gray-500 uppercase">ВЫПОЛНЕНО</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{stat.inProgressTasks}</div>
                          <div className="text-gray-500 uppercase">В ПРОЦЕССЕ</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${stat.totalTasks > 0 ? (stat.completedTasks / stat.totalTasks) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center uppercase">
                          {stat.totalTasks > 0 ? Math.round((stat.completedTasks / stat.totalTasks) * 100) : 0}% ВЫПОЛНЕНО
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}